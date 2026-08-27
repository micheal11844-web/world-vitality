import { NextRequest, NextResponse } from "next/server";
import { getAuthService } from "../../../lib/auth";
import { getAccountService } from "../../../lib/account";
import { getOAuthClient } from "../../../lib/supabase-ssr";
import { setSessionCookies } from "../../../lib/session-cookies";
import { logSecurity, logTelemetry } from "../../../lib/logger";

/**
 * The route both the magic-link email, the password-reset email, AND
 * Google OAuth redirect back to. Three branches, deliberately not
 * sharing a code path beyond the final cookie-setting step:
 *
 * - `token_hash` + `type=recovery` → password reset (a Forgot Password
 *   flow, added after the magic-link/password/OAuth flows above —
 *   verified via `getAuthService().verifyPasswordResetCallback()`.
 *   **Deliberately redirects to `/reset-password`, not `/dashboard`** —
 *   unlike the other two branches, reaching this route from a password-
 *   reset email should never drop the user straight into the app; it
 *   should require them to actually set a new password first. Session
 *   cookies ARE set here (Supabase's recovery token itself
 *   authenticates the user, by design, so the reset-password page's
 *   Server Action can identify who's resetting) but with `rememberMe`
 *   forced `false` regardless of the `remember` query param — a
 *   recovery-derived session is short-lived and single-purpose, never
 *   something to persist long-term. See `docs/security/auth-threat-model.md`.
 * - `token_hash` + `type=invite` → a team invite (BUILD_PLAN "STAGE —
 *   TEAM/INVITE UI"), verified via `getAuthService().verifyInviteCallback()`.
 *   Structurally the same as the recovery branch (redirects to
 *   `/reset-password` so the invitee sets their own password, session
 *   never "remembered") with one addition: on success, this route itself
 *   creates the real `workspace_members` row from the pending
 *   workspace/role/scope the invite carried — the one and only place
 *   that row gets created outside direct SQL. If that membership write
 *   fails, the invite's own metadata has already been cleared (see
 *   `verifyInviteCallback`'s doc comment), so this is logged via
 *   `logSecurity` and surfaced to the user as a verification failure
 *   rather than silently dropping them into an app with no workspace
 *   access — the fallback is the same direct-SQL path every other
 *   membership issue on this app has used so far.
 * - `token_hash` (no `type`, or `type=email`) → magic link, verified via
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
 * All three branches converge on the same final step: map the result
 * into this app's own `Session` shape and call `setSessionCookies()`,
 * so every other part of the app keeps reading auth state one single
 * way regardless of which method the user signed in with.
 */
export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
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
      logTelemetry.event("oauth_verified", { provider: "google" });

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

  if (type === "recovery") {
    try {
      const auth = getAuthService();
      const session = await auth.verifyPasswordResetCallback(tokenHash);
      logSecurity.info("password_reset_link_verified", { userId: session.userId });
      logTelemetry.event("password_reset_link_verified");

      const response = NextResponse.redirect(new URL("/reset-password", request.url));
      // Always false — see this function's doc comment for why a
      // recovery-derived session must never be "remembered."
      setSessionCookies(response.cookies, session, false);
      return response;
    } catch (err) {
      logSecurity.error("password_reset_link_verification_failed", err);
      return NextResponse.redirect(new URL("/login?error=verification_failed", request.url));
    }
  }

  if (type === "invite") {
    try {
      const auth = getAuthService();
      const { session, pendingWorkspaceId, pendingRole, pendingScopedResourceIds } =
        await auth.verifyInviteCallback(tokenHash);

      if (pendingWorkspaceId && pendingRole) {
        // Membership creation is the actual point of this branch — a
        // failure here must surface as a verification failure, not be
        // silently swallowed, since the alternative is a user who
        // "accepted" an invite with no resulting workspace access.
        await getAccountService().createMembership({
          workspaceId: pendingWorkspaceId,
          userId: session.userId,
          role: pendingRole,
          scopedResourceIds: pendingScopedResourceIds,
        });
        try {
          await getAccountService().recordAuditEvent({
            workspaceId: pendingWorkspaceId,
            userId: session.userId,
            action: "invite:accepted",
          });
        } catch (auditErr) {
          // An audit-write failure must never block a genuinely accepted
          // invite that already succeeded above — same fail-open
          // reasoning as every other recordAuditEvent caller.
          logSecurity.error("invite_audit_event_write_failed", auditErr, {
            workspace: pendingWorkspaceId,
          });
        }
      } else {
        logSecurity.warn("invite_link_missing_pending_fields", { userId: session.userId });
      }

      logSecurity.info("invite_link_verified", {
        userId: session.userId,
        workspace: pendingWorkspaceId,
      });
      logTelemetry.event("invite_link_verified", { workspace: pendingWorkspaceId });

      const response = NextResponse.redirect(new URL("/reset-password", request.url));
      // Always false — same reasoning as the recovery branch: an
      // invite-derived session is short-lived and single-purpose.
      setSessionCookies(response.cookies, session, false);
      return response;
    } catch (err) {
      logSecurity.error("invite_link_verification_failed", err);
      return NextResponse.redirect(new URL("/login?error=verification_failed", request.url));
    }
  }

  try {
    const auth = getAuthService();
    const session = await auth.verifyMagicLinkCallback(tokenHash);
    logSecurity.info("magic_link_verified", { userId: session.userId });
    logTelemetry.event("magic_link_verified");

    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    setSessionCookies(response.cookies, session, rememberMe);
    return response;
  } catch (err) {
    logSecurity.error("auth_callback_verification_failed", err);
    return NextResponse.redirect(new URL("/login?error=verification_failed", request.url));
  }
}
