import { cookies } from "next/headers";
import { getAuthService } from "./auth";
import { SESSION_COOKIE } from "./constants";
import { logSecurity } from "./logger";

/**
 * Resolves the current request's signed-in userId, or `null`.
 * Deliberately a separate, small helper rather than widening
 * `getWorkspaceRole()`'s return type — that function is already
 * consumed by every workspace as `Promise<Role>`, and changing its
 * shape to also carry a userId would be a breaking change to three
 * existing call sites for the sake of the one new caller
 * (`insurance/report/page.tsx`) that needs both.
 *
 * Fails safe to `null` on any error (missing cookie, missing session,
 * a real lookup failure) — same reasoning as `getWorkspaceRole`: a
 * caller using this for audit logging must treat `null` as "don't
 * write an entry," never throw and block the underlying, already-
 * authorized action.
 */
export async function getSessionUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;
    if (!sessionToken) {
      return null;
    }
    const auth = getAuthService();
    const session = await auth.getSession(sessionToken);
    return session?.userId ?? null;
  } catch (err) {
    logSecurity.error("session_user_id_lookup_failed", err, {});
    return null;
  }
}
