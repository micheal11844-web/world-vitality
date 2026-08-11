/**
 * An authenticated session.
 *
 * `accessToken` was missing from the original Stage 3 version of this
 * type — a real gap, found only once Stage 6 actually tried to persist
 * a session across requests (e.g. in a cookie) and had no token value
 * to store. `getSession()`/`signOut()` both take a `sessionToken`
 * string; without exposing it here, a caller had no way to obtain one
 * from `verifyMagicLinkCallback()` in the first place.
 */
export interface Session {
  userId: string;
  email: string;
  issuedAt: string;
  expiresAt: string;
  /** Opaque token — pass this to `getSession()`/`signOut()`. Store it
   *  server-side only (e.g. an httpOnly cookie), never in client-
   *  readable storage. */
  accessToken: string;
  /**
   * Opaque refresh token, used by `refreshSession()` to mint a new
   * `accessToken` once the current one expires, without requiring the
   * user to sign in again. Added alongside "Remember Me" — before this,
   * this codebase had no session-refresh mechanism at all, so a
   * persistent cookie with no way to refresh what it held would have
   * been cosmetic, not functional. Store server-side only, same rule as
   * `accessToken`; only worth persisting long-term when the user opted
   * into "Remember Me" (see `apps/web/app/auth/callback/route.ts` and
   * the password sign-in Server Action).
   *
   * Optional, not always present: `getSession()` validates an existing
   * access token and structurally has no way to produce a refresh token
   * from that alone — only the methods that establish a session fresh
   * (magic link, password sign-in/up, and `refreshSession()` itself)
   * return one.
   */
  refreshToken?: string;
}

/**
 * The contract for authentication, kept separate from any specific
 * backing provider (`SupabaseAuthService` is the concrete implementation
 * — see `SupabaseAuthService.ts`) for the same reason ADR-0003 kept
 * ingestion and interpretation behind interfaces: so a future provider
 * swap (self-hosted, a different auth vendor) is a new implementation of
 * this contract, not a rewrite of every caller.
 *
 * BUILD_PLAN 3.1 scope: magic-link email auth now, SSO groundwork later
 * (this interface doesn't preclude adding an `signInWithSso()` method,
 * but doesn't implement one yet — no SSO provider has been chosen).
 */
export interface AuthService {
  /**
   * Send a magic-link sign-in email to the given address. Does not
   * reveal whether the address already has an account — the caller
   * should show the same "check your email" response either way, to
   * avoid leaking account existence.
   */
  requestMagicLink(email: string): Promise<void>;

  /**
   * Verify a magic-link callback using Supabase's `token_hash` flow.
   *
   * **Not `exchangeCodeForSession`/PKCE, deliberately.** PKCE's `code`
   * exchange requires the same client that *initiated* `signInWithOtp`
   * to also complete the exchange, because it needs a `code_verifier`
   * persisted between those two calls (browser storage, normally).
   * `requestMagicLink` above runs in a stateless Server Action — a fresh
   * client per request, nothing persisted — so no `code_verifier` is
   * ever available to complete a PKCE exchange with. This was a real
   * bug found in production (Stage 6): the email link's session data
   * arrived in the URL fragment (`#access_token=...`), which browsers
   * never send to a server at all, so the callback route always saw no
   * `code`. `token_hash` verification is self-contained — no client
   * state required — which is what Supabase's own SSR docs recommend
   * for exactly this "stateless server initiates and completes auth"
   * shape.
   */
  verifyMagicLinkCallback(tokenHash: string): Promise<Session>;

  /** Validate an existing session token, returning null if it's invalid
   *  or expired rather than throwing — an expired session is an expected
   *  state, not an error condition. */
  getSession(sessionToken: string): Promise<Session | null>;

  /**
   * Mint a fresh `Session` (new access + refresh token) from a
   * previously-issued refresh token, without requiring the user to sign
   * in again. Backs "Remember Me" — a caller only reaches for this once
   * the access-token cookie has expired but a refresh-token cookie is
   * still present. Throws if the refresh token itself is invalid/
   * revoked (a real, expected outcome — e.g. the user signed out
   * elsewhere, or it's simply too old), which the caller should treat
   * as "not signed in," not as a server error.
   */
  refreshSession(refreshToken: string): Promise<Session>;

  /**
   * Create a new account with an email + password. Same
   * doesn't-reveal-account-existence property as `requestMagicLink` is
   * NOT guaranteed here by Supabase's default `signUp` behavior (it
   * does return an identifiable "already registered" error in some
   * configurations) — see `SupabaseAuthService`'s doc comment for the
   * real, current behavior rather than an assumed one.
   */
  signUpWithPassword(email: string, password: string): Promise<Session>;

  /**
   * Sign in with an existing email + password. This is genuinely a
   * different attack surface than magic-link/OTP (credential stuffing,
   * brute force, password reuse across breached sites) — see
   * `docs/security/auth-threat-model.md`'s updated threat list. Rate
   * limiting is Supabase's responsibility at the platform level; this
   * method doesn't add its own on top, which is recorded there as real,
   * open follow-up rather than assumed handled.
   */
  signInWithPassword(email: string, password: string): Promise<Session>;

  /** Invalidate a session (sign out). */
  signOut(sessionToken: string): Promise<void>;
}
