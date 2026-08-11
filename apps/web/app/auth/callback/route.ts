import { NextRequest, NextResponse } from "next/server";
import { getAuthService } from "../../../lib/auth";
import { getOAuthClient } from "../../../lib/supabase-ssr";
import { setSessionCookies } from "../../../lib/session-cookies";
import { logSecurity } from "../../../lib/logger";

/**
 * The route both the magic-link email AND Google OAuth redirect back
 * to. Two distinct branches, deliberately not sharing a code path
 * beyond the final cookie-setting step:
 *
 * - `token_hash` present → magic link, verified via
 *   `getAuthService().verifyMagicLinkCallback()` (service-role client,
 *   this app's original/primary auth method — see that method's own
 *   doc comment for the PKCE-vs-token_hash history).
 * - `code` present → Google OAuth, exchanged via the `@supabase/ssr`
 *   cookie-aware client from `lib/supabase-ssr.ts` — REQUIRED for OAuth
 *   specifically, because its PKCE `code_verifier` was persisted in a
 *   cookie by that same client when `signInWithGoogleAction` initiated
 *   the flow; `getAuthService()`'s stateless service-role client has no
 *   way to complete that exchange (exactly the failure mode magic link
 *   already hit once — see `docs/security/auth-threat-model.md`).
 *
 * Both branches converge on the same final step: map the result into
 * this app's own `Session` shape and call `setSessionCookies()`, so
 * every other part of the app keeps reading auth state one single way
 * regardless of which method the user signed in with.
 */
export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const code = request.nextUrl.searchParams.get("code");
  const rememberMe = request.nextUrl.searchParams.get("remember") === "1";

  if (code) {
    try {
      const supabase = await getOAuthClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error || !data.session || !data.user?.email) {
        throw new Error(error?.message ?? "no session returned");
      }
      logSecurity.info("oauth_verified", { userId: data.user.id, provider: "google" });

      const response = NextResponse.redirect(new URL("/dashboard", request.url));
      setSessionCookies(
        response.cookies,
        {
          userId: data.user.id,
          email: data.user.email,
          issuedAt: new Date().toISOString(),
          expiresAt: new Date((data.session.expires_at ?? 0) * 1000).toISOString(),
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
        },
        rememberMe,
      );
      return response;
    } catch (err) {
      logSecurity.error("oauth_callback_verification_failed", err);
      return NextResponse.redirect(new URL("/login?error=verification_failed", request.url));
    }
  }

  if (!tokenHash) {
    logSecurity.warn("auth_callback_missing_token_hash");
    return NextResponse.redirect(new URL("/login?error=missing_token", request.url));
  }

  try {
    const auth = getAuthService();
    const session = await auth.verifyMagicLinkCallback(tokenHash);
    logSecurity.info("magic_link_verified", { userId: session.userId });

    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    setSessionCookies(response.cookies, session, rememberMe);
    return response;
  } catch (err) {
    logSecurity.error("auth_callback_verification_failed", err);
    return NextResponse.redirect(new URL("/login?error=verification_failed", request.url));
  }
}
