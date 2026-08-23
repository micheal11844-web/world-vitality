import { headers } from "next/headers";

/**
 * Best-effort client IP extraction for `signInWithPasswordAction`'s
 * per-IP rate limiting (see `services/identity-service`'s
 * `checkSignInIpLockout`/`recordFailedSignInIp`). Server Actions don't
 * get a request object the way Route Handlers do, but `headers()` from
 * `next/headers` is available in the same request context and is the
 * documented way to read them from a Server Action.
 *
 * Reads `x-forwarded-for` (the first entry — Vercel's edge network
 * reliably sets this to the real client IP as the first item;
 * subsequent entries are proxies further down the chain, which a
 * client cannot spoof past Vercel's own edge) and falls back to
 * `x-real-ip`. Returns `null` — not a fabricated placeholder — if
 * neither header is present, which the caller must handle by skipping
 * IP-based rate limiting for that request rather than rate-limiting
 * against a made-up key.
 *
 * **Not verified against a real Vercel deployment from this build
 * environment** — same caveat as every other request-shape-dependent
 * code path in this app. `x-forwarded-for` is Vercel's documented
 * behavior, not an assumption invented here, but hasn't been observed
 * directly against a live request from this sandbox.
 */
export async function getClientIp(): Promise<string | null> {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = headerList.get("x-real-ip");
  if (realIp) return realIp.trim();
  return null;
}
