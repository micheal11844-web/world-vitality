import { checkLimit, limitReachedMessage } from "@world-vitality/billing-service";
import type { OrganizationData } from "@world-vitality/identity-service";
import { getEntitlementsForOrganization } from "./billing";
import { logApplication } from "./logger";

/**
 * The plan checks the app makes when someone ADDS something. Both return a
 * message to show (`string`) when the organisation's plan is full, or
 * `null` when the person may go ahead.
 *
 * While billing is off — today — `getEntitlementsForOrganization` gives
 * everyone unlimited entitlements without touching the database, so these
 * return `null` immediately and building them changed nothing anyone can
 * do. Like the rest of billing they fail OPEN: if the counts cannot be read
 * the person is let through (and it is logged), because failing closed
 * would stop a paying customer working over a hiccup.
 *
 * What is NOT done here, on purpose: nothing is ever deleted or locked when
 * a limit is passed — after a downgrade the extras simply stay (the plan
 * rules in `plans.ts`), and only ADDING more is refused.
 */

/** May this organisation save one more field / property / location? */
export async function savedItemLimitMessage(
  organizationId: string,
  data: OrganizationData,
): Promise<string | null> {
  try {
    const entitlements = await getEntitlementsForOrganization(organizationId);
    if (!entitlements.enforced || entitlements.limits.savedItems === null) return null;
    const check = checkLimit(entitlements, "savedItems", await data.countSavedItems());
    return check.allowed ? null : limitReachedMessage(entitlements, "savedItems", check.limit);
  } catch (err) {
    logApplication.error("saved_item_limit_check_failed", err);
    return null;
  }
}

/** May this organisation take one more person (an invitation being sent)? */
export async function seatLimitMessage(
  organizationId: string,
  data: OrganizationData,
): Promise<string | null> {
  try {
    const entitlements = await getEntitlementsForOrganization(organizationId);
    if (!entitlements.enforced || entitlements.limits.seats === null) return null;
    const check = checkLimit(entitlements, "seats", await data.countMembers());
    return check.allowed ? null : limitReachedMessage(entitlements, "seats", check.limit);
  } catch (err) {
    logApplication.error("seat_limit_check_failed", err);
    return null;
  }
}

/**
 * The seat cap to hand to `joinOrganization` when an invitation is accepted,
 * so the last seat cannot be taken twice. `null` = no cap (billing off, an
 * unlimited plan, or a lookup that failed).
 */
export async function seatCapForJoining(organizationId: string): Promise<number | null> {
  const entitlements = await getEntitlementsForOrganization(organizationId);
  return entitlements.enforced ? entitlements.limits.seats : null;
}
