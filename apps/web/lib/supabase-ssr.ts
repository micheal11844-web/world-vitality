import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * A `@supabase/ssr` cookie-aware client, used **only** for the OAuth
 * sign-in handshake (`signInWithOAuth` + the callback's
 * `exchangeCodeForSession`) — not this app's ongoing session store.
 *
 * **Why this exists as a separate thing from `getAuthService()`:**
 * OAuth's PKCE flow requires the same `code_verifier` generated when
 * initiating sign-in to be available again when the callback exchanges
 * the provider's `code` for a session. That value has to be persisted
 * *somewhere* between those two separate requests. `@supabase/ssr`'s
 * `createServerClient` does this automatically via cookies it manages
 * itself — which is exactly the missing piece that would otherwise make
 * OAuth hit the same failure this app's magic-link flow already hit
 * once in production (a fresh, stateless client per request, nothing
 * persisted, so the exchange has nothing to complete against). See
 * `docs/security/auth-threat-model.md` for the full incident record
 * this is deliberately avoiding a repeat of.
 *
 * **Why this ISN'T used as the app's ongoing session store:** the rest
 * of this codebase reads "is this request authenticated" via a single
 * custom cookie (`SESSION_COOKIE`) and `AuthService.getSession()` —
 * adding a second, parallel, @supabase/ssr-managed cookie-based session
 * alongside that would mean two sources of truth for "am I logged in,"
 * a real source of future bugs. Instead: this client's cookies exist
 * only transiently, for the OAuth round-trip itself. The moment the
 * callback route successfully exchanges the code, it converts the
 * result into this app's existing `Session` shape and sets the same
 * `SESSION_COOKIE`/`REFRESH_COOKIE` every other sign-in method uses —
 * see `app/auth/callback/route.ts`.
 *
 * Requires `SUPABASE_URL` and `SUPABASE_ANON_KEY` (the publishable
 * anon key — NOT the service-role key `getAuthService()` uses; this
 * client is safe to exist in a server-only module because the anon key
 * is meant to be public, but it's still a distinct credential with
 * distinct, weaker privileges, and mixing the two up would be a real
 * mistake worth guarding against explicitly).
 */
export async function getOAuthClient(): Promise<SupabaseClient> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase env vars for OAuth (SUPABASE_URL, SUPABASE_ANON_KEY). " +
        "See services/identity-service/.env.example and docs/onboarding/repository-setup.md.",
    );
  }

  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // Route Handlers/Server Actions can set cookies; called from a
        // context that can't (e.g. a Server Component render) this
        // throws — acceptable here since this client is only ever
        // constructed from the OAuth-initiating Server Action or the
        // /auth/callback Route Handler, both of which can.
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      },
    },
  });
}
