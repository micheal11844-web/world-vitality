"use client";

import { useEffect, useMemo, useState } from "react";
import type { ZxcvbnResult } from "@zxcvbn-ts/core";

let zxcvbnLoader: Promise<(password: string, userInputs: string[]) => ZxcvbnResult> | null = null;
function loadZxcvbn() {
  // Dynamic `import()`, not a top-level static import: zxcvbn's
  // dictionaries are inherently large data (thousands of common
  // passwords/words), and a static import would bundle that weight
  // into every page that so much as imports this component's *module*
  // — which, before this fix, meant every page in the app, since this
  // component ships from the same shared `@world-vitality/ui-
  // components` barrel as Button/Card/AppShell. Real regression found
  // via an actual production-build check (First Load JS jumped from
  // ~110 kB to ~950 kB on pages that don't even render a password
  // field), not assumed fine — see BUILD_PLAN changelog. This keeps
  // the cost paid only once, only by someone who actually opens the
  // password tab, and only after mount (never during SSR), consistent
  // with the Constitution's low-bandwidth/global-equity performance
  // principle.
  if (!zxcvbnLoader) {
    zxcvbnLoader = Promise.all([
      import("@zxcvbn-ts/core"),
      import("@zxcvbn-ts/language-common"),
      import("@zxcvbn-ts/language-en"),
    ]).then(([core, common, en]) => {
      const instance = new core.ZxcvbnFactory({
        dictionary: { ...common.dictionary, ...en.dictionary },
        graphs: common.adjacencyGraphs,
        translations: en.translations,
      });
      return (password: string, userInputs: string[]) => instance.check(password, userInputs);
    });
  }
  return zxcvbnLoader;
}

const LABELS = ["Very weak", "Weak", "Fair", "Strong", "Very strong"] as const;
type StrengthLabels = readonly [string, string, string, string, string];
const COLORS = [
  "var(--wv-color-critical-500)",
  "var(--wv-color-critical-400)",
  "var(--wv-color-critical-200)",
  "var(--wv-color-accent-300)",
  "var(--wv-color-accent-500)",
] as const;

export interface PasswordStrengthMeterProps {
  password: string;
  /** Other user-known values (email, name) to penalize if reused in the
   *  password — zxcvbn calls this "user inputs." Passing the email here
   *  is what catches "uses their own email as their password," which a
   *  naive length/character-class checker would score as strong. */
  userInputs?: string[];
  /**
   * The five words for score 0 to 4, in the reader's language (English when
   * omitted). The host owns the translations; this package only receives them.
   */
  labels?: StrengthLabels;
  /** The spoken name of the meter, given the current label ("Password strength: Weak"). */
  ariaLabel?: (label: string) => string;
  /**
   * Show zxcvbn's own hint under the meter ("This is a top-10 common
   * password"). Those hints exist in English only, so a host showing another
   * language turns this off rather than putting English under translated
   * text; the word and colour still say how strong the password is.
   * Default: shown.
   */
  showHints?: boolean;
}

/**
 * Real-time password strength feedback (BUILD_PLAN — password auth
 * expansion), using `@zxcvbn-ts` — the actively-maintained TypeScript
 * fork of Dropbox's original `zxcvbn` (the original is unmaintained).
 * Deliberately NOT a naive length/uppercase/number/symbol checkbox
 * meter: those reward passwords like "P@ssw0rd1" (technically checks
 * every complexity box, cracked in seconds) over a long, unusual
 * passphrase — the exact failure mode current guidance moved away from.
 *
 * Reflects NIST SP 800-63B's current direction (researched before
 * building this, not assumed): prioritize length over composition
 * rules, and screen against realistic guessing patterns (dictionary
 * words, keyboard walks, l33t-speak substitutions, dates) rather than
 * counting character classes. zxcvbn is exactly this: a pattern-aware
 * guessability estimator, not a rule checklist.
 *
 * **Honest scope:** this estimates guessability from the password's
 * own structure. It does NOT check the password against known-breached-
 * password lists (e.g. Have I Been Pwned's Pwned Passwords API, which
 * OWASP's Authentication Cheat Sheet also recommends) — a password can
 * score "Very strong" here and still be a password from a real breach
 * if it happens to look structurally random. That's real, separate,
 * un-built follow-up work, not silently implied as covered.
 */
export function PasswordStrengthMeter({
  password,
  userInputs = [],
  labels = LABELS,
  ariaLabel = (label) => `Password strength: ${label}`,
  showHints = true,
}: PasswordStrengthMeterProps) {
  const [check, setCheck] = useState<
    ((password: string, userInputs: string[]) => ZxcvbnResult) | null
  >(null);

  useEffect(() => {
    if (!password || check) return;
    let cancelled = false;
    loadZxcvbn().then((fn) => {
      if (!cancelled) setCheck(() => fn);
    });
    return () => {
      cancelled = true;
    };
  }, [password, check]);

  const result = useMemo(() => {
    if (!password || !check) return null;
    return check(password, userInputs);
  }, [password, userInputs, check]);

  if (!password || !result) {
    return null;
  }

  const score = result.score; // 0-4
  const label = labels[score];
  const color = COLORS[score];

  return (
    <div style={{ marginTop: "var(--wv-space-xs)" }}>
      <div
        role="meter"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={4}
        aria-label={ariaLabel(label)}
        style={{
          display: "flex",
          gap: "4px",
          height: "4px",
          borderRadius: "2px",
          overflow: "hidden",
        }}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              backgroundColor: i <= score ? color : "var(--wv-border)",
              transition: "background-color 150ms ease",
            }}
          />
        ))}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "var(--wv-space-xs)",
          fontSize: "0.8125rem",
        }}
      >
        <span style={{ color }}>{label}</span>
        {showHints && result.feedback.warning && (
          <span style={{ color: "var(--wv-text-secondary)" }}>{result.feedback.warning}</span>
        )}
      </div>
    </div>
  );
}
