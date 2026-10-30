import { disableSubscription } from "@world-vitality/billing-service";
import { billingEnabled, getBillingStore, paystackApiBase, paystackSecret } from "./billing";
import { logApplication } from "./logger";

/**
 * Stops a person's Paystack subscription from charging again, for use right
 * before their account is deleted (BUILD_PLAN v95). Without this a customer
 * who deleted their account would keep being billed by Paystack for a plan
 * attached to nobody.
 *
 * Server-side only, and deliberately NOT in `billing-actions.ts`: that file
 * is a "use server" module, so everything it exports is callable from the
 * browser, and this must only ever run on the signed-in person's own id.
 *
 * Results:
 *  - `none`      — nothing to cancel (billing off, no subscription, an
 *                  Enterprise/manual plan, or one already cancelled).
 *  - `cancelled` — Paystack confirmed it will not charge again.
 *  - `failed`    — billing is on and a live subscription could not be
 *                  confirmed stopped. The caller must NOT delete the account.
 *                  Failing closed here is the point: deleting anyway would
 *                  leave the customer paying for something they cannot reach.
 */
export type CancelOnDeletion = "none" | "cancelled" | "failed";

export async function cancelPaystackSubscriptionBeforeDeletion(
  userId: string,
): Promise<CancelOnDeletion> {
  if (!billingEnabled()) return "none";

  let subscription;
  try {
    subscription = await getBillingStore().getSubscription(userId);
  } catch (err) {
    logApplication.error("billing_cancel_on_delete_lookup_failed", err, { userId });
    return "failed";
  }

  if (!subscription || subscription.source !== "paystack" || !subscription.subscriptionCode) {
    return "none";
  }
  // Already not going to renew — nothing left to stop.
  if (subscription.status === "non_renewing" || subscription.status === "cancelled") {
    return "none";
  }

  const secret = paystackSecret();
  if (!secret) {
    logApplication.error(
      "billing_cancel_on_delete_no_secret",
      new Error("PAYSTACK_SECRET_KEY is not set"),
      { userId },
    );
    return "failed";
  }

  const result = await disableSubscription(
    { secret, fetch, baseUrl: paystackApiBase() },
    subscription.subscriptionCode,
  );
  if (result.ok) return "cancelled";
  // Paystack no longer knows the subscription: it cannot charge anyone.
  if (result.reason === "not_found") return "cancelled";
  logApplication.error("billing_cancel_on_delete_failed", new Error(result.reason), { userId });
  return "failed";
}
