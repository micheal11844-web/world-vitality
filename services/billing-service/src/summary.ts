import { effectivePlan, PAST_DUE_GRACE_DAYS } from "./entitlements.js";
import type { PaidPlanId, PlanId } from "./plans.js";
import type { Currency } from "./paystack.js";
import type { SubscriptionState } from "./subscription.js";

/**
 * What the plan screen needs to know about one subscription, decided in one
 * place so the screen itself has no billing rules in it. Pure: give it the
 * subscription row (or `null`) and the time.
 *
 * States:
 *  - `free`      — Basic: no subscription, or one that has ended or lapsed.
 *  - `active`    — paying; renews on its own.
 *  - `ending`    — cancelled but already paid: the plan stays until `endsOn`.
 *  - `past_due`  — a payment failed; the plan stays through a grace period
 *                  (`graceEndsOn`) while the person updates their card.
 *  - `manual`    — set by hand (Enterprise, invoiced): nothing to manage here.
 *
 * One deliberate limit: **changing plan while subscribed is not offered** —
 * Paystack has no "switch plan" on a running subscription, so the honest
 * route is to cancel and subscribe to the other plan once it ends. The
 * screen says so rather than hiding it.
 */
export type BillingState = "free" | "active" | "ending" | "past_due" | "manual";

export interface BillingSummary {
  /** The plan in force right now (what limits and features follow). */
  plan: PlanId;
  state: BillingState;
  /** The paid plan the subscription is for, when there is a live one. */
  subscribedPlan: Exclude<PlanId, "basic"> | null;
  currency: Currency | null;
  /** ISO. For `ending`: when the paid term runs out (null if Paystack never said). */
  endsOn: string | null;
  /** ISO. For `past_due`: when the grace period runs out (null if unknown). */
  graceEndsOn: string | null;
  /** May the person update their card or cancel from the plan screen? */
  canManage: boolean;
  /** May the person start a new subscription from the plan screen? */
  canSubscribe: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function summariseBilling(sub: SubscriptionState | null, now: Date): BillingSummary {
  const free = (canManage = false): BillingSummary => ({
    plan: "basic",
    state: "free",
    subscribedPlan: null,
    currency: sub?.currency ?? null,
    endsOn: null,
    graceEndsOn: null,
    canManage,
    canSubscribe: true,
  });
  if (!sub) return free();

  const plan = effectivePlan(sub, now);
  const hasPaystackSubscription = sub.source === "paystack" && Boolean(sub.subscriptionCode);

  if (plan === "basic") {
    // A subscription that stopped paying can still have its card fixed.
    return free(hasPaystackSubscription && sub.status === "past_due");
  }
  if (sub.source === "manual") {
    return {
      plan,
      state: "manual",
      subscribedPlan: sub.plan,
      currency: sub.currency,
      endsOn: null,
      graceEndsOn: null,
      canManage: false,
      canSubscribe: false,
    };
  }

  const base = {
    plan,
    subscribedPlan: sub.plan as PaidPlanId,
    currency: sub.currency,
    canSubscribe: false,
  };
  switch (sub.status) {
    case "non_renewing":
      return {
        ...base,
        state: "ending",
        endsOn: sub.currentPeriodEnd,
        graceEndsOn: null,
        canManage: false,
      };
    case "past_due": {
      const since = sub.pastDueSince ? Date.parse(sub.pastDueSince) : NaN;
      return {
        ...base,
        state: "past_due",
        endsOn: null,
        graceEndsOn: Number.isNaN(since)
          ? null
          : new Date(since + PAST_DUE_GRACE_DAYS * DAY_MS).toISOString(),
        canManage: hasPaystackSubscription,
      };
    }
    default:
      return {
        ...base,
        state: "active",
        endsOn: null,
        graceEndsOn: null,
        canManage: hasPaystackSubscription,
      };
  }
}
