import { cache } from "react";
import {
  featureLockedDetails,
  type Entitlements,
  type FeatureKey,
} from "@world-vitality/billing-service";
import type { MessageKey } from "@world-vitality/i18n";
import { getEntitlementsForOrganization, billingEnabled } from "./billing";
import { getAccessContext } from "./get-access-context";
import { getTranslator } from "./i18n/server";
import { logApplication } from "./logger";
import { PLAN_NAME_KEYS } from "./plan-limits";

/**
 * The plan's on/off switches, as a screen asks about them (BUILD_PLAN "v98").
 *
 * Returns the sentence to show where the feature would have been (`string`),
 * or `null` when the person has it. A screen renders its normal content on
 * `null` and a plan notice otherwise.
 *
 * Same three rules as the plan limits in `plan-limits.ts`:
 *  - **Billing off ⇒ `null`, immediately.** No session lookup, no database
 *    read; building the switches changed nothing anyone can do today.
 *  - **Fails open.** If the person's plan cannot be read, they keep the
 *    feature and the error is logged — a payment-system fault must not take
 *    something away from a customer.
 *  - **It decides what a screen OFFERS, not who may see data.** Everything
 *    here is a convenience on top of data the person can already read on the
 *    page (a forecast card, a download or print button); it is not access
 *    control, and nothing saved is ever hidden or deleted over a plan.
 *
 * The plan is the organisation's, i.e. its owner's, so a member sees what the
 * organisation has paid for.
 */
/** One plan lookup per organisation per request, however many switches a page asks about. */
const entitlementsForRequest = cache((organizationId: string) =>
  getEntitlementsForOrganization(organizationId),
);

const FEATURE_NAME_KEYS: Record<FeatureKey, MessageKey> = {
  forecastOutlooks: "billing.feature.name.forecastOutlooks",
  csvExport: "billing.feature.name.csvExport",
  printReport: "billing.feature.name.printReport",
  auditableReport: "billing.feature.name.auditableReport",
  teamTools: "billing.feature.name.teamTools",
  emailAlerts: "billing.feature.name.emailAlerts",
  smsAlerts: "billing.feature.name.smsAlerts",
  auditLog: "billing.feature.name.auditLog",
  bulkExport: "billing.feature.name.bulkExport",
  apiAccess: "billing.feature.name.apiAccess",
  integrations: "billing.feature.name.integrations",
  sso: "billing.feature.name.sso",
};

/**
 * The sentence for a feature the plan does not include, in the reader's
 * language: `null` when they have it. The facts come from the billing
 * service (`featureLockedDetails`) and the wording from the catalog; in
 * English it reads exactly as the billing service's `featureLockedMessage`.
 */
export async function featureLockedText(
  entitlements: Entitlements,
  feature: FeatureKey,
): Promise<string | null> {
  const locked = featureLockedDetails(entitlements, feature);
  if (!locked) return null;
  const { t } = await getTranslator();
  const name = t(FEATURE_NAME_KEYS[feature]);
  const plan = t(PLAN_NAME_KEYS[locked.plan]);
  if (!locked.lowest) {
    return t(locked.plural ? "billing.feature.notPartMany" : "billing.feature.notPart", {
      name,
      plan,
    });
  }
  return t(locked.plural ? "billing.feature.includedMany" : "billing.feature.included", {
    name,
    lowest: t(PLAN_NAME_KEYS[locked.lowest]),
    plan,
  });
}

export async function featureLockedFor(feature: FeatureKey): Promise<string | null> {
  if (!billingEnabled()) return null;
  try {
    const access = await getAccessContext();
    if (!access) return null;
    const entitlements = await entitlementsForRequest(access.organization.organizationId);
    return await featureLockedText(entitlements, feature);
  } catch (err) {
    logApplication.error("feature_check_failed", err, { feature });
    return null;
  }
}
