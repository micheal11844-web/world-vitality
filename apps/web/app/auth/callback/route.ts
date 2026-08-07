import { NextRequest, NextResponse } from "next/server";
import { getAuthService } from "../../../lib/auth";
import { SESSION_COOKIE } from "../../../lib/constants";
import { logSecurity } from "../../../lib/logger";

/**
 * The route Supabase's magic-link email redirects back to
 * (`SUPABASE_AUTH_REDIRECT_URL` — see `.env.example` and
 * `docs/onboarding/repository-setup.md`).
 *
 * Reads `token_hash`/`type`, not `code` — this app never uses PKCE's
 * `code` exchange (it can't: requestMagicLinkAction runs in a stateless
 * Server Action with no persisted `code_verifier` to complete a PKCE
 * exchange with). Supabase's Magic Link email template must be
 * customized to link here with `token_hash={{ .TokenHash }}&type=email`
 * instead of the default `{{ .ConfirmationURL }}` — see
 * `docs/onboarding/repository-setup.md`, Stage 6 section.
 */
export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  if (!tokenHash) {
    logSecurity.warn("auth_callback_missing_token_hash");
    return NextResponse.redirect(new URL("/login?error=missing_token", request.url));
  }

  try {
    const auth = getAuthService();
    const session = await auth.verifyMagicLinkCallback(tokenHash);
    logSecurity.info("magic_link_verified", { userId: session.userId });

    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    response.cookies.set(SESSION_COOKIE, session.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(session.expiresAt),
    });
    return response;
  } catch (err) {
    logSecurity.error("auth_callback_verification_failed", err);
    return NextResponse.redirect(new URL("/login?error=verification_failed", request.url));
  }
}
