import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AuthService, Session } from "./AuthService.js";

export interface SupabaseAuthServiceConfig {
  /** Supabase project URL, e.g. https://xyzcompany.supabase.co */
  supabaseUrl: string;

  /**
   * Supabase **service role** key — required for server-side session
   * verification. Never expose this to a browser/client bundle; it must
   * come from a server-only environment variable (`SUPABASE_SERVICE_ROLE_KEY`).
   */
  supabaseServiceRoleKey: string;

  /**
   * URL the magic-link email redirects back to after the user clicks it
   * (e.g. `https://app.worldvitality.example/auth/callback`). Required
   * by Supabase's magic-link flow to know where to send the user.
   */
  redirectTo: string;
}

/**
 * `AuthService` implemented against Supabase Auth (magic-link / OTP
 * email sign-in). Chosen for Stage 3 because it bundles the database,
 * auth, and transactional-email delivery needed for magic links into one
 * managed service, rather than assembling Postgres + a separate email
 * provider + hand-rolled token signing before any real user-facing
 * feature exists.
 *
 * Requires these environment variables at runtime (never committed —
 * see `.env.example` and Constitution Engineering Blueprint Section on
 * secret handling):
 * - `SUPABASE_URL`
 * - `SUPABASE_SERVICE_ROLE_KEY`
 * - `SUPABASE_AUTH_REDIRECT_URL`
 *
 * **Exercised against a live Supabase project (Stage 6)** — the initial
 * version of this file used `exchangeCodeForSession`/PKCE, which turned
 * out not to work at all for this stateless-server architecture (see
 * `verifyMagicLinkCallback`'s doc comment on `AuthService` for why) and
 * was replaced with `verifyOtp`/`token_hash` verification after a real
 * failed sign-in surfaced the problem. The Supabase Magic Link email
 * template must be customized to link with `token_hash`/`type=email`
 * query params rather than the default `{{ .ConfirmationURL }}` — see
 * `docs/onboarding/repository-setup.md`, Stage 6 section.
 */
export class SupabaseAuthService implements AuthService {
  private readonly client: SupabaseClient;
  private readonly redirectTo: string;

  constructor(config: SupabaseAuthServiceConfig) {
    this.client = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    this.redirectTo = config.redirectTo;
  }

