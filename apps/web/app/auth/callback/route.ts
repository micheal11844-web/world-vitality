import { NextRequest, NextResponse } from "next/server";
import { getAuthService } from "../../../lib/auth";
import { SESSION_COOKIE } from "../../../lib/constants";

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
 * `docs/onboarding/repository-setup.md`, Stage 6 section. Without that
 * template change, this route never receives `token_hash` either.
 */
export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  if (!tokenHash) {
    return NextResponse.redirect(new URL("/login?error=missing_token", request.url));
  }

  try {
    const auth = getAuthService();
    const session = await auth.verifyMagicLinkCallback(tokenHash);

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
    console.error("auth callback verification failed:", err);
    // TEMPORARY debug surfacing — same as requestMagicLinkAction; revert
    // once the flow is confirmed working end-to-end.
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(`[debug] ${detail}`)}`, request.url),
    );
  }
}
