import { cache } from "react";
import { featureLockedMessage, type FeatureKey } from "@world-vitality/billing-service";
import { getEntitlementsForOrganization, billingEnabled } from "./billing";
import { getAccessContext } from "./get-access-context";
import { logApplication } from "./logger";

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

export async function featureLockedFor(feature: FeatureKey): Promise<string | null> {
  if (!billingEnabled()) return null;
  try {
    const access = await getAccessContext();
    if (!access) return null;
    const entitlements = await entitlementsForRequest(access.organization.organizationId);
    return featureLockedMessage(entitlements, feature);
  } catch (err) {
    logApplication.error("feature_check_failed", err, { feature });
    return null;
  }
}