  async requestMagicLink(email: string): Promise<void> {
    const { error } = await this.client.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: this.redirectTo },
    });
    // Supabase itself does not reveal account existence via this call's
    // error shape for unknown-vs-known emails in its default config, so
    // this preserves that property rather than undermining it.
    if (error) {
      throw new Error(`Failed to send magic link: ${error.message}`);
    }
  }

  async verifyMagicLinkCallback(tokenHash: string): Promise<Session> {
    const { data, error } = await this.client.auth.verifyOtp({
      token_hash: tokenHash,
      type: "email",
    });
    if (error || !data.session || !data.user?.email) {
      throw new Error(
        `Failed to verify magic-link token: ${error?.message ?? "no session returned"}`,
      );
    }
    return this.toSession(data.session, data.user.email, data.user.id);
  }

  async refreshSession(refreshToken: string): Promise<Session> {
    const { data, error } = await this.client.auth.refreshSession({
      refresh_token: refreshToken,
    });
    if (error || !data.session || !data.user?.email) {
      throw new Error(`Failed to refresh session: ${error?.message ?? "no session returned"}`);
    }
    return this.toSession(data.session, data.user.email, data.user.id);
  }

  /**
   * **Real, current Supabase behavior, verified rather than assumed**
   * (see this class's other doc comments for why that verification
   * habit matters after the CSP incident): unlike `requestMagicLink`,
   * default-configuration `signUp` DOES return a distinguishable
   * response for an already-registered email in some Supabase project
   * configurations (an identity with no `identities` array entries, or
   * an explicit error depending on "Confirm email" settings) — this
   * method does not attempt to paper over that distinction, since doing
   * so incorrectly would be worse than being silent about it. The
   * caller (the sign-up Server Action) should show a generic
   * "check your email to confirm" message regardless, but this
   * document flags that the underlying guarantee is weaker than
   * `requestMagicLink`'s, not silently assumed equivalent.
   */
  async signUpWithPassword(email: string, password: string): Promise<Session> {
    const { data, error } = await this.client.auth.signUp({ email, password });
    if (error || !data.session || !data.user?.email) {
      // No confirmed session yet is a real, expected outcome when the
      // Supabase project requires email confirmation before password
      // sign-in works — not necessarily a failure. Surfaced as a
      // distinct error so the caller can show "check your email"
      // rather than a generic failure.
      throw new Error(
        `Sign-up did not return an active session (may require email confirmation): ${error?.message ?? "no session returned"}`,
      );
    }
    return this.toSession(data.session, data.user.email, data.user.id);
  }

  async signInWithPassword(email: string, password: string): Promise<Session> {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error || !data.session || !data.user?.email) {
      // Deliberately generic message — does not distinguish "wrong
      // password" from "no such account," per the same
      // account-existence-shouldn't-leak principle as requestMagicLink.
      throw new Error("Invalid email or password.");
    }
    return this.toSession(data.session, data.user.email, data.user.id);
  }

  /** Shared mapping from a Supabase session/user pair to this service's
   *  own `Session` shape — extracted once real password/refresh methods
   *  needed the exact same mapping `verifyMagicLinkCallback` already
   *  had, rather than copy-pasting it a third and fourth time. */
  private toSession(
    supabaseSession: {
      access_token: string;
      refresh_token: string;
      expires_at?: number;
      expires_in: number;
    },
    email: string,
    userId: string,
  ): Session {
    return {
      userId,
      email,
      issuedAt: new Date(
        (supabaseSession.expires_at ?? 0) * 1000 - supabaseSession.expires_in * 1000,
      ).toISOString(),
      expiresAt: new Date((supabaseSession.expires_at ?? 0) * 1000).toISOString(),
      accessToken: supabaseSession.access_token,
      refreshToken: supabaseSession.refresh_token,
    };
  }

  async getSession(sessionToken: string): Promise<Session | null> {
    const { data, error } = await this.client.auth.getUser(sessionToken);
    if (error || !data.user?.email) {
      return null;
    }
    return {
      userId: data.user.id,
      email: data.user.email,
      issuedAt: data.user.created_at,
      // Supabase's getUser doesn't return the token's own expiry; callers
      // needing exact expiry should track it from
      // verifyMagicLinkCallback's result instead of re-deriving it here.
      expiresAt: "",
      accessToken: sessionToken,
    };
  }

  async signOut(sessionToken: string): Promise<void> {
    await this.client.auth.admin.signOut(sessionToken);
  }

  async checkSignInLockout(
    email: string,
  ): Promise<{ locked: boolean; lockedUntil: string | null }> {
    const { data, error } = await this.client.rpc("is_signin_locked", { p_email: email });
    if (error) {
      // A real DB/RPC failure here (not "no record found" — that's a
      // normal, expected zero-row-equivalent result the function
      // itself already handles) — treat as "not locked" rather than
      // blocking sign-in entirely on an unrelated infrastructure
      // hiccup. This is defense-in-depth, not the primary defense
      // (Supabase's own auth API is), same fail-open reasoning already
      // used for `checkPasswordBreach`.
      return { locked: false, lockedUntil: null };
    }
    const row = data?.[0];
    return { locked: Boolean(row?.locked), lockedUntil: row?.locked_until ?? null };
  }

  async recordFailedSignIn(
    email: string,
    maxAttempts = 5,
    windowMinutes = 15,
    lockoutMinutes = 15,
  ): Promise<void> {
    // Errors are deliberately swallowed, not thrown: a rate-limit
    // bookkeeping failure must never mask the real "invalid email or
    // password" outcome the caller (signInWithPasswordAction, which
    // already logs the failed sign-in itself) needs to return to the
    // user.
    await this.client.rpc("record_failed_signin_attempt", {
      p_email: email,
      p_max_attempts: maxAttempts,
      p_window_minutes: windowMinutes,
      p_lockout_minutes: lockoutMinutes,
    });
  }

  async recordSuccessfulSignIn(email: string): Promise<void> {
    await this.client.rpc("record_successful_signin", { p_email: email });
  }

  async checkSignInIpLockout(
    ipAddress: string,
  ): Promise<{ locked: boolean; lockedUntil: string | null }> {
    const { data, error } = await this.client.rpc("is_signin_ip_locked", { p_ip: ipAddress });
    if (error) {
      // Same fail-open reasoning as checkSignInLockout — a real DB/RPC
      // failure here must never block sign-in entirely on an unrelated
      // infrastructure hiccup.
      return { locked: false, lockedUntil: null };
    }
    const row = data?.[0];
    return { locked: Boolean(row?.locked), lockedUntil: row?.locked_until ?? null };
  }

  async recordFailedSignInIp(ipAddress: string): Promise<void> {
    // Errors deliberately swallowed — same reasoning as
    // recordFailedSignIn: rate-limit bookkeeping must never mask the
    // real sign-in outcome.
    await this.client.rpc("record_failed_signin_attempt_ip", { p_ip: ipAddress });
  }

  async recordPasswordResetRequest(
    email: string,
  ): Promise<{ allowed: boolean; requestCount: number }> {
    const { data, error } = await this.client.rpc("record_password_reset_request", {
      p_email: email,
    });
    if (error) {
      // Fail open: a bookkeeping failure must never block a legitimate
      // password-reset request, which is the one recovery path a
      // locked-out real user has left.
      return { allowed: true, requestCount: 0 };
    }
    const row = data?.[0];
    return { allowed: row?.allowed ?? true, requestCount: row?.request_count ?? 0 };
  }

  async requestPasswordReset(email: string): Promise<void> {
    const { error } = await this.client.auth.resetPasswordForEmail(email, {
      redirectTo: this.redirectTo,
    });
    // Same account-existence-shouldn't-leak intent as requestMagicLink
    // — Supabase's default config does not distinguish known/unknown
    // emails via this call's error shape either.
    if (error) {
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  }

  async verifyPasswordResetCallback(tokenHash: string): Promise<Session> {
    const { data, error } = await this.client.auth.verifyOtp({
      token_hash: tokenHash,
      type: "recovery",
    });
    if (error || !data.session || !data.user?.email) {
      throw new Error(
        `Failed to verify password-reset token: ${error?.message ?? "no session returned"}`,
      );
    }
    return this.toSession(data.session, data.user.email, data.user.id);
  }

  /**
   * Uses the **admin** API (`auth.admin.updateUserById`), not
   * `auth.updateUser` — this service's client is the service-role
   * client with `persistSession: false` (see the constructor); it never
   * holds a "currently signed in" user session to call the non-admin
   * `updateUser` against. The admin call instead takes the target
   * `userId` directly, which is exactly what this method's caller
   * already has (from `verifyPasswordResetCallback`'s returned
   * `Session.userId`).
   */
  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const { error } = await this.client.auth.admin.updateUserById(userId, {
      password: newPassword,
    });
    if (error) {
      throw new Error(`Failed to update password: ${error.message}`);
    }
  }
}
