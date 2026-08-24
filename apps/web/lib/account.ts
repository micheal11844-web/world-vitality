import { createClient } from "@supabase/supabase-js";
import { SupabaseAccountService } from "@world-vitality/identity-service";

/**
 * Server-side only — this app's first real consumer of `AccountService`
 * (BUILD_PLAN "STAGE — GOVERNMENT & NGOS WORKSPACE"). `AccountService`
 * and `WorkspaceMembership` have existed since Stage 3.3, but nothing
 * anywhere in this app has ever actually called
 * `getWorkspaceMemberships` to gate UI — see `get-workspace-role.ts`
 * for the first real caller.
 *
 * Mirrors `getAuthService()`'s pattern exactly (same env vars, same
 * "throw a clear message rather than silently construct a broken
 * client" discipline), but `SupabaseAccountService`'s constructor takes
 * a raw `SupabaseClient` rather than a config object, so the client is
 * built directly here with `@supabase/supabase-js`.
 *
 * Never import this from a Client Component — `SUPABASE_SERVICE_ROLE_KEY`
 * must never reach the browser bundle.
 */
export function getAccountService(): SupabaseAccountService {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Missing Supabase env vars (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY). " +
        "See services/identity-service/.env.example and docs/onboarding/repository-setup.md.",
    );
  }

  const client = createClient(supabaseUrl, supabaseServiceRoleKey);
  return new SupabaseAccountService(client);
}
