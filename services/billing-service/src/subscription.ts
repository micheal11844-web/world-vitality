import type { PaidPlanId, PlanId } from "./plans.js";
import type { PaystackEvent } from "./paystack.js";

/**
 * A person's subscription, and how Paystack events change it.
 *
 * Nobody with a free Basic plan has a row at all — "no subscription" IS
 * Basic. A row exists once someone has paid (source "paystack") or been
 * put on a plan by hand (source "manual": Enterprise, invoiced outside
 * Paystack, set with SQL — see docs/runbooks/billing.md).
 *
 * The state machine is a pure function so it can be tested without a
 * database, and it is written to be safe under what webhooks really do:
 * the same event delivered twice, events arriving out of order, and
 * events for things we do not recognise. Every transition is idempotent.
 */

export type SubscriptionStatus = "active" | "non_renewing" | "past_due" | "cancelled";
export type SubscriptionSource = "paystack" | "manual";

export interface SubscriptionState {
  userId: string;
  /** Only paid plans or enterprise ever have a row. */
  plan: Exclude<PlanId, "basic">;
  status: SubscriptionStatus;
  source: SubscriptionSource;
  currency: "NGN" | "USD" | null;
  customerCode: string | null;
  subscriptionCode: string | null;
  /** ISO. For `non_renewing`: the end of the term they already paid for. */
  currentPeriodEnd: string | null;
  /** ISO. When the most recent failed payment happened, while `past_due`. */
  pastDueSince: string | null;
  updatedAt: string;
}

export type ApplyResult =
  { outcome: "applied"; state: SubscriptionState } | { outcome: "ignored"; reason: string };

export interface ApplyContext {
  userId: string;
  planFor: (planCode: string | null) => PaidPlanId | null;
  now: Date;
}

function asCurrency(value: string | null): "NGN" | "USD" | null {
  const upper = value?.toUpperCase();
  return upper === "NGN" || upper === "USD" ? upper : null;
}

function validIso(value: string | null): string | null {
  if (!value) return null;
  const t = Date.parse(value);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

/** Does this event concern the subscription we hold? */
function concerns(current: SubscriptionState, event: PaystackEvent): boolean {
  if (event.subscriptionCode) return current.subscriptionCode === event.subscriptionCode;
  if (event.customerCode) return current.customerCode === event.customerCode;
  return false;
}

export function applyPaystackEvent(
  current: SubscriptionState | null,
  event: PaystackEvent,
  ctx: ApplyContext,
): ApplyResult {
  if (current?.source === "manual") {
    // A hand-set plan (Enterprise) is never changed by payment events.
    return { outcome: "ignored", reason: "manual_subscription" };
  }
  const updatedAt = ctx.now.toISOString();

  switch (event.type) {
    case "subscription.create": {
      if (!event.subscriptionCode) return { outcome: "ignored", reason: "no_subscription_code" };
      const plan = ctx.planFor(event.planCode);
      if (!plan) return { outcome: "ignored", reason: "unknown_plan" };
      if (
        current &&
        current.subscriptionCode === event.subscriptionCode &&
        current.status === "cancelled"
      ) {
        // A late or replayed "create" must not bring a cancelled one back.
        // Genuinely re-subscribing gives a new subscription code.
        return { outcome: "ignored", reason: "stale_create" };
      }
      return {
        outcome: "applied",
        state: {
          userId: ctx.userId,
          plan,
          status: "active",
          source: "paystack",
          currency: asCurrency(event.currency) ?? current?.currency ?? null,
          customerCode: event.customerCode ?? current?.customerCode ?? null,
          subscriptionCode: event.subscriptionCode,
          currentPeriodEnd: validIso(event.nextPaymentDate),
          pastDueSince: null,
          updatedAt,
        },
      };
    }

    case "subscription.not_renew": {
      if (!current || !concerns(current, event)) {
        return { outcome: "ignored", reason: "no_matching_subscription" };
      }
      if (current.status === "cancelled")
        return { outcome: "ignored", reason: "already_cancelled" };
      return {
        outcome: "applied",
        state: {
          ...current,
          status: "non_renewing",
          currentPeriodEnd: validIso(event.nextPaymentDate) ?? current.currentPeriodEnd,
          pastDueSince: null,
          updatedAt,
        },
      };
    }

    case "subscription.disable": {
      if (!current || !concerns(current, event)) {
        return { outcome: "ignored", reason: "no_matching_subscription" };
      }
      return {
        outcome: "applied",
        state: { ...current, status: "cancelled", pastDueSince: null, updatedAt },
      };
    }

    case "invoice.payment_failed": {
      if (!current || !concerns(current, event)) {
        return { outcome: "ignored", reason: "no_matching_subscription" };
      }
      // Only a subscription that is still being charged can fall behind.
      if (current.status !== "active" && current.status !== "past_due") {
        return { outcome: "ignored", reason: "not_billable" };
      }
      return {
        outcome: "applied",
        state: {
          ...current,
          status: "past_due",
          // Keep the original date on repeat failures: the grace period
          // counts from when it first went wrong.
          pastDueSince: current.pastDueSince ?? updatedAt,
          updatedAt,
        },
      };
    }

    case "charge.success": {
      // A successful charge only matters here as the end of a bad patch.
      if (current?.status === "past_due" && concerns(current, event)) {
        return {
          outcome: "applied",
          state: { ...current, status: "active", pastDueSince: null, updatedAt },
        };
      }
      return { outcome: "ignored", reason: "no_change" };
    }

    default:
      return { outcome: "ignored", reason: "unhandled_event" };
  }
}
