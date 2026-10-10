import { NextResponse, type NextRequest } from "next/server";
import { getAuthService } from "../../../lib/auth";
import { SESSION_COOKIE, REFRESH_COOKIE } from "../../../lib/constants";
import { logSecurity, logTelemetry } from "../../../lib/logger";

export const dynamic = "force-dynamic";

/**
 * Sign out (BUILD_PLAN "STAGE — ACCOUNT SETTINGS + SIGN OUT"). Until
 * this stage the app had no way to sign out at all.
 *
 * **POST only**, deliberately: a GET sign-out can be triggered by any
 * page embedding an image/link to it (logout CSRF). The header's
 * "Sign out" control is a plain `<form method="post">`.
 *
 * Both cookies are cleared — including `wv_refresh`, which matters: the
 * Middleware silently refreshes an expired access token from that
 * cookie, so leaving it behind would sign the user straight back in.
 * The server-side session is revoked best-effort first; a failure there
 * is logged but never blocks clearing the cookies (the user asked to
 * sign out — the browser must forget them regardless).
 *
 * 303 (not 307/308) so the browser follows with a GET to `/login`
 * instead of re-POSTing.
 */
export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;

  if (sessionToken) {
    try {
      await getAuthService().signOut(sessionToken);
    } catch (err) {
      logSecurity.error("signout_revoke_failed", err);
    }
  }

  const response = NextResponse.redirect(new URL("/login", request.url), 303);
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  logTelemetry.event("signed_out");
  return response;
}
