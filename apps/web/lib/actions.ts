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
  } catch {
    // Deliberately generic — per requestMagicLink's contract, don't leak
    // whether the failure was "bad email" vs. "no account" vs. a real
    // provider error. Server-side logs (not built yet — Stage 7) are
    // where the real error detail belongs.
    return { ok: false, error: "Something went wrong sending the link. Please try again." };
  }
}
