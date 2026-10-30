"use server";

import { cookies } from "next/headers";
import { OrganizationHasMembersError } from "@world-vitality/identity-service";
import { getAccountService } from "./account";
import { cancelPaystackSubscriptionBeforeDeletion } from "./billing-cancel";
import { getSessionUserId } from "./get-session-user-id";
import { tServer } from "./i18n/server";
import { SESSION_COOKIE, REFRESH_COOKIE } from "./constants";
import { logSecurity, logTelemetry } from "./logger";
import { MAX_DISPLAY_NAME_LENGTH, DELETE_CONFIRMATION_WORD } from "./account-constants";

export interface AccountActionResult {
  ok: boolean;
  error?: string;
}

/**
 * Updates the signed-in user's display name (BUILD_PLAN "STAGE —
 * ACCOUNT SETTINGS + SIGN OUT"). Always acts on the session's own
 * user — the client never supplies a user id, so there is nothing to
 * tamper with. An empty name clears it (stored as null).
 */
export async function updateDisplayNameAction(displayName: string): Promise<AccountActionResult> {
  const trimmed = displayName.trim();
  if (trimmed.length > MAX_DISPLAY_NAME_LENGTH) {
    return {
      ok: false,
      error: await tServer("errors.nameTooLong", { max: MAX_DISPLAY_NAME_LENGTH }),
    };
  }
  const userId = await getSessionUserId();
  if (!userId) {
    return { ok: false, error: await tServer("errors.sessionExpired") };
  }
  try {
    await getAccountService().updateProfile(userId, {
      displayName: trimmed === "" ? null : trimmed,
    });
    return { ok: true };
  } catch (err) {
    logSecurity.error("profile_update_failed", err, { userId });
    return { ok: false, error: await tServer("errors.nameSaveFailed") };
  }
}

/**
 * Permanently deletes the signed-in user's account (Constitution
 * Section 2, Principle 5 — as easy as sign-up). The one deliberate
 * piece of friction is a typed confirmation word, so a stray click can
 * never be irreversible; there is no support ticket, approval step or
 * waiting period. Profile, memberships and the user's comments are
 * removed by cascade. What happens to the fields, properties and
 * locations they saved depends on whose organisation they are in: as a
 * MEMBER of someone else's they stay, with the creator cleared (`ON DELETE
 * SET NULL`); as the OWNER, the organisation goes with the account and so
 * does everything saved in it — which is why an owner who still has other
 * people in the organisation is refused until they have removed them
 * (`OrganizationHasMembersError`). The Settings page says all of this
 * before the user confirms.
 *
 * No password re-entry — a documented trade-off, see
 * `docs/security/auth-threat-model.md` threat #5.
 */
export async function deleteAccountAction(confirmation: string): Promise<AccountActionResult> {
  if (confirmation.trim() !== DELETE_CONFIRMATION_WORD) {
    return {
      ok: false,
      error: await tServer("errors.typeToConfirm", { word: DELETE_CONFIRMATION_WORD }),
    };
  }
  const userId = await getSessionUserId();
  if (!userId) {
    return { ok: false, error: await tServer("errors.sessionExpired") };
  }
  try {
    // An owner who still has other people in the organisation is refused
    // BEFORE anything else happens, so a subscription is never cancelled for
    // a deletion that is then turned down.
    const account = getAccountService();
    const organization = await account.getOrganizationMembership(userId);
    if (organization?.role === "owner") {
      const members = await account.forOrganization(organization.organizationId).countMembers();
      if (members > 1) throw new OrganizationHasMembersError(members - 1);
    }
    // A paying customer's subscription is stopped on Paystack first. If that
    // cannot be confirmed the account is left alone — deleting it anyway
    // would leave them being charged for a plan they can no longer reach.
    if ((await cancelPaystackSubscriptionBeforeDeletion(userId)) === "failed") {
      return { ok: false, error: await tServer("errors.deleteCancelSubscriptionFailed") };
    }
    await account.deleteAccount(userId);
  } catch (err) {
    if (err instanceof OrganizationHasMembersError) {
      // Not a failure to retry: the owner has to take the others out first.
      return {
        ok: false,
        error: await tServer("errors.deleteOrganizationHasMembers", { count: err.otherMembers }),
      };
    }
    logSecurity.error("account_delete_failed", err, { userId });
    return { ok: false, error: await tServer("errors.deleteFailed") };
  }
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
  logSecurity.info("account_deleted", { userId });
  logTelemetry.event("account_deleted");
  return { ok: true };
}
