import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Session } from "@world-vitality/identity-service";
import { getAuthService } from "./auth";
import { SESSION_COOKIE } from "./constants";
import { logSecurity } from "./logger";

/**
 * Server-side page gate (BUILD_PLAN Stage 13 follow-up #3's flagged
 * gap, closed here): validates the `wv_session` access-token cookie
 * against Supabase, redirecting to `/login` if it's missing or invalid
 * rather than letting the page render regardless. Before this, no page
 * in the app actually checked — `/dashboard` and every workspace route
 * rendered for anyone who requested the URL, signed in or not.
 *
 * Deliberately a per-route-tree `layout.tsx` concern (called from
 * `app/dashboard/layout.tsx` and `app/workspaces/layout.tsx`), not
 * Next.js Middleware. Middleware runs on the Edge runtime by default,
 * and this app has already been bitten once by an untested
 * framework-internals assumption turning into a real production crash
 * (the 3D Orbi / `react-reconciler` incident) — a Server Component
 * calling the exact same `getAuthService().getSession()` path
 * `updatePasswordAction` already uses in production is the far better-
 * understood, already-proven code path for this app specifically.
 *
 * **Scope, stated plainly:** this checks the access-token cookie only.
 * It does NOT attempt `refreshSession()` using the `wv_refresh` cookie
 * when the access token has expired — Server Components cannot set
 * cookies during rendering (only Server Actions/Route Handlers can), so
 * minting a refreshed session here would have nowhere valid to write
 * the new cookie. A signed-in user with "Remember Me" checked whose
 * access token has expired will currently be redirected to `/login`
 * the same as anyone else, rather than silently refreshed. This is a
 * real, honest gap — not a silent shortcut — recorded in BUILD_PLAN as
 * follow-up work (wiring `refreshSession` into Middleware or a
 * Route Handler, where a response's cookies can actually be rewritten).
 */
export async function requireSession(): Promise<Session> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;

  if (sessionToken) {
    try {
      const auth = getAuthService();
      const session = await auth.getSession(sessionToken);
      if (session) {
        return session;
      }
    } catch (err) {
      // getAuthService() throws if Supabase env vars are missing, and
      // getSession() can throw on a malformed/garbage token — either
      // way, that's "not signed in," not a reason to crash the page a
      // real visitor is trying to load. Logged so a real misconfiguration
      // is still visible in the security log, not silently swallowed.
      logSecurity.error("session_check_failed", err);
    }
  }

  redirect("/login");
  // Unreachable — redirect() always throws (Next.js's NEXT_REDIRECT
  // control-flow signal). This satisfies requireSession's Promise<Session>
  // return type for TypeScript, which can't otherwise know redirect()
  // never returns.
  throw new Error("unreachable");
}
