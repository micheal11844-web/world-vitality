"use server";

import {
  PAID_PLAN_IDS,
  PRICE_CURRENCIES,
  createManageLink,
  disableSubscription,
  startCheckout,
  summariseBilling,
  type BillingSummary,
  type Currency,
  type Interval,
  type PaidPlanId,
} from "@world-vitality/billing-service";
import { getAccountService } from "./account";
import {
  billingEnabled,
  billingReturnUrl,
  getBillingStore,
  getOfferedPrices,
  getPlanCodes,
  paystackApiBase,
  paystackSecret,
} from "./billing";
import { getAccessContext } from "./get-access-context";
import { getSessionUserId } from "./get-session-user-id";
import { tServer } from "./i18n/server";
import { logApplication, logSecurity } from "./logger";

/**
 * What a billing button hands back. `url` is where the browser goes next
 * (Paystack's checkout page, or its card page); the client navigates there
 * with a full page load.
 */
export interface BillingActionResult {
  ok: boolean;
  error?: string;
  url?: string;
}

interface OwnerContext {
  userId: string;
  summary: BillingSummary;
  subscriptionCode: string | null;
}

/**
 * Every billing button goes through here. It acts on the signed-in person's
 * own id only (nothing from the browser says whose subscription this is),
 * and only if they own their organisation — the plan belongs to the owner,
 * so a member has nothing to buy or cancel. Billing off ⇒ unavailable, so
 * these actions do nothing at all until `BILLING_ENABLED` is switched on.
 */
async function ownerContext(): Promise<OwnerContext | { error: string }> {
  if (!billingEnabled()) return { error: await tServer("errors.billingUnavailable") };
  const userId = await getSessionUserId();
  if (!userId) return { error: await tServer("errors.sessionExpired") };

  try {
    const access = await getAccessContext();
    if (!access || access.organization.role !== "owner" || access.organization.ownerId !== userId) {
      return { error: await tServer("errors.billingOwnerOnly") };
    }
    const subscription = await getBillingStore().getSubscription(userId);
    return {
      userId,
      summary: summariseBilling(subscription, new Date()),
      subscriptionCode: subscription?.source === "paystack" ? subscription.subscriptionCode : null,
    };
  } catch (err) {
    logApplication.error("billing_action_context_failed", err, { userId });
    return { error: await tServer("errors.billingUnavailable") };
  }
}

function isPaidPlan(value: unknown): value is PaidPlanId {
  return typeof value === "string" && (PAID_PLAN_IDS as readonly string[]).includes(value);
}
function isCurrency(value: unknown): value is Currency {
  return typeof value === "string" && (PRICE_CURRENCIES as readonly string[]).includes(value);
}
function isInterval(value: unknown): value is Interval {
  return value === "monthly" || value === "annual";
}

/**
 * Subscribe: asks Paystack for a hosted checkout page for one of the plans
 * that is actually on sale (a price with no Paystack plan behind it is
 * refused, whatever the browser sent) and returns its address. Nothing is
 * charged here and no subscription exists until the person pays on
 * Paystack's page — the webhook is what turns that payment into a plan.
 */
export async function startCheckoutAction(input: {
  plan: string;
  currency: string;
  interval: string;
}): Promise<BillingActionResult> {
  const { plan, currency, interval } = input ?? {};
  if (!isPaidPlan(plan) || !isCurrency(currency) || !isInterval(interval)) {
    return { ok: false, error: await tServer("errors.billingNotOffered") };
  }
  const offered = getOfferedPrices().some(
    (p) => p.plan === plan && p.currency === currency && p.interval === interval,
  );
  if (!offered) return { ok: false, error: await tServer("errors.billingNotOffered") };

  const context = await ownerContext();
  if ("error" in context) return { ok: false, error: context.error };
  if (!context.summary.canSubscribe) {
    return { ok: false, error: await tServer("errors.billingAlreadySubscribed") };
  }

  const secret = paystackSecret();
  const callbackUrl = billingReturnUrl();
  if (!secret || !callbackUrl) {
    logApplication.error(
      "billing_checkout_not_configured",
      new Error(secret ? "SUPABASE_AUTH_REDIRECT_URL is missing or not a URL" : "no secret key"),
    );
    return { ok: false, error: await tServer("errors.billingUnavailable") };
  }

  let email: string;
  try {
    email = (await getAccountService().getProfile(context.userId)).email;
  } catch (err) {
    logApplication.error("billing_checkout_profile_failed", err, { userId: context.userId });
    return { ok: false, error: await tServer("billing.subscribe.failed") };
  }

  const deps = { secret, fetch, baseUrl: paystackApiBase() };

  // A lapsed subscription (a failed payment that was never fixed) may still
  // be alive on Paystack's side. Stop it before starting a new one so the
  // person is never charged for both. Best effort: a failure is logged, and
  // the new checkout still goes ahead.
  if (context.subscriptionCode && context.summary.state === "free") {
    const stopped = await disableSubscription(deps, context.subscriptionCode);
    if (!stopped.ok && stopped.reason !== "not_found") {
      logApplication.warn("billing_checkout_old_subscription_not_stopped", {
        userId: context.userId,
        reason: stopped.reason,
      });
    }
  }

  const result = await startCheckout(
    { secret, planCodes: getPlanCodes(), fetch, baseUrl: paystackApiBase() },
    { email, userId: context.userId, plan, currency, interval, callbackUrl },
  );
  if (!result.ok) {
    logApplication.error("billing_checkout_failed", new Error(result.reason), {
      userId: context.userId,
    });
    return { ok: false, error: await tServer("billing.subscribe.failed") };
  }
  logApplication.info("billing_checkout_started", { plan, currency, interval });
  return { ok: true, url: result.authorizationUrl };
}

/** A Paystack-hosted page where the owner changes the card their plan renews on. */
export async function openCardPageAction(): Promise<BillingActionResult> {
  const context = await ownerContext();
  if ("error" in context) return { ok: false, error: context.error };
  const secret = paystackSecret();
  if (!context.summary.canManage || !context.subscriptionCode || !secret) {
    return { ok: false, error: await tServer("errors.billingNotSubscribed") };
  }
  const result = await createManageLink(
    { secret, fetch, baseUrl: paystackApiBase() },
    context.subscriptionCode,
  );
  if (!result.ok) {
    logApplication.error("billing_manage_link_failed", new Error(result.reason), {
      userId: context.userId,
    });
    return { ok: false, error: await tServer("billing.manage.cardFailed") };
  }
  return { ok: true, url: result.link };
}

/**
 * Cancel: stops the subscription renewing. The person keeps the plan until
 * the end of the period they paid for; Paystack's `subscription.not_renew`
 * webhook is what records "ends on …", so this does not edit our own
 * records, and the page shows the new state once Paystack has confirmed it.
 * One click plus one confirmation — Constitution §7, no dark patterns.
 */
export async function cancelSubscriptionAction(): Promise<BillingActionResult> {
  const context = await ownerContext();
  if ("error" in context) return { ok: false, error: context.error };
  const secret = paystackSecret();
  if (!context.summary.canManage || !context.subscriptionCode || !secret) {
    return { ok: false, error: await tServer("errors.billingNotSubscribed") };
  }
  const result = await disableSubscription(
    { secret, fetch, baseUrl: paystackApiBase() },
    context.subscriptionCode,
  );
  if (!result.ok) {
    logApplication.error("billing_cancel_failed", new Error(result.reason), {
      userId: context.userId,
    });
    return { ok: false, error: await tServer("billing.manage.cancelFailed") };
  }
  logSecurity.info("billing_cancel_requested", { userId: context.userId });
  return { ok: true };
}
