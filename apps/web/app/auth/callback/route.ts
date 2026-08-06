import { NextRequest, NextResponse } from "next/server";
import { getAuthService } from "../../../lib/auth";
import { SESSION_COOKIE } from "../../../lib/constants";

/**
 * The route Supabase's magic-link email redirects back to
 * (`SUPABASE_AUTH_REDIRECT_URL` — see `.env.example` and
 * `docs/onboarding/repository-setup.md`). This is the piece that didn't
 * exist yet when that redirect URL was first configured — closing that
 * gap.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", request.url));
  }

  try {
    const auth = getAuthService();
    const session = await auth.exchangeCodeForSession(code);

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
    console.error("auth callback exchange failed:", err);
    // TEMPORARY debug surfacing — same as requestMagicLinkAction; revert
    // once the real cause is found.
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(`[debug] ${detail}`)}`, request.url),
    );
  }
}
