"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getAuthService } from "./auth";
import { getOAuthClient } from "./supabase-ssr";
import { setSessionCookies } from "./session-cookies";
import { SESSION_COOKIE, REFRESH_COOKIE } from "./constants";
import { logSecurity, logTelemetry } from "./logger";
import { checkPasswordBreach } from "./password-breach-check";
import { getClientIp } from "./get-client-ip";

export interface RequestMagicLinkResult {
  ok: boolean;
  error?: string;
}

export interface PasswordAuthResult {
  ok: boolean;
  error?: string;
}

/**
 * Server Action backing the login form (`app/login/page.tsx`). Always
 * returns the same shape whether or not the email has an existing
 * account — per `AuthService.requestMagicLink`'s contract, never leak
 * account existence through a different response shape here either.
 *
 * The real failure reason is logged server-side via `logSecurity`
 * (this is an auth event) — never returned to the browser. An earlier
 * version of this file did the opposite (a `[debug]` prefix on the
 * returned error) to unblock diagnosing the original production auth
 * bugs quickly; that was explicitly temporary and is reverted here now
 * that the flow is confirmed working end-to-end.
 */
export async function requestMagicLinkAction(email: string): Promise<RequestMagicLinkResult> {
  if (!email || !email.includes("@")) {
    return { ok: false, error: "Enter a valid email address." };
  }
  try {
    const auth = getAuthService();
    await auth.requestMagicLink(email);
    logSecurity.info("magic_link_requested", { email });
    logTelemetry.event("magic_link_requested");
    return { ok: true };
  } catch (err) {
    logSecurity.error("magic_link_request_failed", err, { email });
    return { ok: false, error: "Something went wrong sending the link. Please try again." };
  }
}

/**
 * Password-based sign-up. Same generic-error-message discipline as the
 * rest of this file — see `AuthService.signUpWithPassword`'s doc
 * comment for the honest caveat about what Supabase's response shape
 * does/doesn't reveal about existing accounts.
 */
export async function signUpWithPasswordAction(
  email: string,
  password: string,
  rememberMe: boolean,
): Promise<PasswordAuthResult> {
  if (!email || !email.includes("@")) {
    return { ok: false, error: "Enter a valid email address." };
  }
  if (!password || password.length < 8) {
    // Length floor only (NIST SP 800-63B guidance researched before
    // building this — length over composition rules); the
    // PasswordStrengthMeter gives real-time feedback beyond this floor,
    // this is just the hard minimum, not the actual quality bar.
    return { ok: false, error: "Password must be at least 8 characters." };
  }
  const breachCheck = await checkPasswordBreach(password);
  if (breachCheck.breached) {
    logSecurity.info("password_signup_rejected_breached", { email });
    return {
      ok: false,
      error:
        "This password has appeared in a known data breach. Please choose a different password.",
    };
  }
  try {
    const auth = getAuthService();
    const session = await auth.signUpWithPassword(email, password);
    const cookieStore = await cookies();
    setSessionCookies(cookieStore, session, rememberMe);
    logSecurity.info("password_signup_succeeded", { userId: session.userId });
    logTelemetry.event("password_signup_succeeded");
    return { ok: true };
  } catch (err) {
    logSecurity.error("password_signup_failed", err, { email });
    return {
      ok: false,
      error: "Couldn't create your account. Check your email may need confirming, or try again.",
    };
  }
}

/**
 * Password-based sign-in. Deliberately generic error message — does
 * not distinguish "wrong password" from "no such account" (same
 * account-existence-shouldn't-leak principle as magic link), which
 * matters more here than for magic link since this is exactly the
 * attack surface credential-stuffing/brute-force tools target — see
 * `docs/security/auth-threat-model.md`'s updated threat list.
 *
 * **Rate limiting, extended to per-IP too:** checks per-email
 * (`checkSignInLockout`) and per-IP (`checkSignInIpLockout`) lockout
 * status before ever calling Supabase's own auth API, so a
 * known-locked-out account/network doesn't spend that budget on a
 * request already known to fail. Per-email: 5 failures within 15
 * minutes locks the account for 15 minutes, cleared on success via
 * `recordSuccessfulSignIn`. Per-IP: 20 failures within 15 minutes
 * locks that IP for 15 minutes — higher threshold since an IP can
 * represent many real users behind NAT/a shared network, and
 * deliberately never cleared on success (see `get-client-ip.ts` and
 * `SupabaseAuthService`'s doc comments for why). Both applied directly
 * to the live Supabase project and verified against real inputs before
 * this code was written to call them. The lockout message is
 * deliberately more specific than the generic invalid-credentials one
 * — telling a legitimate locked-out user "too many attempts, try again
 * later" is meaningfully more useful than leaving them guessing
 * whether their password itself is wrong, and locking the account
 * already prevents further guessing regardless of what the message
 * says.
 */
