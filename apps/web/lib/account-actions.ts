"use server";

import { cookies } from "next/headers";
import {
  MAX_ORGANIZATION_NAME_LENGTH,
  OrganizationHasMembersError,
  normaliseOrganizationName,
} from "@world-vitality/identity-service";
import { summariseBilling } from "@world-vitality/billing-service";
import { WORKSPACE_LINKS } from "../app/workspaces/workspace-nav";
import { getAccountService } from "./account";
import { getAccessContext } from "./get-access-context";
import { billingEnabled, getBillingStore } from "./billing";
import { cancelPaystackSubscriptionBeforeDeletion } from "./billing-cancel";
import { getSessionUserId } from "./get-session-user-id";
import { tServer } from "./i18n/server";
import { SESSION_COOKIE, REFRESH_COOKIE } from "./constants";
import { logSecurity, logTelemetry } from "./logger";
import { notifyOwnershipReceived } from "./notification-events";
import { PLAN_NAME_KEYS } from "./plan-limits";
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

export interface RenameOrganizationResult extends AccountActionResult {
  /** The name as saved (tidied), on success. */
  name?: string;
}

/**
 * Renames the signed-in person's organisation. Owner only, and enforced
 * twice: here from the session's own organisation (never an id from the
 * browser), and again inside the database write (`WHERE owner_id = …`), so
 * a mistake in this check still cannot rename someone else's organisation.
 */
export async function renameOrganizationAction(name: string): Promise<RenameOrganizationResult> {
  const tidy = normaliseOrganizationName(name);
  if (!tidy) {
    return {
      ok: false,
      error: await tServer("errors.orgNameInvalid", { max: MAX_ORGANIZATION_NAME_LENGTH }),
    };
  }
  const userId = await getSessionUserId();
  if (!userId) {
    return { ok: false, error: await tServer("errors.sessionExpired") };
  }
  try {
    const access = await getAccessContext();
    if (!access || access.organization.role !== "owner" || access.organization.ownerId !== userId) {
      return { ok: false, error: await tServer("errors.orgOwnerOnly") };
    }
    const result = await getAccountService()
      .forOrganization(access.organization.organizationId)
      .renameOrganization(userId, tidy);
    if (result === "not_owner") {
      return { ok: false, error: await tServer("errors.orgOwnerOnly") };
    }
    if (result === "invalid_name") {
      return {
        ok: false,
        error: await tServer("errors.orgNameInvalid", { max: MAX_ORGANIZATION_NAME_LENGTH }),
      };
    }
    logSecurity.info("organization_renamed", {
      userId,
      organizationId: access.organization.organizationId,
    });
    return { ok: true, name: tidy };
  } catch (err) {
    logSecurity.error("organization_rename_failed", err, { userId });
    return { ok: false, error: await tServer("errors.orgRenameFailed") };
  }
}

/**
 * Hands the signed-in owner's organisation to another person in it.
 *
 * Who is acting always comes from the session, never from the browser, and
 * only the owner may do this — enforced here from the session's own
 * organisation and again inside the database function, which checks the
 * acting person is the owner and the new owner is already a member, and does
 * the whole swap in one statement (migration 0021).
 *
 * The plan belongs to the owner and a subscription does not move between
 * people, so while billing is on the hand-over is refused for as long as the
 * owner's plan is in effect (any state but free: active, ending, past due, or
 * granted by staff). Handing over would otherwise drop the organisation to
 * the Free plan without warning. If the plan cannot be read the answer is
 * "couldn't", not "go ahead": nothing has changed at that point.
 *
 * The previous owner stays on as an admin everywhere (so they are never
 * locked out), the new owner gets a notice, and the whole thing is written to
 * the security log.
 */
export async function transferOrganizationAction(
  newOwnerUserId: string,
): Promise<AccountActionResult> {
  const userId = await getSessionUserId();
  if (!userId) {
    return { ok: false, error: await tServer("errors.sessionExpired") };
  }
  if (typeof newOwnerUserId !== "string" || newOwnerUserId.trim() === "") {
    return { ok: false, error: await tServer("errors.orgTransferNotMember") };
  }
  try {
    const access = await getAccessContext();
    if (!access || access.organization.role !== "owner" || access.organization.ownerId !== userId) {
      return { ok: false, error: await tServer("errors.orgTransferOwnerOnly") };
    }
    const { organizationId, name: organizationName } = access.organization;

    if (billingEnabled()) {
      const summary = summariseBilling(await getBillingStore().getSubscription(userId), new Date());
      if (summary.state !== "free") {
        return {
          ok: false,
          error: await tServer("errors.orgTransferPaidPlan", {
            plan: await tServer(PLAN_NAME_KEYS[summary.plan]),
          }),
        };
      }
    }

    const account = getAccountService();
    const result = await account.forOrganization(organizationId).transferOwnership(
      userId,
      newOwnerUserId.trim(),
      WORKSPACE_LINKS.map((w) => w.key),
    );
    if (result === "not_owner") {
      return { ok: false, error: await tServer("errors.orgTransferOwnerOnly") };
    }
    if (result === "not_member" || result === "same_person") {
      return { ok: false, error: await tServer("errors.orgTransferNotMember") };
    }

    logSecurity.info("organization_ownership_transferred", {
      userId,
      organizationId,
      newOwnerId: newOwnerUserId.trim(),
    });

    // A courtesy on top of a change that has already happened: best effort,
    // and never able to fail the hand-over.
    try {
      const previous = await account.getProfile(userId);
      await notifyOwnershipReceived({
        newOwnerId: newOwnerUserId.trim(),
        organizationId,
        organizationName,
        fromDisplayName: previous.displayName,
        fromEmail: previous.email,
      });
    } catch (err) {
      logSecurity.error("organization_ownership_notice_failed", err, { userId });
    }
    return { ok: true };
  } catch (err) {
    logSecurity.error("organization_transfer_failed", err, { userId });
    return { ok: false, error: await tServer("errors.orgTransferFailed") };
  }
}
