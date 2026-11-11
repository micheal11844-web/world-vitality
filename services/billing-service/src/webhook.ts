import { parsePaystackEvent, verifyPaystackSignature } from "./paystack.js";
import { applyPaystackEvent, type SubscriptionState } from "./subscription.js";
import { applyRefundStatus, type RefundStatus } from "./payments.js";
import type { PaidPlanId } from "./plans.js";
import type { BillingStore } from "./store.js";

/**
 * The whole of "a Paystack webhook arrived", from raw bytes to stored
 * result, with no HTTP framework in sight so it can be tested directly.
 * The route handler in apps/web only reads the body and headers, calls
 * this, and turns the result into a response.
 *
 * Order of work, and why:
 *  1. Verify the signature FIRST, on the raw body. Nothing else is read
 *     from an unsigned request.
 *  2. Parse. A signed body we cannot parse is acknowledged (200) and
 *     recorded as ignored — retrying the identical bytes cannot help.
 *  3. Skip if this exact event was already handled.
 *  4. Work out whose subscription it is, keep the payment (a `charge.success`
 *     is also a payment the person can later see and print a receipt for),
 *     apply the transition, save it. A `refund.*` event instead finds the
 *     payment by its reference and moves its refund status forward.
 *  5. Only then record the event as handled. If the process dies between
 *     4 and 5, Paystack's retry re-applies the same idempotent transition;
 *     the other order would silently lose the update.
 *
 * Anything that goes wrong in the store THROWS, and the caller answers
 * 500 so Paystack retries (3-minute intervals, then hourly, for 72 hours
 * per Paystack's docs). Anything that is merely unrecognised gets 200 —
 * Paystack treats any non-200 as a failure and keeps retrying.
 */

/** What an applied event changed, for the courtesies that follow it. */
export interface AppliedEvent {
  userId: string;
  /** Paystack's event name, e.g. `invoice.payment_failed`. */
  type: string;
  /**
   * The subscription as it is now. `null` for an event that did not touch one
   * (a refund, or a payment that arrives before its subscription exists).
   */
  state: SubscriptionState | null;
  /** Set for a refund event that moved a payment's refund forward. */
  refund?: AppliedRefund;
}

/** A refund event that changed a payment, for the courtesies that follow it. */
export interface AppliedRefund {
  /** The payment's Paystack reference. */
  reference: string;
  status: RefundStatus;
  /** True only for the event that made the refund `processed`. */
  becameProcessed: boolean;
  /** The plan the payment was for, if it was one of ours. */
  plan: PaidPlanId | null;
}

export interface WebhookDeps {
  secret: string;
  store: BillingStore;
  planFor: (planCode: string | null) => PaidPlanId | null;
  now?: () => Date;
  /**
   * Called once an event has been applied and recorded, for things that
   * follow from it (telling the owner their payment failed). Never part of
   * the event's success: if it throws, the error is dropped and Paystack
   * still gets its 200, because a retry would re-apply a transition that
   * already happened. It must do its own logging.
   */
  onApplied?: (event: AppliedEvent) => Promise<void> | void;
}

export type WebhookResult =
  | { status: 200; outcome: "applied" | "ignored" | "duplicate"; reason?: string }
  | { status: 401; error: "bad_signature" };

export async function handlePaystackWebhook(
  deps: WebhookDeps,
  rawBody: string,
  signature: string | null,
): Promise<WebhookResult> {
  if (!verifyPaystackSignature(rawBody, signature, deps.secret)) {
    return { status: 401, error: "bad_signature" };
  }

  const parsed = parsePaystackEvent(rawBody);
  if (!parsed.ok) return { status: 200, outcome: "ignored", reason: parsed.reason };
  const { event } = parsed;
  const { store } = deps;

  if (await store.hasEvent(event.key)) return { status: 200, outcome: "duplicate" };

  const finish = async (
    outcome: "applied" | "ignored",
    reason: string | null,
    userId: string | null,
  ): Promise<WebhookResult> => {
    await store.recordEvent({ key: event.key, type: event.type, outcome, reason, userId });
    return reason ? { status: 200, outcome, reason } : { status: 200, outcome };
  };

  // A refund names the payment, and the payment names the person — no need to
  // guess from emails. A refund for a payment we never recorded (one made
  // before payments were kept, or one we could not read) has nobody to tell
  // and nothing to update: acknowledged, and visible in `billing_events`.
  if (event.refund) {
    const payment = await store.getPayment(event.refund.reference);
    if (!payment) return finish("ignored", "unknown_payment", null);
    const change = applyRefundStatus(payment, event.refund.status);
    if (!change.changed) return finish("ignored", "refund_no_change", payment.userId);
    await store.setRefundStatus(payment.reference, event.refund.status);
    const done = await finish("applied", null, payment.userId);
    await notify(deps, {
      userId: payment.userId,
      type: event.type,
      state: null,
      refund: {
        reference: payment.reference,
        status: event.refund.status,
        becameProcessed: change.becameProcessed,
        plan: payment.plan,
      },
    });
    return done;
  }

  // Whose is it? The subscription code is the most specific handle; the
  // customer code is next; the account email (given to Paystack at
  // checkout) is how the very first event finds the person.
  let current = event.subscriptionCode
    ? await store.findSubscriptionBySubscriptionCode(event.subscriptionCode)
    : null;
  let userId = current?.userId ?? null;
  if (!userId && event.customerCode)
    userId = await store.findUserIdByCustomerCode(event.customerCode);
  if (!userId && event.email) userId = await store.findUserIdByEmail(event.email);
  if (!userId) return finish("ignored", "unknown_customer", null);

  if (!current || current.userId !== userId) current = await store.getSubscription(userId);

  // A successful charge is a payment whatever it does to the plan — the first
  // one arrives before the subscription exists, a renewal changes nothing, a
  // retry after a failure ends a past-due patch. Kept first, so the plan
  // moving (or not) never decides whether the person can see their receipt.
  // Idempotent by reference: a retry of this webhook cannot make a second row.
  const payment = event.payment;
  if (payment) {
    await store.recordPayment({
      reference: payment.reference,
      userId,
      amountMinor: payment.amountMinor,
      currency: payment.currency,
      plan: deps.planFor(event.planCode),
      paidAt: payment.paidAt ?? (deps.now ?? (() => new Date()))().toISOString(),
    });
  }

  const result = applyPaystackEvent(current, event, {
    userId,
    planFor: deps.planFor,
    now: (deps.now ?? (() => new Date()))(),
  });
  if (result.outcome === "ignored") {
    // The payment alone is a reason to call the event applied; say so, so
    // `billing_events` shows why nothing happened to the plan.
    return payment
      ? finish("applied", "payment_recorded", userId)
      : finish("ignored", result.reason, userId);
  }

  await store.saveSubscription(result.state);
  const done = await finish("applied", null, userId);
  await notify(deps, { userId, type: event.type, state: result.state });
  return done;
}

/** Runs `onApplied`, dropping any error; see `WebhookDeps.onApplied`. */
async function notify(deps: WebhookDeps, event: AppliedEvent): Promise<void> {
  if (!deps.onApplied) return;
  try {
    await deps.onApplied(event);
  } catch {
    // A courtesy after the fact; see `WebhookDeps.onApplied`.
  }
}