export async function signInWithPasswordAction(
  email: string,
  password: string,
  rememberMe: boolean,
): Promise<PasswordAuthResult> {
  if (!email || !password) {
    return { ok: false, error: "Enter your email and password." };
  }
  try {
    const auth = getAuthService();
    const ip = await getClientIp();

    if (ip) {
      const ipLockout = await auth.checkSignInIpLockout(ip);
      if (ipLockout.locked) {
        logSecurity.info("password_signin_blocked_ip_rate_limited", { ip });
        return {
          ok: false,
          error: "Too many failed attempts from this network. Please try again in a few minutes.",
        };
      }
    }

    const lockout = await auth.checkSignInLockout(email);
    if (lockout.locked) {
      logSecurity.info("password_signin_blocked_rate_limited", { email });
      return {
        ok: false,
        error: "Too many failed attempts. Please try again in a few minutes.",
      };
    }
    try {
      const session = await auth.signInWithPassword(email, password);
      const cookieStore = await cookies();
      setSessionCookies(cookieStore, session, rememberMe);
      await auth.recordSuccessfulSignIn(email);
      logSecurity.info("password_signin_succeeded", { userId: session.userId });
      logTelemetry.event("password_signin_succeeded");
      return { ok: true };
    } catch (err) {
      await auth.recordFailedSignIn(email);
      if (ip) {
        await auth.recordFailedSignInIp(ip);
      }
      logSecurity.error("password_signin_failed", err, { email });
      return { ok: false, error: "Invalid email or password." };
    }
  } catch (err) {
    // getAuthService() throws if Supabase env vars are missing — an
    // infrastructure/config failure, not a credential failure. Same
    // outer safety net the original (pre-rate-limiting) version of
    // this function already had.
    logSecurity.error("password_signin_failed", err, { email });
    return { ok: false, error: "Invalid email or password." };
  }
}

/**
 * Initiates Google sign-in. Redirects the browser to Google's consent
 * screen — never returns normally on success (Next.js's `redirect()`
 * throws internally, by design, to unwind out of the Server Action).
 * The eventual callback lands at `/auth/callback?code=...`, handled by
 * that route's OAuth branch — see its doc comment and
 * `lib/supabase-ssr.ts` for why this needs a different client than
 * every other auth method in this file.
 *
 * **Bug fixed here, found in real production use:** the previous
 * version called `getOAuthClient()` (which throws if `SUPABASE_URL`/
 * `SUPABASE_ANON_KEY` aren't set) outside any try/catch. With
 * `SUPABASE_ANON_KEY` not yet configured in Vercel, that throw was
 * never caught — the Server Action rejected with an unhandled error,
 * the client's `handleGoogleClick` never caught it either, and
 * `googleLoading` never got reset: the button spun forever with no
 * feedback. Now the entire body runs inside try/catch, with `redirect()`
 * called from the `catch` block on failure (never from inside `try` —
 * `redirect()` itself throws a special signal internally, so calling
 * it inside `try` would let this function's own `catch` swallow that
 * signal and break the redirect; verified against Next.js's own docs
 * on this exact gotcha before writing this, given the CSP incident's
 * lesson about not guessing at framework internals a second time).
 *
 * `rememberMe` is threaded through as a query param on the callback URL
 * (not a cookie set here) since no session/cookie exists yet at this
 * point — there's nothing to attach a preference to until the callback
 * actually completes the exchange.
 */
export async function signInWithGoogleAction(rememberMe: boolean): Promise<void> {
  let providerUrl: string;
  try {
    const redirectBase = process.env.SUPABASE_AUTH_REDIRECT_URL;
    if (!redirectBase) {
      throw new Error("Missing SUPABASE_AUTH_REDIRECT_URL env var.");
    }
    const callbackUrl = new URL(redirectBase);
    callbackUrl.searchParams.set("remember", rememberMe ? "1" : "0");

    const supabase = await getOAuthClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl.toString() },
    });
    if (error || !data.url) {
      throw new Error(error?.message ?? "Supabase returned no OAuth URL.");
    }
    providerUrl = data.url;
  } catch (err) {
    logSecurity.error("oauth_initiation_failed", err);
    // A missing env var is a real, distinct, actionable case (the
    // owner hasn't finished Google/Supabase console setup yet) — surfaced
    // with its own error code so the login page can say so plainly,
    // rather than a generic "try again" that would be actively
    // misleading (retrying changes nothing until the env var is set).
    const code =
      err instanceof Error && err.message.includes("env var")
        ? "oauth_not_configured"
        : "oauth_failed";
    redirect(`/login?error=${code}`);
  }
  redirect(providerUrl);
}

