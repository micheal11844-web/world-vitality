import type { Session } from "@world-vitality/identity-service";
import { SESSION_COOKIE, REFRESH_COOKIE, REMEMBER_ME_MAX_AGE_SECONDS } from "./constants";

/**
 * Deliberately narrow, structural — matches both `NextResponse.cookies`
 * (used by the OAuth/magic-link callback Route Handler) and the
 * `cookies()` store from `next/headers` (used by Server Actions),
 * rather than importing either's concrete Next.js type. Next ships
 * several slightly different cookie-store shapes across contexts, and
 * guessing at which internal type is "correct" is exactly the kind of
 * framework-internals assumption that caused this project's CSP
 * incident — this sidesteps that by only depending on the two methods
 * actually used below, both stable, public parts of each API.
 */
export interface WritableCookieStore {
  set(name: string, value: string, options?: Record<string, unknown>): void;
  delete(name: string): void;
}

/**
 * Sets the access-token cookie every sign-in path shares, and — only
 * when `rememberMe` is true and a refresh token is actually available —
 * a long-lived refresh-token cookie. Centralized here so "Remember Me"
 * behaves identically regardless of which of the three sign-in methods
 * (magic link, password, Google) produced the session, rather than
 * three separate, potentially-drifting implementations.
 *
 * **Why `rememberMe` gates the refresh cookie specifically, not the
 * access-token cookie's own lifetime:** the access-token cookie already
 * expires with Supabase's short-lived JWT regardless (unrelated to this
 * feature). What "Remember Me" actually controls is whether, once that
 * short-lived token expires, the user is silently re-authenticated via
 * the refresh token (checked) or has to sign in again (unchecked). This
 * is the real mechanism — not just a longer cookie Max-Age on its own,
 * which would be cosmetic without it (see `AuthService.refreshToken`'s
 * doc comment for why this project didn't have this before).
 */
export function setSessionCookies(
  cookies: WritableCookieStore,
  session: Session,
  rememberMe: boolean,
): void {
  cookies.set(SESSION_COOKIE, session.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(session.expiresAt),
  });

  if (rememberMe && session.refreshToken) {
    cookies.set(REFRESH_COOKIE, session.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: REMEMBER_ME_MAX_AGE_SECONDS,
    });
  } else {
    // Explicitly cleared, not just "not set" — if a user previously
    // checked Remember Me, then signs in again later WITHOUT it
    // checked, a stale long-lived refresh cookie from the earlier
    // session must not silently persist past what they just chose.
    cookies.delete(REFRESH_COOKIE);
  }
}
