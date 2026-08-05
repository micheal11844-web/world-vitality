# services/interpretation-engine

The AI/interpretation-provider interface (ADR-0003, BUILD_PLAN Stage 1
ticket 1.2) — the contract any AI model or analytical adapter must
implement — plus the first capability built against it (BUILD_PLAN
Stage 4).

## What's here

- **`InterpretationProvider.ts`** — the interface itself: `interpret()`
  (produce a confidence-scored, explained result from normalized data) and
  `evaluate()` (the seam the Stage 4 evaluation framework attaches to).
- **`providers/soil-moisture-status-provider.ts`** — `SoilMoistureStatusProvider`
  (ticket 4.1), the first narrow interpretive capability: agriculture
  soil-moisture status from NASA POWER's `GWETROOT` parameter.
  Deliberately not ML — a transparent, threshold-based classifier. See
  its own doc comments for why, and for the honest caveat on where its
  threshold bands come from.
- **`providers/__tests__/soil-moisture-status-provider.test.ts`** — 8
  passing tests covering classification, confidence scaling, the
  unable-to-answer path, and `evaluate()`.

## Status

- **1.2** — interface: done.
- **4.1** — first capability (soil-moisture status): implemented and
  tested. Ground-truth evaluation lives in `packages/ai-evaluation`
  (ticket 4.2), not here — see that package's README.

No second provider or capability has been built yet — per ADR-0003's
Standing Action Item, the interface should still be treated as provisional
until one is.

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
