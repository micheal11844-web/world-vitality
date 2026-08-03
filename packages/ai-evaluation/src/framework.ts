import type {
  InterpretationProvider,
  InterpretationRequest,
  InterpretationResult,
} from "@world-vitality/interpretation-engine";

/**
 * One labeled test case: a request plus the expected correct answer.
 * `groundTruth`'s shape is provider-specific (each provider defines and
 * documents its own — see e.g. `SoilMoistureStatusProvider.evaluate`'s
 * `{ band: MoistureBand }` shape) — this framework only orchestrates
 * running cases and aggregating results, per ADR-0003's requirement that
 * the evaluation framework be provider-agnostic (Engineering Blueprint
 * Section on extensibility: "Evaluation framework is provider-agnostic
 * by design, so a new model is evaluated against the same ground-truth
 * criteria as any existing one").
 */
export interface EvaluationCase {
  name: string;
  request: InterpretationRequest;
  groundTruth: unknown;
}

export interface CaseOutcome {
  name: string;
  passed: boolean;
  result: InterpretationResult;
}

export interface EvaluationSummary {
  providerId: string;
  totalCases: number;
  passed: number;
  failed: number;
  /** passed / totalCases, or 0 if there were no cases. */
  passRate: number;
  outcomes: CaseOutcome[];
}

/**
 * Run a provider against a suite of labeled cases and report how it did.
 *
 * Per Constitution Section 9, Principle 4 ("evaluated continuously, not
 * just at launch") and BUILD_PLAN ticket 4.2 ("validate this first
 * capability against ground truth before it's user-facing") — this is
 * meant to run in CI against every provider before it's trusted, not
 * just once during initial development.
 */
export async function runEvaluationSuite(
  provider: InterpretationProvider,
  cases: EvaluationCase[],
): Promise<EvaluationSummary> {
  const outcomes: CaseOutcome[] = [];

  for (const testCase of cases) {
    const { result, matchesGroundTruth } = await provider.evaluate(
      testCase.request,
      testCase.groundTruth,
    );
    outcomes.push({ name: testCase.name, passed: matchesGroundTruth, result });
  }

  const passed = outcomes.filter((o) => o.passed).length;

  return {
    providerId: provider.id,
    totalCases: cases.length,
    passed,
    failed: cases.length - passed,
    passRate: cases.length === 0 ? 0 : passed / cases.length,
    outcomes,
  };
}

/**
 * Throws with a readable failure report if any case in the suite failed.
 * Intended for use directly inside a CI test — see
 * `packages/ai-evaluation/src/__tests__/soil-moisture-status.eval.test.ts`
 * for the pattern.
 */
export function assertAllPassed(summary: EvaluationSummary): void {
  if (summary.failed > 0) {
    const failures = summary.outcomes
      .filter((o) => !o.passed)
      .map((o) => `  - ${o.name}: got "${o.result.summary}"`)
      .join("\n");
    throw new Error(
      `${summary.providerId}: ${summary.failed}/${summary.totalCases} evaluation case(s) failed:\n${failures}`,
    );
  }
}
