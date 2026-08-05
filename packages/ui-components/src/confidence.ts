import type { ConfidenceLevel } from "@world-vitality/interpretation-engine";

/**
 * The shared confidence/uncertainty design language (BUILD_PLAN Stage 4,
 * ticket 4.3) — "a consistent visual vocabulary for communicating 'we
 * are confident,' 'we are moderately confident,' and 'we don't have
 * enough data to say' across every surface" (Engineering Blueprint,
 * Standing Recommendation 4), built early rather than retrofitted once
 * `apps/web` exists.
 *
 * **Deliberately framework-agnostic.** No frontend framework has been
 * chosen yet (that's Stage 6 — `apps/web` doesn't exist). Rather than
 * guess React/Vue/Svelte and risk a rewrite, this defines the single
 * source of truth as plain data + logic: labels, descriptions, and
 * semantic color *tokens* (names, not hex values — `packages/design-
 * tokens` doesn't exist yet either, per the Engineering Blueprint's own
 * package list, so this uses placeholder token names a real design-
 * tokens package should supply actual values for). Once Stage 6 picks a
 * framework, the actual `<ConfidenceBadge>` component is a thin wrapper
 * around `getConfidenceDisplay()` — a few lines, not a redesign.
 *
 * Tone follows Experience Blueprint Section 10 directly: confidence is
 * communicated "plainly and calmly" — never alarmist about low
 * confidence, never overstated for high confidence.
 */
export interface ConfidenceDisplay {
  level: ConfidenceLevel;
  /** Short label for inline/badge display, per Section 10's exact
   *  examples ("high confidence", "limited data available"). */
  label: string;
  /** One sentence, calm register, for a tooltip or expanded view. */
  description: string;
  /** Semantic color token name — a real value comes from
   *  `packages/design-tokens` once that package exists. Deliberately
   *  not "success/warning/error" semantics: low confidence is not an
   *  error state, so borrowing error-styling tokens would misrepresent
   *  it (Section 10: uncertainty is stated plainly, not treated as
   *  something having gone wrong). */
  colorToken: "confidence-high" | "confidence-moderate" | "confidence-low" | "confidence-unknown";
  /** Relative visual weight (1 = most prominent/certain), for cases
   *  like sorting or choosing icon fill vs. outline — not a numeric
   *  confidence score; never derive a percentage from this. */
  severity: 1 | 2 | 3 | 4;
}

const DISPLAYS: Record<ConfidenceLevel, ConfidenceDisplay> = {
  high: {
    level: "high",
    label: "High confidence",
    description: "This is based on sufficient, recent data.",
    colorToken: "confidence-high",
    severity: 1,
  },
  moderate: {
    level: "moderate",
    label: "Moderate confidence",
    description: "This is based on some data, but not as much as we'd like.",
    colorToken: "confidence-moderate",
    severity: 2,
  },
  low: {
    level: "low",
    label: "Limited confidence",
    description:
      "This is based on very little recent data — treat it as a starting point, not a settled answer.",
    colorToken: "confidence-low",
    severity: 3,
  },
  "insufficient-data": {
    level: "insufficient-data",
    label: "Not enough data to say",
    description: "We don't have enough information to answer this right now.",
    colorToken: "confidence-unknown",
    severity: 4,
  },
};

/** Look up the display treatment for a given confidence level. */
export function getConfidenceDisplay(level: ConfidenceLevel): ConfidenceDisplay {
  return DISPLAYS[level];
}

/** All confidence displays, ordered from most to least certain — useful
 *  for building a legend. */
export function allConfidenceDisplays(): ConfidenceDisplay[] {
  return (Object.keys(DISPLAYS) as ConfidenceLevel[])
    .map((level) => DISPLAYS[level])
    .sort((a, b) => a.severity - b.severity);
}
