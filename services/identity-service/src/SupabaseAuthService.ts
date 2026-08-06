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
    return {
      userId: data.user.id,
      email: data.user.email,
      issuedAt: new Date(
        (data.session.expires_at ?? 0) * 1000 - data.session.expires_in * 1000,
      ).toISOString(),
      expiresAt: new Date((data.session.expires_at ?? 0) * 1000).toISOString(),
      accessToken: data.session.access_token,
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
}
