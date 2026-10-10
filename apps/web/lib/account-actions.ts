"use server";

import { cookies } from "next/headers";
import { getAccountService } from "./account";
import { getSessionUserId } from "./get-session-user-id";
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
    return { ok: false, error: `Keep your name under ${MAX_DISPLAY_NAME_LENGTH} characters.` };
  }
  const userId = await getSessionUserId();
  if (!userId) {
    return { ok: false, error: "Your session has expired. Please sign in again." };
  }
  try {
    await getAccountService().updateProfile(userId, {
      displayName: trimmed === "" ? null : trimmed,
    });
    return { ok: true };
  } catch (err) {
    logSecurity.error("profile_update_failed", err, { userId });
    return { ok: false, error: "Couldn't save your name. Please try again." };
  }
}

/**
 * Permanently deletes the signed-in user's account (Constitution
 * Section 2, Principle 5 — as easy as sign-up). The one deliberate
 * piece of friction is a typed confirmation word, so a stray click can
 * never be irreversible; there is no support ticket, approval step or
 * waiting period. Profile, memberships and the user's comments are
 * removed by cascade; resources they created (fields, properties,
 * locations) belong to the workspace and stay, with the creator
 * cleared (`ON DELETE SET NULL`) — the Settings page says so before
 * the user confirms.
 *
 * No password re-entry — a documented trade-off, see
 * `docs/security/auth-threat-model.md` threat #5.
 */
export async function deleteAccountAction(confirmation: string): Promise<AccountActionResult> {
  if (confirmation.trim() !== DELETE_CONFIRMATION_WORD) {
    return { ok: false, error: `Type ${DELETE_CONFIRMATION_WORD} to confirm.` };
  }
  const userId = await getSessionUserId();
  if (!userId) {
    return { ok: false, error: "Your session has expired. Please sign in again." };
  }
  try {
    await getAccountService().deleteAccount(userId);
  } catch (err) {
    logSecurity.error("account_delete_failed", err, { userId });
    return { ok: false, error: "Couldn't delete your account. Please try again." };
  }
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
  logSecurity.info("account_deleted", { userId });
  logTelemetry.event("account_deleted");
  return { ok: true };
}
