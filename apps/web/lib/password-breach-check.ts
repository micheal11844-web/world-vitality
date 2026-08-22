import { createHash } from "node:crypto";
import { logSecurity } from "./logger";

/**
 * BUILD_PLAN's flagged, un-built follow-up, closed here: password
 * sign-up and password reset previously only enforced a length floor
 * (8 characters) — nothing checked whether the chosen password had
 * already appeared in a known data breach. OWASP's Authentication
 * Cheat Sheet specifically recommends checking new passwords against
 * Have I Been Pwned's Pwned Passwords API for exactly this reason.
 *
 * Uses the documented k-anonymity range API
 * (https://haveibeenpwned.com/API/v3#PwnedPasswords): only the first
 * 5 hex characters of the password's SHA-1 hash are ever sent over the
 * network — never the password itself, never the full hash. The API
 * returns every suffix sharing that 5-character prefix (typically
 * several hundred), and the match happens locally against that list.
 * No API key required; this is the free, publicly documented range
 * endpoint, not an authenticated bulk-lookup one.
 *
 * `checkSuffixAgainstRangeResponse` is deliberately split out as a
 * pure function — no network call inside it — following the same
 * "test the parsing logic, not the live HTTP call" pattern this repo
 * already uses for `NasaPowerConnector`/`OpenMeteoConnector`.
 *
 * **Honestly flagged, not silently worked around:** unlike those two
 * connectors, this function currently has no actual unit test next to
 * it. `apps/web` has never been wired into the repo's root `tsc
 * --build` project-reference graph (see root `tsconfig.json`'s
 * `references` list, and `apps/web/tsconfig.json`'s own `noEmit:
 * true`) — so it has no test files today, and a `.test.ts` placed
 * here would silently never run under `pnpm run test`, which would be
 * worse than no test at all. Wiring `apps/web` into the test runner is
 * a real, separate, pre-existing gap (not introduced by this file) —
 * worth its own ticket, not something to bolt on as a side effect of
 * one feature.
 */

function sha1Hex(input: string): string {
  return createHash("sha1").update(input, "utf8").digest("hex").toUpperCase();
}

/**
 * `rangeResponseText` is the API's actual response format: one
 * "SUFFIX:COUNT" pair per line, CRLF-separated, for every hash in the
 * range sharing the queried 5-character prefix. Returns the breach
 * count for the given suffix, or 0 if it isn't present in the range
 * (i.e., not a known breached password).
 */
export function checkSuffixAgainstRangeResponse(rangeResponseText: string, suffix: string): number {
  const upperSuffix = suffix.toUpperCase();
  for (const line of rangeResponseText.split("\n")) {
    const [lineSuffix, count] = line.trim().split(":");
    if (lineSuffix === upperSuffix) {
      return Number.parseInt(count ?? "0", 10) || 0;
    }
  }
  return 0;
}

export interface PasswordBreachCheckResult {
  /** True if the password appeared in a known breach corpus. */
  breached: boolean;
  /**
   * True if the check couldn't be completed (network/API failure) and
   * was skipped rather than blocking sign-up/reset on an unrelated
   * third-party outage — this is a defense-in-depth check, not the
   * primary defense (that's the length floor + Supabase's own account
   * security), so failing open here and logging it is the right
   * tradeoff, the same fail-open-with-logging pattern already used for
   * Google OAuth's config-missing case.
   */
  skipped: boolean;
}

/**
 * Checks `password` against the Pwned Passwords range API. Fails open
 * (returns `{ breached: false, skipped: true }`) on any network or API
 * error, logged via `logSecurity` so a real, sustained outage is still
 * visible — never blocks a legitimate sign-up because a third-party
 * service the app doesn't control is unreachable.
 */
export async function checkPasswordBreach(password: string): Promise<PasswordBreachCheckResult> {
  const hash = sha1Hex(password);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  try {
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "User-Agent": "World-Vitality-Password-Check" },
    });
    if (!response.ok) {
      throw new Error(`Pwned Passwords API returned ${response.status}`);
    }
    const text = await response.text();
    const count = checkSuffixAgainstRangeResponse(text, suffix);
    return { breached: count > 0, skipped: false };
  } catch (err) {
    logSecurity.error("password_breach_check_failed", err);
    return { breached: false, skipped: true };
  }
}
