import type {
  InterpretationProvider,
  InterpretationRequest,
  InterpretationResult,
  ConfidenceLevel,
  ContributingFactor,
} from "../InterpretationProvider.js";

const WIND_METRIC = "WS2M";

export const CAPABILITY_ID = "renewable-energy.wind-generation-status";

export type GenerationBand = "below-cut-in" | "ramping" | "rated-output" | "cut-out";

/**
 * Generic wind-turbine operating envelope, in m/s. **Own reasonable
 * interpretation of commonly-cited generic turbine specifications, not
 * a specific manufacturer's power curve** — same discipline as
 * `ConstructionRiskStatusProvider`'s thresholds. Real turbines vary
 * (a Vestas V150 and a GE 2.5-120 don't cut in/out at the same wind
 * speed), and this project has no asset-specific power-curve data
 * source at all — the PRD's own user journey ("sign-up captures asset
 * location(s) and type") implies per-asset configuration that doesn't
 * exist yet. Flagged in this provider's own doc comment, not presented
 * as manufacturer-accurate.
 */
const CUT_IN_MS = 3;
const RATED_MS = 12;
const CUT_OUT_MS = 25;

const BAND_LABEL: Record<GenerationBand, string> = {
  "below-cut-in": "Below cut-in",
  ramping: "Ramping",
  "rated-output": "Rated output",
  "cut-out": "Cut-out (safety shutdown)",
};

/** Exported so `WindGenerationOutlookProvider` can classify forecast
 *  wind speeds with the exact same bands, rather than a second,
 *  easy-to-drift copy — same reuse pattern as Construction's
 *  status/timeline provider pair. */
export function classifyWindSpeed(windMs: number): { band: GenerationBand; reason: string } {
  if (windMs < CUT_IN_MS) {
    return {
      band: "below-cut-in",
      reason: `${windMs.toFixed(1)} m/s is below the ${CUT_IN_MS} m/s cut-in speed used here — a turbine would not be generating.`,
    };
  }
  if (windMs < RATED_MS) {
    return {
      band: "ramping",
      reason: `${windMs.toFixed(1)} m/s is between cut-in and rated speed — partial generation, increasing with wind speed.`,
    };
  }
  if (windMs < CUT_OUT_MS) {
    return {
      band: "rated-output",
      reason: `${windMs.toFixed(1)} m/s is at or above the ${RATED_MS} m/s rated-speed threshold used here — generation at or near rated capacity.`,
    };
  }
  return {
    band: "cut-out",
    reason: `${windMs.toFixed(1)} m/s meets or exceeds the ${CUT_OUT_MS} m/s cut-out threshold used here — a turbine would safety-shutdown, not generate.`,
  };
}

/**
 * `InterpretationProvider` for Renewable Energy's current wind
 * generation status — the fourth workspace. Classifies current wind
 * speed (`WS2M`, via `NasaPowerConnector`, unchanged — the same
 * parameter Construction already validated) into a generic turbine
 * operating band, per PRD Section A.4's "AI translates raw ...
 * wind-speed ... data into asset-specific generation forecasts."
 *
 * **Honest scope, stated plainly:**
 * - **Wind only.** The PRD's Renewable Energy workspace covers solar
 *   and hydro too ("solar, wind, and hydro assets"). Neither is built:
 *   solar needs an irradiance data source (POWER does have
 *   `ALLSKY_SFC_SW_DWN`, but no provider or workspace UI consumes it
 *   yet), and hydro needs streamflow/hydrological data this codebase
 *   has no connector for at all. Scoping to wind alone is a real,
 *   stated choice, not silently presenting a partial build as the
 *   full three-asset-type workspace.
 * - **No anomaly detection.** The PRD's "How AI enhances the
 *   experience" calls out flagging "underperformance relative to
 *   conditions, suggesting equipment issues rather than environmental
 *   causes" — that needs an actual generation/output data feed from
 *   the asset itself, which doesn't exist in this codebase. This
 *   provider can only describe *conditions*, not compare them against
 *   real output.
 * - **Generic turbine envelope, not asset-specific** — see the
 *   threshold constants' own doc comment above.
 *
 * Same threshold-based/non-ML/auditable pattern as every other status
 * provider in this codebase.
 */
export class WindGenerationStatusProvider implements InterpretationProvider {
  readonly id = "wind-generation-status-v1";
  readonly supportedCapabilities = [CAPABILITY_ID];

  async interpret(request: InterpretationRequest): Promise<InterpretationResult> {
    if (request.capability !== CAPABILITY_ID) {
      throw new Error(
        `${this.id} does not support capability "${request.capability}" — only ${CAPABILITY_ID}`,
      );
    }

    const windRecords = request.records
      .filter((r) => r.metric === WIND_METRIC)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    if (windRecords.length === 0) {
      return {
        summary: `No ${WIND_METRIC} (wind speed) data is available for this location and time range.`,
        confidence: "insufficient-data",
        explanation: `This capability requires at least one wind speed reading (metric "${WIND_METRIC}") and none were provided in the input records.`,
        contributingFactors: [],
        unableToAnswer: {
          reason: `No records with metric "${WIND_METRIC}" in the request.`,
        },
      };
    }

    const latest = windRecords[windRecords.length - 1]!;
    const { band, reason } = classifyWindSpeed(latest.value);

    const contributingFactors: ContributingFactor[] = [
      {
        description: `Most recent wind speed reading (${latest.value.toFixed(1)} m/s) from ${latest.timestamp.slice(0, 10)}.`,
        recordIds: [latest.id],
        relativeInfluence: "primary",
      },
    ];

    const confidence = this.confidenceFor(windRecords.length);

    return {
      summary: `${BAND_LABEL[band]}: ${reason}`,
      confidence,
      explanation: `${reason} Based on ${windRecords.length} wind speed reading(s). Thresholds used are a generic turbine operating envelope, not a specific manufacturer's power curve — see this provider's doc comment.`,
      contributingFactors,
    };
  }

  async evaluate(
    request: InterpretationRequest,
    groundTruth: unknown,
  ): Promise<{ result: InterpretationResult; matchesGroundTruth: boolean }> {
    const result = await this.interpret(request);
    const expectedBand = (groundTruth as { band?: GenerationBand } | undefined)?.band;
    const matchesGroundTruth =
      expectedBand !== undefined && result.summary.startsWith(BAND_LABEL[expectedBand]);
    return { result, matchesGroundTruth };
  }

  private confidenceFor(readingCount: number): ConfidenceLevel {
    if (readingCount >= 5) return "high";
    if (readingCount >= 2) return "moderate";
    return "low";
  }
}
