/**
 * An authenticated session.
 */
export interface Session {
  userId: string;
  email: string;
  issuedAt: string;
  expiresAt: string;
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
   * Exchange a magic-link callback code (from the URL the user clicked)
   * for an authenticated session.
   */
  exchangeCodeForSession(code: string): Promise<Session>;

  /** Validate an existing session token, returning null if it's invalid
   *  or expired rather than throwing — an expired session is an expected
   *  state, not an error condition. */
  getSession(sessionToken: string): Promise<Session | null>;

  /** Invalidate a session (sign out). */
  signOut(sessionToken: string): Promise<void>;
}
