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
    console.error("requestMagicLinkAction failed:", err);
    // TEMPORARY: surfacing the real error message directly to the UI
    // for debugging, since there are no real users yet and this is
    // faster than round-tripping through Vercel's log tooling. Revert
    // to the generic message below once the underlying cause is fixed —
    // leaking real error detail is not acceptable once real users exist.
    const detail = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `[debug] ${detail}` };
    // return { ok: false, error: "Something went wrong sending the link. Please try again." };
  }
}
