import {
  PLAN_IDS,
  PLANS,
  UNBUILT_FEATURES,
  type Count,
  type FeatureKey,
  type LimitKey,
  type PlanId,
  type SupportTier,
} from "./plans.js";
import type { SubscriptionState } from "./subscription.js";

/**
 * What a person may do right now: their plan's limits and features, and
 * whether any of it is actually being enforced.
 *
 * Two rules shape this file:
 *
 * 1. **While billing is off, nothing is limited.** `BILLING_ENABLED` is
 *    not set, so everyone gets the unlimited entitlements and the
 *    database is not even asked. Building the plan system must not
 *    change what anyone can do today.
 *
 * 2. **If billing cannot be read, fail open.** A payment-system hiccup
 *    must never lock a paying customer out of their own data, so an error
 *    while looking up a subscription gives the unlimited entitlements
 *    (and is reported through `onError`). Failing open can briefly give
 *    away a feature; failing closed can take someone's work away.
 */

export interface Entitlements {
  plan: PlanId;
  /** `false` = billing off or unreadable: nothing below should be enforced. */
  enforced: boolean;
  /** Why these entitlements apply — for logs and tests, never shown to people. */
  source: "billing_off" | "subscription" | "lookup_failed";
  limits: Record<LimitKey, Count>;
  features: Record<FeatureKey, boolean>;
  support: SupportTier;
}

export const PAST_DUE_GRACE_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

export function entitlementsFor(plan: PlanId): Entitlements {
  const def = PLANS[plan];
  return {
    plan,
    enforced: true,
    source: "subscription",
    limits: { ...def.limits },
    features: { ...def.features },
    support: def.support,
  };
}

/** Everyone, in full, with enforcement off. */
export function unlimitedEntitlements(source: "billing_off" | "lookup_failed"): Entitlements {
  const def = PLANS.enterprise;
  return {
    plan: "enterprise",
    enforced: false,
    source,
    limits: { ...def.limits },
    features: { ...def.features },
    support: def.support,
  };
}

/**
 * Which plan applies at `now`.
 *  - no subscription → Basic
 *  - active → the plan
 *  - non_renewing (cancelled, but already paid) → the plan until the end
 *    of the paid term; if we were never told when that is, until Paystack
 *    tells us the subscription is disabled
 *  - past_due → the plan through a grace period, then Basic
 *  - cancelled → Basic
 */
export function effectivePlan(sub: SubscriptionState | null, now: Date): PlanId {
  if (!sub) return "basic";
  switch (sub.status) {
    case "active":
      return sub.plan;
    case "non_renewing": {
      if (!sub.currentPeriodEnd) return sub.plan;
      return Date.parse(sub.currentPeriodEnd) > now.getTime() ? sub.plan : "basic";
    }
    case "past_due": {
      const since = sub.pastDueSince ? Date.parse(sub.pastDueSince) : NaN;
      if (Number.isNaN(since)) return sub.plan;
      return now.getTime() - since < PAST_DUE_GRACE_DAYS * DAY_MS ? sub.plan : "basic";
    }
    case "cancelled":
      return "basic";
  }
}

export interface EntitlementDeps {
  /** `BILLING_ENABLED === "true"`. */
  enabled: boolean;
  getSubscription: (userId: string) => Promise<SubscriptionState | null>;
  now?: () => Date;
  onError?: (err: unknown) => void;
}

export async function loadEntitlements(
  deps: EntitlementDeps,
  userId: string,
): Promise<Entitlements> {
  if (!deps.enabled) return unlimitedEntitlements("billing_off");
  try {
    const sub = await deps.getSubscription(userId);
    return entitlementsFor(effectivePlan(sub, (deps.now ?? (() => new Date()))()));
  } catch (err) {
    deps.onError?.(err);
    return unlimitedEntitlements("lookup_failed");
  }
}

/* ------------------------------------------------------------------ */
/* Questions the rest of the app asks                                  */
/* ------------------------------------------------------------------ */

