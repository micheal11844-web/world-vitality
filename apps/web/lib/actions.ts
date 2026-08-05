"use server";

import { getAuthService } from "./auth";

export interface RequestMagicLinkResult {
  ok: boolean;
  error?: string;
}

/**
 * Server Action backing the login form (`app/login/page.tsx`). Always
 * returns the same shape whether or not the email has an existing
 * account — per `AuthService.requestMagicLink`'s contract, never leak
 * account existence through a different response shape here either.
 */
export async function requestMagicLinkAction(email: string): Promise<RequestMagicLinkResult> {
  if (!email || !email.includes("@")) {
    return { ok: false, error: "Enter a valid email address." };
  }
  try {
    const auth = getAuthService();
    await auth.requestMagicLink(email);
    return { ok: true };
  } catch (err) {
    // User-facing message stays deliberately generic — per
    // requestMagicLink's contract, don't leak whether the failure was
    // "bad email" vs. "no account" vs. a real provider error. But the
    // real cause must still be logged server-side, or this is
    // undebuggable — which is exactly what happened the first time this
    // ran in production: three failed attempts, zero information about
    // why, because this catch block used to swallow the error entirely.
    console.error("requestMagicLinkAction failed:", err);
    return { ok: false, error: "Something went wrong sending the link. Please try again." };
  }
}
