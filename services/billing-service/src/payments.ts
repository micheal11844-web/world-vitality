import type { PaidPlanId } from "./plans.js";

/**
 * A payment, and what a refund does to how it is shown.
 *
 * One `PaymentRecord` per successful Paystack payment, written by the webhook
 * (`charge.success`). The money itself stays at Paystack; this is the copy the
 * app uses to list payments and print a receipt (migration 0022).
 *
 * Refunds are tracked as a STATUS only — never an amount. Paystack's refund
 * webhooks do not say plainly which unit a refund amount is in, and a partial
 * refund would need summing across events, so an amount here would sometimes
 * be wrong. "A refund was processed for this payment" is always true and the
 * figure is in the Paystack dashboard and the customer's own bank.
 */

export type PaymentCurrency = "NGN" | "USD";
export type RefundStatus = "pending" | "processing" | "processed" | "failed";

export const REFUND_STATUSES: readonly RefundStatus[] = [
  "pending",
  "processing",
  "processed",
  "failed",
];

export interface PaymentRecord {
  /** Paystack's transaction reference. Unique; a refund event quotes it. */
  reference: string;
  userId: string;
  /** In the smallest unit (kobo / cents), as Paystack reports it. */
  amountMinor: number;
  currency: PaymentCurrency;
  /** `null` when the Paystack plan is not one of ours. */
  plan: PaidPlanId | null;
  /** ISO timestamp. */
  paidAt: string;
  /** `null` = never refunded. */
  refundStatus: RefundStatus | null;
}

/** What the screens show beside a payment. */
export type PaymentRefundState = "none" | "in_progress" | "processed" | "failed";

export function refundStateOf(payment: Pick<PaymentRecord, "refundStatus">): PaymentRefundState {
  switch (payment.refundStatus) {
    case "pending":
    case "processing":
      return "in_progress";
    case "processed":
      return "processed";
    case "failed":
      return "failed";
    default:
      return "none";
  }
}

/**
 * How far along each status is. A refund only moves forward: a delayed
 * "pending" must not undo a "processed", and a "processed" is final. A
 * "failed" sits above "processing" (a refund that was being processed can
 * fail) but below "processed" (Paystack can retry a failed refund, and the
 * retry's success is the last word).
 */
const RANK: Record<RefundStatus, number> = { pending: 0, processing: 1, failed: 2, processed: 3 };

export interface RefundChange {
  /** The payment as it should now be stored. */
  payment: PaymentRecord;
  /** Did this event change anything? `false` for a repeat or an older status. */
  changed: boolean;
  /** True only when this event is the one that made the refund `processed`. */
  becameProcessed: boolean;
}

/** Applies a `refund.*` status to a payment. Pure and idempotent. */
export function applyRefundStatus(payment: PaymentRecord, status: RefundStatus): RefundChange {
  const current = payment.refundStatus;
  const moves = current === null || RANK[status] > RANK[current];
  // A retry after a failed refund starts again at "pending"; let it through
  // (it is not older than the failure, it is newer).
  const retriedAfterFailure =
    current === "failed" && (status === "pending" || status === "processing");
  if (!moves && !retriedAfterFailure) return { payment, changed: false, becameProcessed: false };
  return {
    payment: { ...payment, refundStatus: status },
    changed: true,
    becameProcessed: status === "processed" && current !== "processed",
  };
}