export type LimitCheck =
  | { allowed: true; limit: Count; remaining: Count }
  | { allowed: false; limit: number; remaining: 0 };

/** May the person add ONE more of `key`, given how many they have now? */
export function checkLimit(e: Entitlements, key: LimitKey, current: number): LimitCheck {
  const limit = e.limits[key];
  if (!e.enforced || limit === null) return { allowed: true, limit, remaining: null };
  if (current >= limit) return { allowed: false, limit, remaining: 0 };
  return { allowed: true, limit, remaining: limit - current };
}

const LIMIT_NOUNS: Record<LimitKey, { one: string; many: string }> = {
  workspaces: { one: "workspace", many: "workspaces" },
  seats: { one: "person", many: "people" },
  savedItems: {
    one: "saved item (fields, insured properties and monitored locations count together)",
    many: "saved items (fields, insured properties and monitored locations count together)",
  },
};

/**
 * What to tell someone who has hit a limit. Names the plan and the number
 * and says how to get past it; never blames, never hides data.
 */
export function limitReachedMessage(e: Entitlements, key: LimitKey, limit: number): string {
  const noun = LIMIT_NOUNS[key];
  const plan = PLANS[e.plan].label;
  const what = limit === 1 ? noun.one : noun.many;
  return `Your ${plan} plan includes up to ${limit} ${what}. Upgrade your plan to add more.`;
}

/**
 * Have they more than the plan now allows (after a downgrade)? Such
 * extras are made read-only — never deleted — so this returns `true` only
 * for a count strictly above the limit.
 */
export function isOverLimit(e: Entitlements, key: LimitKey, current: number): boolean {
  const limit = e.limits[key];
  return e.enforced && limit !== null && current > limit;
}

export function hasFeature(e: Entitlements, feature: FeatureKey): boolean {
  return !e.enforced || e.features[feature];
}

/** How a feature is named in a sentence, and whether that name is plural ("are"). */
const FEATURE_NAMES: Record<FeatureKey, { name: string; plural: boolean }> = {
  forecastOutlooks: { name: "Forecast outlooks", plural: true },
  csvExport: { name: "CSV export", plural: false },
  printReport: { name: "Print and PDF export", plural: false },
  auditableReport: { name: "The auditable report", plural: false },
  teamTools: { name: "Team tools", plural: true },
  emailAlerts: { name: "Email alerts", plural: true },
  smsAlerts: { name: "SMS alerts", plural: true },
  auditLog: { name: "The audit log", plural: false },
  bulkExport: { name: "Bulk export", plural: false },
  apiAccess: { name: "API access", plural: false },
  integrations: { name: "Integrations", plural: true },
  sso: { name: "Single sign-on", plural: false },
};

/** The cheapest plan that includes the feature (plans are listed cheapest first). */
export function lowestPlanWith(feature: FeatureKey): PlanId | null {
  return PLAN_IDS.find((id) => PLANS[id].features[feature]) ?? null;
}

/**
 * What to show where a feature the plan does not include would have been:
 * `null` when the person has it (always, while billing is off or
 * unreadable), otherwise one plain sentence naming the feature, the plan
 * that includes it and the plan they are on. Never blames, and never
 * implies anything saved has gone — a locked feature is an extra, not
 * someone's data.
 */
export function featureLockedMessage(e: Entitlements, feature: FeatureKey): string | null {
  if (hasFeature(e, feature)) return null;
  const { name, plural } = FEATURE_NAMES[feature];
  const verb = plural ? "are" : "is";
  const lowest = lowestPlanWith(feature);
  if (!lowest) return `${name} ${verb} not part of the ${PLANS[e.plan].label} plan.`;
  return `${name} ${verb} included in the ${PLANS[lowest].label} plan and above. Your plan is ${PLANS[e.plan].label}.`;
}

/** Is the feature built at all? Anything that is not must not be offered. */
export function isFeatureBuilt(feature: FeatureKey): boolean {
  return !UNBUILT_FEATURES.has(feature);
}
