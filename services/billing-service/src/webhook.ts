import { parsePaystackEvent, verifyPaystackSignature } from "./paystack.js";
import { applyPaystackEvent, type SubscriptionState } from "./subscription.js";
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
 *  4. Work out whose subscription it is, apply the transition, save it.
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
  /** The subscription as it is now. */
  state: SubscriptionState;
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

  const result = applyPaystackEvent(current, event, {
    userId,
    planFor: deps.planFor,
    now: (deps.now ?? (() => new Date()))(),
  });
  if (result.outcome === "ignored") return finish("ignored", result.reason, userId);

  await store.saveSubscription(result.state);
  const done = await finish("applied", null, userId);
  if (deps.onApplied) {
    try {
      await deps.onApplied({ userId, type: event.type, state: result.state });
    } catch {
      // A courtesy after the fact; see `WebhookDeps.onApplied`.
    }
  }
  return done;
}
