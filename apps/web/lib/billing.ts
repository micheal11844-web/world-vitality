import { createClient } from "@supabase/supabase-js";
import {
  SupabaseBillingStore,
  loadEntitlements,
  unlimitedEntitlements,
  parsePlanCodes,
  planForPlanCode,
  offeredPrices,
  paystackBaseUrl,
  type Entitlements,
  type OfferedPrice,
  type PlanCodeMap,
} from "@world-vitality/billing-service";
import { getAccountService } from "./account";
import { logApplication } from "./logger";

/**
 * Server-side only — the billing switchboard (BUILD_PLAN "v90").
 *
 * Billing is OFF unless `BILLING_ENABLED` is exactly "true". While it is
 * off: the webhook route answers 404, nothing here touches the database,
 * and `getEntitlementsForUser` / `getEntitlementsForOrganization` give
 * everyone the unlimited entitlements, so building the plan system changes
 * nothing anyone can do today.
 *
 * Same construction and same rule as `getAccountService()`: the
 * service-role key never reaches a Client Component.
 */
export function billingEnabled(): boolean {
  return process.env.BILLING_ENABLED === "true";
}

export function getBillingStore(): SupabaseBillingStore {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Missing Supabase env vars (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY). " +
        "See services/identity-service/.env.example and docs/onboarding/repository-setup.md.",
    );
  }
  return new SupabaseBillingStore(createClient(supabaseUrl, supabaseServiceRoleKey));
}

/** Paystack plan codes from `PAYSTACK_PLAN_CODES` (see services/billing-service/.env.example). */
export function getPlanCodes(): PlanCodeMap {
  return parsePlanCodes(process.env.PAYSTACK_PLAN_CODES);
}

export function planForCode(planCode: string | null) {
  return planForPlanCode(getPlanCodes(), planCode);
}

/**
 * What this person's plan allows. Unlimited while billing is off, and
 * unlimited (with the error logged) if their subscription cannot be read —
 * a payment-system hiccup must never lock someone out of their own data.
 *
 * Entitlements belong to a PERSON (their subscription); what an organisation
 * may do is its owner's — see `getEntitlementsForOrganization`, which is
 * what the seat and saved-item checks use.
 */
export function getEntitlementsForUser(userId: string): Promise<Entitlements> {
  return loadEntitlements(
    {
      enabled: billingEnabled(),
      getSubscription: (id) => getBillingStore().getSubscription(id),
      onError: (err) => logApplication.error("entitlement_lookup_failed", err),
    },
    userId,
  );
}

/**
 * What an organisation's plan allows: its owner's plan. Seats are counted
 * across the organisation and saved items across everything it owns, so the
 * limits apply to the organisation as a whole, whoever in it is acting.
 *
 * Same two rules as above: unlimited while billing is off (without touching
 * the database), and unlimited — with the error logged — if the owner or
 * their subscription cannot be read.
 */
export async function getEntitlementsForOrganization(
  organizationId: string,
): Promise<Entitlements> {
  if (!billingEnabled()) return unlimitedEntitlements("billing_off");
  try {
    const organization = await getAccountService().getOrganization(organizationId);
    if (!organization) return unlimitedEntitlements("lookup_failed");
    return await getEntitlementsForUser(organization.ownerId);
  } catch (err) {
    logApplication.error("organization_entitlement_lookup_failed", err);
    return unlimitedEntitlements("lookup_failed");
  }
}

/** `PAYSTACK_SECRET_KEY`, or `null` when it is not set (checkout then stays off). */
export function paystackSecret(): string | null {
  return process.env.PAYSTACK_SECRET_KEY?.trim() || null;
}

/**
 * Where Paystack's API is. Always Paystack's own address unless
 * `PAYSTACK_API_BASE` is set to an https address or a local one — which
 * exists only so the screens can be exercised against a stand-in server in
 * tests (`paystackBaseUrl` refuses anything else, so the secret key is never
 * sent to an unencrypted address).
 */
export function paystackApiBase(): string {
  return paystackBaseUrl(process.env.PAYSTACK_API_BASE);
}

/** What can be bought right now: only the prices with a Paystack plan behind them. */
export function getOfferedPrices(): OfferedPrice[] {
  return offeredPrices(getPlanCodes());
}

/**
 * Where Paystack sends someone back to after paying. Built from the site's
 * own address (the origin of `SUPABASE_AUTH_REDIRECT_URL`, which the sign-in
 * emails already rely on), never from the request's Host header, so a forged
 * header cannot point a customer's return trip somewhere else. `null` when
 * that setting is missing or is not a URL — checkout then declines rather
 * than guessing.
 */
export function billingReturnUrl(): string | null {
  const configured = process.env.SUPABASE_AUTH_REDIRECT_URL;
  if (!configured) return null;
  try {
    return `${new URL(configured).origin}/billing?checkout=return`;
  } catch {
    return null;
  }
}
