import { createClient } from "@supabase/supabase-js";
import {
  SupabaseBillingStore,
  loadEntitlements,
  parsePlanCodes,
  planForPlanCode,
  type Entitlements,
  type PlanCodeMap,
} from "@world-vitality/billing-service";
import { logApplication } from "./logger";

/**
 * Server-side only — the billing switchboard (BUILD_PLAN "v90").
 *
 * Billing is OFF unless `BILLING_ENABLED` is exactly "true". While it is
 * off: the webhook route answers 404, nothing here touches the database,
 * and `getEntitlementsForUser` gives everyone the unlimited entitlements,
 * so building the plan system changes nothing anyone can do today.
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
 * Not called from any page yet, on purpose: seat, saved-item and workspace
 * limits need a customer-owned workspace to count against, and workspaces
 * are currently shared by everyone (docs/runbooks/billing.md, "Before
 * limits can be enforced").
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
