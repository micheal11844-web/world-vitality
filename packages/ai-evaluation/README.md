# packages/ai-evaluation

Shared framework for evaluating any `InterpretationProvider`'s output
against labeled ground truth (BUILD_PLAN Stage 4, ticket 4.2).

## What's here

- **`framework.ts`** — `runEvaluationSuite()` runs a provider against a
  set of `EvaluationCase`s (each a request + expected answer) via the
  provider's own `evaluate()` method, and aggregates pass/fail into an
  `EvaluationSummary`. `assertAllPassed()` throws a readable failure
  report — the pattern for wiring this into a CI-run test.
- **`__tests__/soil-moisture-status.eval.test.ts`** — the actual
  ground-truth suite for `SoilMoistureStatusProvider` (Stage 4's first
  capability): 7 hand-labeled cases covering each classification band,
  a boundary case, and multi-record handling. Run via `pnpm run test`.

## Design

Provider-agnostic by construction (Engineering Blueprint: "a new model is
evaluated against the same ground-truth criteria as any existing one") —
`runEvaluationSuite` only knows about the `InterpretationProvider`
interface, never a specific provider's internals. Each provider defines
its own `groundTruth` shape (documented on its `evaluate()` method) and
interprets it itself; this framework just orchestrates and reports.

## Status and honesty note

The soil-moisture ground-truth cases validate that the classification
logic is internally consistent with NASA POWER's own documented GWETROOT
scale (0=dry to 1=saturated) — they are not independently sourced from a
different measurement (e.g. real in-situ soil sensors at a real farm).
That's a stronger form of ground truth this evaluation framework supports
and is ready for, but building it requires real reference data that
doesn't exist in this repo yet. Worth doing before this capability is
trusted for real agricultural decisions — see
`services/interpretation-engine/src/providers/soil-moisture-status-provider.ts`'s
own doc comment on its threshold bands for the same caveat.
