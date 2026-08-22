import { NextResponse, type NextRequest } from "next/server";
import { getAuthService } from "./lib/auth";
import { setSessionCookies } from "./lib/session-cookies";
import { SESSION_COOKIE, REFRESH_COOKIE } from "./lib/constants";
import { logSecurity } from "./lib/logger";

/**
 * Closes the one gap `lib/require-session.ts` deliberately left open
 * when server-side page gating shipped: a "Remember Me" user whose
 * short-lived access-token cookie has expired was being redirected to
 * `/login` and asked to sign in again, even though a still-valid
 * `wv_refresh` cookie existed specifically to prevent that. Server
 * Components (which `app/dashboard/layout.tsx` and
 * `app/workspaces/layout.tsx` are) cannot write cookies during
 * rendering — only Middleware, Server Actions, and Route Handlers can
 * — so this had to live here, not in a bigger version of that same
 * layout check.
 *
 * **This is this app's first-ever Middleware file, and it runs on the
 * Edge runtime by default** — worth being explicit about, given this
 * project has been burned once before by an untested framework-
 * internals assumption becoming a real production crash (the 3D
 * Orbi/`react-reconciler` incident). Checked before writing this:
 * `SupabaseAuthService` only calls `@supabase/supabase-js`'s `auth.*`
 * methods, which are plain `fetch()` calls with no Node-only API
 * (`fs`, `crypto`, etc.) anywhere in the call path — confirmed by
 * reading `SupabaseAuthService.ts` directly, not assumed. This is also
 * the documented pattern Supabase's own official Next.js SSR guide
 * recommends for exactly this purpose (refreshing a session before a
 * Server Component renders), not an invented approach.
 *
 * **Deliberately narrow, with a safe fallback baked in:** this
 * middleware's only job is an *opportunistic* refresh. It does not
 * duplicate the actual authorization decision — `requireSession()` in
 * each layout still does that, unchanged, exactly as already shipped
 * and verified. If refresh fails for any reason (revoked/expired
 * refresh token, a real Supabase outage, an unexpected Edge-runtime
 * incompatibility this review didn't catch), this middleware silently
 * falls through and the request proceeds exactly as it did before this
 * file existed: the layout's `requireSession()` finds no valid access-
 * token cookie and redirects to `/login`. A bug here degrades to
 * "asked to sign in again," never to a broken or insecure page.
 *
 * The trigger condition is cookie *presence*, not a live validity
 * check: the access-token cookie is set with a real, browser-enforced
 * `expires` (see `setSessionCookies`), so once it's actually expired
 * the browser stops sending it entirely — "cookie absent" already
 * means "access token expired or never existed," with no need for an
 * extra `getSession()` network call inside Middleware just to learn
 * that.
 *
 * Sets the refreshed cookie on both `request.cookies` (so the *same*
 * request's downstream Server Component sees it immediately, and
 * `requireSession()` finds a valid session on first render rather than
 * redirecting) and `response.cookies` (so the browser actually receives
 * the new `Set-Cookie` header) — the standard dual-set pattern for
 * exactly this reason, not an oversight of only setting one.
 *
 * **Not verified against a live Supabase project or a real browser
 * from this build environment** — same caveat as every other auth code
 * path in this app (magic link, password, Google OAuth, Forgot
 * Password, and the page gate this extends). Correct against Next.js's
 * and Supabase's own documented Middleware pattern, and the safe-
 * fallback design means a mistake here degrades gracefully rather than
 * breaking anything already shipped — but treat the first real
 * "Remember Me" session surviving past its access-token expiry as the
 * actual test.
 */
export async function middleware(request: NextRequest) {
  const hasAccessToken = request.cookies.has(SESSION_COOKIE);
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  if (hasAccessToken || !refreshToken) {
    return NextResponse.next();
  }

  try {
    const auth = getAuthService();
    const session = await auth.refreshSession(refreshToken);

    request.cookies.set(SESSION_COOKIE, session.accessToken);
    const response = NextResponse.next({ request });
    setSessionCookies(response.cookies, session, true);
    return response;
  } catch (err) {
    // Refresh token invalid/revoked, or a genuine Supabase failure —
    // an expected, non-exceptional outcome (e.g. the user signed out
    // elsewhere, or it's simply too old). Logged so a real outage is
    // still visible; falls through to the existing, already-verified
    // requireSession() redirect rather than surfacing an error page.
    logSecurity.error("session_refresh_failed", err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/workspaces/:path*"],
};
