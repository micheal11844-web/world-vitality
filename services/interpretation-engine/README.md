# services/interpretation-engine

The AI/interpretation-provider interface (ADR-0003, BUILD_PLAN Stage 1
ticket 1.2) — the contract any AI model or analytical adapter must
implement.

## What's here

- **`InterpretationProvider.ts`** — the interface itself: `interpret()`
  (produce a confidence-scored, explained result from normalized data) and
  `evaluate()` (the seam the Stage 4 evaluation framework attaches to).

## Status

Interface only — no model is implemented against it yet. That's
BUILD_PLAN Stage 4, ticket 4.1 (first narrow interpretive capability,
recommended: Agriculture soil-moisture status).

## Why this shape

Every field on `InterpretationResult` maps to a specific Constitution
Section 9 (AI Principles) requirement — confidence level, plain-language
explanation, traceable contributing factors, and an explicit
"unable to answer" path instead of a fabricated guess. This isn't
incidental structure; it's how those principles get enforced at the type
level rather than left as a style guideline implementers might skip.

`ConfidenceLevel` is a plain-language tier (`"high" | "moderate" | "low" |
"insufficient-data"`), matching the Experience Blueprint's confidence
language (Section 10 — AI Experience) rather than a bare numeric score, so
the UI can render it directly.

**Note:** ADR-0003 and BUILD_PLAN 4.3 both reference a Section 20 of the
Experience Blueprint for the confidence/uncertainty design-language
component — the current Experience Blueprint document only runs through
Section 19 (Critical Review). This interface is instead grounded directly
in Section 10 (AI Experience), which contains the actual confidence-
language content. Worth reconciling the section reference when the
Experience Blueprint is next revised.

Treat this interface as provisional per ADR-0003's Standing Action Item —
validate against the first real capability (Stage 4) before treating it as
settled.
