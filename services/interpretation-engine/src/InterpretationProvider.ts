import type { NormalizedDataRecord } from "@world-vitality/data-schemas";

/**
 * Plain-language confidence tiers, matching the Experience Blueprint's
 * confidence-language system (Section 10 — AI Experience: "every
 * substantive AI claim is paired with a plain-language confidence
 * signal... rendered visually and textually, never buried in a
 * footnote"). Deliberately not a bare 0–1 float — the UI renders these
 * tiers directly (e.g. "high confidence", "limited data available"),
 * and a numeric score alone would push that translation into every
 * caller instead of defining it once, here.
 *
 * `insufficient-data` is distinct from `low`: `low` means "the model
 * has an answer, but isn't very sure of it"; `insufficient-data` means
 * "the model does not have enough to answer at all" (Constitution
 * Section 9, Principle 2 — never fabricate; Section 10 — "it says so,
 * plainly and calmly" rather than guessing).
 */
export type ConfidenceLevel = "high" | "moderate" | "low" | "insufficient-data";

/**
 * One factor that contributed to an interpretation's output, for the
 * "traceable explanation" ADR-0003 requires. Points back at the
 * ingestion record(s) that drove the result, not just a prose summary.
 */
export interface ContributingFactor {
  /** Plain-language description of this factor's role in the result. */
  description: string;

  /** IDs of the NormalizedDataRecord(s) this factor is based on. */
  recordIds: string[];

  /** Roughly how much this factor influenced the result, if the model
   *  can meaningfully say — omit rather than fabricate a precise number. */
  relativeInfluence?: "primary" | "secondary" | "minor";
}

/**
 * The result of one interpretation request.
 *
 * Every field here maps directly to a Constitution AI Principle:
 * - `confidence` — Principle 1 (never more certain than the science
 *   supports).
 * - `explanation` / `contributingFactors` — Principle 5 ("because the
 *   model said so" is never acceptable).
 * - `unableToAnswer` — Principle 2 (never fabricate; disclose gaps).
 */
export interface InterpretationResult {
  /** Plain-language insight, suitable for direct display. Required even
   *  when confidence is low — per Experience Blueprint Section 10, the
   *  model offers "the closest thing it does know with confidence"
   *  rather than refusing outright, except when `unableToAnswer` applies. */
  summary: string;

  confidence: ConfidenceLevel;

  /** Plain-language reasoning behind the summary — not implementation
   *  detail (model internals), but the "why" a user or reviewer needs. */
  explanation: string;

  /** What specifically contributed to this result, traceable to input
   *  records. May be empty only if `unableToAnswer` is set. */
  contributingFactors: ContributingFactor[];

  /**
   * Set when the provider cannot produce a meaningful answer at all —
   * distinct from a low-confidence answer. When set, `summary` should
   * explain what's missing (e.g. "insufficient soil-moisture readings
   * in this area over the last 30 days"), not attempt a guess.
   */
  unableToAnswer?: {
    reason: string;
  };
}

/**
 * A request for interpretation, built entirely from normalized records —
 * never a provider-specific format on the way in (ADR-0003).
 */
export interface InterpretationRequest {
  /** The question or capability being invoked (e.g.
   *  "agriculture.soil-moisture-status") — namespaced per capability,
   *  not a single global endpoint, since Stage 4 builds one narrow
   *  capability at a time. */
  capability: string;

  /** The normalized data this interpretation is based on. */
  records: NormalizedDataRecord[];

  /** Optional free-text context from the user, for active (as opposed
   *  to ambient) AI interactions (Experience Blueprint Section 10). */
  userQuery?: string;
}

/**
 * The contract any AI model or analytical adapter must implement.
 *
 * Per ADR-0003 (AI/Interpretation Provider Interface): a provider must
 * accept normalized schema data (never provider-specific input), return
 * an explicit confidence signal and traceable explanation, report its
 * own uncertainty rather than guessing, and be independently evaluable
 * against ground truth.
 *
 * No model is implemented against this interface yet — that's
 * BUILD_PLAN Stage 4 (first narrow interpretive capability). The
 * evaluation framework this interface is meant to plug into
 * (`packages/ai-evaluation/`) is also Stage 4, not yet built; `evaluate()`
 * below is the seam it will attach to.
 */
export interface InterpretationProvider {
  /** Stable identifier for this provider/model adapter. */
  readonly id: string;

  /** Which capabilities this provider can serve (e.g.
   *  ["agriculture.soil-moisture-status"]) — used for routing. */
  readonly supportedCapabilities: string[];

  /**
   * Produce an interpretation for the given request.
   *
   * Implementations must never fabricate a plausible-sounding answer
   * when they lack sufficient basis — set `unableToAnswer` instead
   * (Constitution Section 9, Principle 2).
   */
  interpret(request: InterpretationRequest): Promise<InterpretationResult>;

  /**
   * Run this provider against a labeled ground-truth case and report
   * how its output compared, for continuous evaluation (Constitution
   * Section 9, Principle 4: evaluated continuously, not just at launch).
   * The shared evaluation framework (`packages/ai-evaluation/`, Stage 4)
   * will call this across a suite of cases; the per-case comparison
   * logic lives there, not duplicated per provider.
   */
  evaluate(
    request: InterpretationRequest,
    groundTruth: unknown,
  ): Promise<{ result: InterpretationResult; matchesGroundTruth: boolean }>;
}
