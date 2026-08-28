import type {
  InterpretationProvider,
  InterpretationRequest,
  InterpretationResult,
  ConfidenceLevel,
  ContributingFactor,
} from "../InterpretationProvider.js";

const IRRADIANCE_METRIC = "ALLSKY_SFC_SW_DWN";

export const CAPABILITY_ID = "renewable-energy.solar-irradiance-status";

export type IrradianceBand = "minimal" | "low" | "moderate" | "high";

/**
 * Generic irradiance-level bands, in kWh/m²/day (NASA POWER's
 * `ALLSKY_SFC_SW_DWN` daily-average unit) — **this project's own
 * reasonable interpretation of typical solar resource levels, not a
 * cited meteorological or industry standard**, same discipline as
 * `WindGenerationStatusProvider`'s turbine envelope and
 * `ConstructionRiskStatusProvider`'s thresholds. Deliberately describes
 * *irradiance conditions*, not generation output or capacity factor —
 * this codebase has no real panel/inverter specification or installed-
 * capacity data for any asset, so it cannot honestly claim to estimate
 * actual kWh generated, only the resource level available to generate
 * from. Unlike wind's cut-in/rated/cut-out envelope (a real physical
 * turbine behavior), solar panels don't have an analogous hard
 * "cut-out" from excess irradiance — so this uses a plain low-to-high
 * scale instead of borrowing wind's shutdown-band framing where it
 * wouldn't honestly apply.
 */
const MINIMAL_MAX = 2;
const LOW_MAX = 4;
const MODERATE_MAX = 6;

const BAND_LABEL: Record<IrradianceBand, string> = {
  minimal: "Minimal irradiance",
  low: "Low irradiance",
  moderate: "Moderate irradiance",
  high: "High irradiance",
};

/** Exported for reuse (e.g. a future forecast-based outlook provider,
 *  mirroring `WindGenerationOutlookProvider`'s reuse of
 *  `classifyWindSpeed` — not built in this pass, see this file's
 *  module doc comment). */
export function classifySolarIrradiance(
  kwhPerM2PerDay: number,
): { band: IrradianceBand; reason: string } {
  if (kwhPerM2PerDay < MINIMAL_MAX) {
    return {
      band: "minimal",
      reason: `${kwhPerM2PerDay.toFixed(1)} kWh/m²/day is below the ${MINIMAL_MAX} kWh/m²/day threshold used here — very limited solar resource (heavy cloud cover, winter, or high latitude conditions).`,
    };
  }
  if (kwhPerM2PerDay < LOW_MAX) {
    return {
      band: "low",
      reason: `${kwhPerM2PerDay.toFixed(1)} kWh/m²/day is between ${MINIMAL_MAX} and ${LOW_MAX} kWh/m²/day — a modest solar resource.`,
    };
  }
  if (kwhPerM2PerDay < MODERATE_MAX) {
    return {
      band: "moderate",
      reason: `${kwhPerM2PerDay.toFixed(1)} kWh/m²/day is between ${LOW_MAX} and ${MODERATE_MAX} kWh/m²/day — a solid, typical solar resource.`,
    };
  }
  return {
    band: "high",
    reason: `${kwhPerM2PerDay.toFixed(1)} kWh/m²/day meets or exceeds the ${MODERATE_MAX} kWh/m²/day threshold used here — a strong solar resource.`,
  };
}

/**
 * `InterpretationProvider` for Renewable Energy's solar irradiance
 * status — closes the gap this workspace's own doc comments have
 * flagged since Stage 13 ("Solar needs an irradiance data source (NASA
 * POWER does offer `ALLSKY_SFC_SW_DWN`, but no provider or UI consumes
 * it yet — real, scoped follow-up work, not built here)"). Uses
 * `NasaPowerConnector` with `community: "RE"` (Renewable Energy, the
 * community NASA POWER's own API groups this parameter under),
 * unchanged connector, same pattern as every other status provider.
 *
 * **Honest scope, stated plainly:**
 * - **Irradiance level, not generation output or capacity factor** —
 *   see the threshold constants' own doc comment above for why.
 * - **Still no hydro.** This closes one of the two gaps
 *   `WindGenerationStatusProvider`'s doc comment named — hydro still
 *   needs streamflow/hydrological data this codebase has no connector
 *   for at all, unchanged by this addition.
 * - **No anomaly detection** — same limitation as wind: this describes
 *   *conditions*, not a comparison against a real panel's actual
 *   output, which this codebase has no data feed for.
 * - **Generic bands, not site- or panel-specific** — see threshold
 *   doc comment.
 *
 * Same threshold-based/non-ML/auditable pattern as every other status
 * provider in this codebase.
 */
export class SolarIrradianceStatusProvider implements InterpretationProvider {
  readonly id = "solar-irradiance-status-v1";
  readonly supportedCapabilities = [CAPABILITY_ID];

  async interpret(request: InterpretationRequest): Promise<InterpretationResult> {
    if (request.capability !== CAPABILITY_ID) {
      throw new Error(
        `${this.id} does not support capability "${request.capability}" — only ${CAPABILITY_ID}`,
      );
    }

    const irradianceRecords = request.records
      .filter((r) => r.metric === IRRADIANCE_METRIC)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    if (irradianceRecords.length === 0) {
      return {
        summary: `No ${IRRADIANCE_METRIC} (solar irradiance) data is available for this location and time range.`,
        confidence: "insufficient-data",
        explanation: `This capability requires at least one solar irradiance reading (metric "${IRRADIANCE_METRIC}") and none were provided in the input records.`,
        contributingFactors: [],
        unableToAnswer: {
          reason: `No records with metric "${IRRADIANCE_METRIC}" in the request.`,
        },
      };
    }

    const latest = irradianceRecords[irradianceRecords.length - 1]!;
    const { band, reason } = classifySolarIrradiance(latest.value);

    const contributingFactors: ContributingFactor[] = [
      {
        description: `Most recent solar irradiance reading (${latest.value.toFixed(1)} kWh/m²/day) from ${latest.timestamp.slice(0, 10)}.`,
        recordIds: [latest.id],
        relativeInfluence: "primary",
      },
    ];

    const confidence = this.confidenceFor(irradianceRecords.length);

    return {
      summary: `${BAND_LABEL[band]}: ${reason}`,
      confidence,
      explanation: `${reason} Based on ${irradianceRecords.length} solar irradiance reading(s). Thresholds used are this project's own generic interpretation of typical solar resource levels, not a cited standard — see this provider's doc comment.`,
      contributingFactors,
    };
  }

  async evaluate(
    request: InterpretationRequest,
    groundTruth: unknown,
  ): Promise<{ result: InterpretationResult; matchesGroundTruth: boolean }> {
    const result = await this.interpret(request);
    const expectedBand = (groundTruth as { band?: IrradianceBand } | undefined)?.band;
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
