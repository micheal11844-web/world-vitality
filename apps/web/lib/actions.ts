"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getAuthService } from "./auth";
import { getOAuthClient } from "./supabase-ssr";
import { setSessionCookies } from "./session-cookies";
import { logSecurity } from "./logger";

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
  try {
    const auth = getAuthService();
    const session = await auth.signUpWithPassword(email, password);
    const cookieStore = await cookies();
    setSessionCookies(cookieStore, session, rememberMe);
    logSecurity.info("password_signup_succeeded", { userId: session.userId });
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
    const session = await auth.signInWithPassword(email, password);
    const cookieStore = await cookies();
    setSessionCookies(cookieStore, session, rememberMe);
    logSecurity.info("password_signin_succeeded", { userId: session.userId });
    return { ok: true };
  } catch (err) {
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
