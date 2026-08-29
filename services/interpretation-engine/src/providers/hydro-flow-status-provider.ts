import type {
  InterpretationProvider,
  InterpretationRequest,
  InterpretationResult,
  ConfidenceLevel,
  ContributingFactor,
} from "../InterpretationProvider.js";

const STREAMFLOW_METRIC = "STREAMFLOW_DISCHARGE";

export const CAPABILITY_ID = "renewable-energy.hydro-flow-status";

export type FlowBand = "low" | "moderate" | "high";

/**
 * Generic streamflow bands, in cubic feet per second (cfs) — **this
 * project's own reasonable interpretation for a mid-sized river gauge,
 * not a cited hydrological standard**, same discipline as
 * `WindGenerationStatusProvider`'s turbine envelope and
 * `SolarIrradianceStatusProvider`'s irradiance bands. A "high" flow on a
 * small creek and a "low" flow on the Mississippi are wildly different
 * absolute numbers — these thresholds are calibrated loosely around the
 * demo gauge station this workspace actually uses (a mid-sized river),
 * not a universal scale. Using this provider for a genuinely different
 * river without recalibrating these constants would produce a
 * technically-computed but practically-meaningless band.
 */
const LOW_MAX = 1000;
const MODERATE_MAX = 5000;

const BAND_LABEL: Record<FlowBand, string> = {
  low: "Low flow",
  moderate: "Moderate flow",
  high: "High flow",
};

export function classifyStreamflow(cfs: number): { band: FlowBand; reason: string } {
  if (cfs < LOW_MAX) {
    return {
      band: "low",
      reason: `${cfs.toFixed(0)} ft³/s is below the ${LOW_MAX} ft³/s threshold used here — a low-flow condition for this gauge.`,
    };
  }
  if (cfs < MODERATE_MAX) {
    return {
      band: "moderate",
      reason: `${cfs.toFixed(0)} ft³/s is between ${LOW_MAX} and ${MODERATE_MAX} ft³/s — a typical, moderate flow for this gauge.`,
    };
  }
  return {
    band: "high",
    reason: `${cfs.toFixed(0)} ft³/s meets or exceeds the ${MODERATE_MAX} ft³/s threshold used here — a high-flow condition for this gauge.`,
  };
}

/**
 * `InterpretationProvider` for Renewable Energy's hydro status — the
 * third and final asset type named in PRD A.4 ("solar, wind, and hydro
 * assets"), closing the last of the three. Consumes
 * `UsgsStreamflowConnector`'s real-time discharge records.
 *
 * **Honest scope, stated plainly, same discipline as wind and solar:**
 * - **Streamflow level, not generation output or capacity factor.**
 *   This codebase has no turbine, penstock, or head (elevation drop)
 *   specification for any real hydro asset — discharge alone cannot
 *   honestly be converted into estimated power output (power = f(flow,
 *   head, turbine efficiency), and two of those three variables are
 *   unknown here). Same "describe the resource, not the output"
 *   discipline as solar's irradiance-only framing.
 * - **Generic, gauge-relative bands, not a universal flow scale** — see
 *   the threshold constants' own doc comment above.
 * - **No forecast/outlook** — USGS NWIS has no public streamflow
 *   forecast API comparable to Open-Meteo's weather forecast; declining
 *   this rather than fabricating one, same reasoning `UsgsStreamflowConnector`'s
 *   own doc comment states.
 * - **US/territories-only demo site** — unlike wind/solar's global demo
 *   location, hydro's demo point is a specific US gauge station, for
 *   the geographic reason `UsgsStreamflowConnector` documents.
 *
 * Same threshold-based/non-ML/auditable pattern as every other status
 * provider in this codebase.
 */
export class HydroFlowStatusProvider implements InterpretationProvider {
  readonly id = "hydro-flow-status-v1";
  readonly supportedCapabilities = [CAPABILITY_ID];

  async interpret(request: InterpretationRequest): Promise<InterpretationResult> {
    if (request.capability !== CAPABILITY_ID) {
      throw new Error(
        `${this.id} does not support capability "${request.capability}" — only ${CAPABILITY_ID}`,
      );
    }

    const flowRecords = request.records
      .filter((r) => r.metric === STREAMFLOW_METRIC)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    if (flowRecords.length === 0) {
      return {
        summary: `No ${STREAMFLOW_METRIC} (streamflow discharge) data is available for this gauge station.`,
        confidence: "insufficient-data",
        explanation: `This capability requires at least one streamflow reading (metric "${STREAMFLOW_METRIC}") and none were provided in the input records.`,
        contributingFactors: [],
        unableToAnswer: {
          reason: `No records with metric "${STREAMFLOW_METRIC}" in the request.`,
        },
      };
    }

    const latest = flowRecords[flowRecords.length - 1]!;
    const { band, reason } = classifyStreamflow(latest.value);

    const contributingFactors: ContributingFactor[] = [
      {
        description: `Most recent streamflow reading (${latest.value.toFixed(0)} ft³/s) from ${latest.timestamp}.`,
        recordIds: [latest.id],
        relativeInfluence: "primary",
      },
    ];

    const confidence = this.confidenceFor(flowRecords.length);

    return {
      summary: `${BAND_LABEL[band]}: ${reason}`,
      confidence,
      explanation: `${reason} Based on ${flowRecords.length} streamflow reading(s). Thresholds used are this project's own generic interpretation calibrated for this demo gauge, not a cited standard — see this provider's doc comment.`,
      contributingFactors,
    };
  }

  async evaluate(
    request: InterpretationRequest,
    groundTruth: unknown,
  ): Promise<{ result: InterpretationResult; matchesGroundTruth: boolean }> {
    const result = await this.interpret(request);
    const expectedBand = (groundTruth as { band?: FlowBand } | undefined)?.band;
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
