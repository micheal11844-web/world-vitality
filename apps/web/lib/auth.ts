import { SupabaseAuthService } from "@world-vitality/identity-service";

/**
 * Server-side only — instantiates `SupabaseAuthService` from the env vars
 * documented in `services/identity-service/.env.example`. Never import
 * this from a Client Component; `SUPABASE_SERVICE_ROLE_KEY` must never
 * reach the browser bundle.
 *
 * Throws with a clear message if env vars are missing, rather than
 * silently constructing a broken client — this is a server-side utility,
 * so a clear crash at startup is far better than a confusing runtime
 * failure deep inside a request handler.
 */
export function getAuthService(): SupabaseAuthService {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const redirectTo = process.env.SUPABASE_AUTH_REDIRECT_URL;

  if (!supabaseUrl || !supabaseServiceRoleKey || !redirectTo) {
    throw new Error(
      "Missing Supabase env vars (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_AUTH_REDIRECT_URL). " +
        "See services/identity-service/.env.example and docs/onboarding/repository-setup.md.",
    );
  }

  return new SupabaseAuthService({ supabaseUrl, supabaseServiceRoleKey, redirectTo });
}
