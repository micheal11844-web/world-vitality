"use server";

import { getAuthService } from "./auth";
import { logSecurity } from "./logger";

export interface RequestMagicLinkResult {
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