/**
 * Server Action backing `app/forgot-password/page.tsx`. A genuinely
 * separate flow from `requestMagicLinkAction` above, even though both
 * send an emailed link — see `AuthService.requestPasswordReset`'s doc
 * comment. Same account-existence-shouldn't-leak discipline as every
 * other request-an-email action in this file.
 *
 * **Rate limiting, closing `docs/security/auth-threat-model.md`'s
 * previously-flagged "no rate limiting on `requestPasswordReset`"
 * gap:** `recordPasswordResetRequest` caps this at 3 requests per
 * email per 15 minutes before ever calling Supabase's own
 * `resetPasswordForEmail` — once exceeded, no further reset emails go
 * out until the window clears. This does NOT leak account existence:
 * the cap is recorded and enforced identically regardless of whether
 * the email belongs to a real account (the RPC call always runs
 * first, unconditionally), so a spammed nonexistent address hits the
 * exact same "too many requests" response a spammed real one does.
 */
export async function requestPasswordResetAction(email: string): Promise<RequestMagicLinkResult> {
  if (!email || !email.includes("@")) {
    return { ok: false, error: "Enter a valid email address." };
  }
  try {
    const auth = getAuthService();
    const rateLimit = await auth.recordPasswordResetRequest(email);
    if (!rateLimit.allowed) {
      logSecurity.info("password_reset_blocked_rate_limited", { email });
      return {
        ok: false,
        error: "Too many reset requests for this email. Please try again in a few minutes.",
      };
    }
    await auth.requestPasswordReset(email);
    logSecurity.info("password_reset_requested", { email });
    logTelemetry.event("password_reset_requested");
    return { ok: true };
  } catch (err) {
    logSecurity.error("password_reset_request_failed", err, { email });
    return { ok: false, error: "Something went wrong sending the link. Please try again." };
  }
}

export interface UpdatePasswordResult {
  ok: boolean;
  error?: string;
}

/**
 * Server Action backing `app/reset-password/page.tsx`. Only reachable
 * with a valid session cookie — which, on this page, can only have
 * gotten there via `/auth/callback`'s `type=recovery` branch (see that
 * route's doc comment). Identifies *who* is resetting from that
 * session cookie itself, not from any value the client submits, since
 * a client-submitted user ID would be trivially spoofable.
 *
 * **Deliberately signs the user out immediately after a successful
 * update**, rather than leaving the recovery-derived session active —
 * clears both cookies directly (safe to do before any `redirect()`,
 * unlike calling `redirect()` itself inside `try`; see
 * `signInWithGoogleAction`'s doc comment above for that specific
 * gotcha, avoided here by not calling `redirect()` in this function at
 * all — the client navigates via `window.location.href` on `ok: true`,
 * same pattern as `handlePasswordSubmit` on the login page). The
 * reasoning: a password-reset flow proves control of an inbox, not
 * necessarily physical control of whatever device the link was
 * clicked from (a shared/public computer, a screenshare, etc.) —
 * requiring a fresh sign-in with the new password is the more
 * conservative choice. See `docs/security/auth-threat-model.md`.
 */
export async function updatePasswordAction(newPassword: string): Promise<UpdatePasswordResult> {
  if (!newPassword || newPassword.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }
  const breachCheck = await checkPasswordBreach(newPassword);
  if (breachCheck.breached) {
    logSecurity.info("password_reset_rejected_breached", {});
    return {
      ok: false,
      error:
        "This password has appeared in a known data breach. Please choose a different password.",
    };
  }
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionToken) {
    return {
      ok: false,
      error: "Your password reset link has expired. Please request a new one.",
    };
  }
  try {
    const auth = getAuthService();
    const session = await auth.getSession(sessionToken);
    if (!session) {
      return {
        ok: false,
        error: "Your password reset link has expired. Please request a new one.",
      };
    }
    await auth.updatePassword(session.userId, newPassword);
    cookieStore.delete(SESSION_COOKIE);
    cookieStore.delete(REFRESH_COOKIE);
    logSecurity.info("password_reset_completed", { userId: session.userId });
    logTelemetry.event("password_reset_completed");
    return { ok: true };
  } catch (err) {
    logSecurity.error("password_reset_failed", err);
    return { ok: false, error: "Couldn't update your password. Please try again." };
  }
}
