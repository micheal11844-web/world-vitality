# packages/ui-components

Shared design-system components (Engineering Blueprint Section 4.5: "built
once... consumed everywhere — no per-app duplication"). Currently holds
just the confidence/uncertainty design language (BUILD_PLAN Stage 4,
ticket 4.3) — the first component, built early per the Engineering
Blueprint's explicit recommendation, not retrofitted once `apps/web`
exists.

## What's here

- **`confidence.ts`** — `getConfidenceDisplay(level)` and
  `allConfidenceDisplays()`: the label, calm-toned description, semantic
  color token, and relative severity for each `ConfidenceLevel` from
  `services/interpretation-engine`.
- **`__tests__/confidence.test.ts`** — 4 passing tests.

## Deliberately not React (or Vue, or anything)

No frontend framework has been chosen yet — that's Stage 6. This package
is plain TypeScript data + logic: a single `Record<ConfidenceLevel,
ConfidenceDisplay>` lookup table. Once Stage 6 picks a framework, the
actual visual component (e.g. `<ConfidenceBadge level={...} />`) becomes a
thin wrapper around `getConfidenceDisplay()` — a few lines, not a
redesign or a decision made prematurely on this ticket's behalf.

`colorToken` values are semantic names (`"confidence-high"`, etc.), not
hex codes — real values belong in `packages/design-tokens`, which per the
Engineering Blueprint's package list doesn't exist yet either. Build that
package and wire these token names to real values before this ships in
an actual UI.

## Tone, not just data

Per Experience Blueprint Section 10 ("How it behaves during
uncertainty" — "it says so, plainly and calmly"), low confidence and
`insufficient-data` deliberately do **not** use error/warning-style
tokens or alarming language. Uncertainty is a normal, expected state to
communicate honestly — not a failure state to flag red.
