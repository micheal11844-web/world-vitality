/**
 * The plan catalogue: what each tier includes and where its limits sit.
 *
 * This is the single source of truth for "what does Standard get?" — the
 * pricing page, the upgrade prompts and the server-side checks all read
 * it, so they cannot drift apart. It holds no prices on purpose: prices
 * live in Paystack's plan objects (see `paystack.ts`) and are decided
 * after the weather-data licence cost is known.
 *
 * **Rules that hold on every plan, and so are deliberately NOT
 * expressible here** (there is no feature key for them, so no tier can
 * switch them off):
 *   - official life-safety alerts are never paywalled;
 *   - the Public Explorer is always free;
 *   - people can always export and delete their own data;
 *   - cancelling is one click (Constitution §7, PRD B.8 — no dark patterns).
 * And a downgrade past a limit never deletes anything: items over the new
 * limit become read-only (see `isOverLimit` in `entitlements.ts`).
 *
 * `null` for a count means "no cap" (Enterprise terms are agreed per
 * customer, so there is no number to show).
 */

export const PLAN_IDS = ["basic", "standard", "premium", "enterprise"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

/** The two plans anyone can buy themselves, through Paystack. */
export const PAID_PLAN_IDS = ["standard", "premium"] as const;
export type PaidPlanId = (typeof PAID_PLAN_IDS)[number];

export type LimitKey = "workspaces" | "seats" | "savedItems";
export type Count = number | null;

export type FeatureKey =
  | "forecastOutlooks"
  | "csvExport"
  | "printReport"
  | "auditableReport"
  | "teamTools"
  | "emailAlerts"
  | "smsAlerts"
  | "auditLog"
  | "bulkExport"
  | "apiAccess"
  | "integrations"
  | "sso";

export type SupportTier = "community" | "email" | "priority" | "named";

export interface PlanDefinition {
  id: PlanId;
  label: string;
  /** Bought through Paystack by the customer themselves. Enterprise is invoiced. */
  selfServe: boolean;
  limits: Record<LimitKey, Count>;
  features: Record<FeatureKey, boolean>;
  support: SupportTier;
}

/**
 * Features listed on a plan but not built yet. Anything that shows the
 * person what a plan includes must hide these (or label them "coming"),
 * so we never sell something that does not exist.
 */
export const UNBUILT_FEATURES: ReadonlySet<FeatureKey> = new Set<FeatureKey>([
  "emailAlerts",
  "smsAlerts",
  "bulkExport",
  "apiAccess",
  "integrations",
  "sso",
]);

const NONE: Record<FeatureKey, boolean> = {
  forecastOutlooks: false,
  csvExport: false,
  printReport: false,
  auditableReport: false,
  teamTools: false,
  emailAlerts: false,
  smsAlerts: false,
  auditLog: false,
  bulkExport: false,
  apiAccess: false,
  integrations: false,
  sso: false,
};

const ALL: Record<FeatureKey, boolean> = {
  forecastOutlooks: true,
  csvExport: true,
  printReport: true,
  auditableReport: true,
  teamTools: true,
  emailAlerts: true,
  smsAlerts: true,
  auditLog: true,
  bulkExport: true,
  apiAccess: true,
  integrations: true,
  sso: true,
};

export const PLANS: Record<PlanId, PlanDefinition> = {
  basic: {
    id: "basic",
    label: "Basic",
    selfServe: false, // free: nothing to buy
    limits: { workspaces: 1, seats: 1, savedItems: 3 },
    features: { ...NONE },
    support: "community",
  },
  standard: {
    id: "standard",
    label: "Standard",
    selfServe: true,
    limits: { workspaces: 3, seats: 5, savedItems: 25 },
    features: {
      ...NONE,
      forecastOutlooks: true,
      csvExport: true,
      printReport: true,
      teamTools: true,
      emailAlerts: true,
    },
    support: "email",
  },
  premium: {
    id: "premium",
    label: "Premium",
    selfServe: true,
    limits: { workspaces: 10, seats: 25, savedItems: 100 },
    features: {
      ...NONE,
      forecastOutlooks: true,
      csvExport: true,
      printReport: true,
      auditableReport: true,
      teamTools: true,
      emailAlerts: true,
      smsAlerts: true,
      auditLog: true,
    },
    support: "priority",
  },
  enterprise: {
    id: "enterprise",
    label: "Enterprise",
    selfServe: false, // contact us; invoiced outside Paystack
    limits: { workspaces: null, seats: null, savedItems: null },
    features: { ...ALL },
    support: "named",
  },
};

export function isPlanId(value: unknown): value is PlanId {
  return typeof value === "string" && (PLAN_IDS as readonly string[]).includes(value);
}

export function isPaidPlanId(value: unknown): value is PaidPlanId {
  return typeof value === "string" && (PAID_PLAN_IDS as readonly string[]).includes(value);
}
