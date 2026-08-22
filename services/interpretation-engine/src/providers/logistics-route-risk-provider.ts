import type {
  InterpretationProvider,
  InterpretationRequest,
  InterpretationResult,
  ConfidenceLevel,
  ContributingFactor,
} from "../InterpretationProvider.js";

const WIND_METRIC = "WS2M";

export const CAPABILITY_ID = "logistics.route-risk-status";

export type RouteRiskBand = "clear" | "elevated" | "high" | "severe";

/**
 * Wind-speed thresholds, in m/s, loosely modeled on the Beaufort scale
 * bands most commonly cited for small-craft/route-disruption caution
 * (roughly Beaufort 5/near-gale/gale) — **this project's own
 * reasonable interpretation of a widely-cited general pattern, not a
 * transcription of any specific port authority's, coast guard's, or
 * regulatory body's official advisory thresholds.** Same honesty
 * discipline as every other threshold-based provider in this codebase
 * (`ConstructionRiskStatusProvider`, `WindGenerationStatusProvider`) —
 * flagged here rather than presented as authoritative.
 */
const ELEVATED_MS = 8;
const HIGH_MS = 14;
const SEVERE_MS = 20;

const BAND_LABEL: Record<RouteRiskBand, string> = {
  clear: "Clear",
  elevated: "Elevated risk",
  high: "High risk",
  severe: "Severe risk",
};

/** Exported so a future forecast-based Route Risk Outlook provider can
 *  classify forecast wind speeds with the exact same bands, rather
 *  than a second, easy-to-drift copy — same reuse pattern as
 *  Construction's and Renewable Energy's status/outlook pairs. Not yet
 *  built here — see this file's own doc comment for what's real. */
export function classifyRouteRisk(windMs: number): { band: RouteRiskBand; reason: string } {
  if (windMs < ELEVATED_MS) {
    return {
      band: "clear",
      reason: `${windMs.toFixed(1)} m/s is below the ${ELEVATED_MS} m/s threshold used here — normal operating conditions.`,
    };
  }
  if (windMs < HIGH_MS) {
    return {
      band: "elevated",
      reason: `${windMs.toFixed(1)} m/s is between ${ELEVATED_MS}–${HIGH_MS} m/s — worth monitoring, minor schedule impact possible.`,
    };
  }
  if (windMs < SEVERE_MS) {
    return {
      band: "high",
      reason: `${windMs.toFixed(1)} m/s is between ${HIGH_MS}–${SEVERE_MS} m/s — delays likely, rerouting or schedule adjustment worth considering.`,
    };
  }
  return {
    band: "severe",
    reason: `${windMs.toFixed(1)} m/s meets or exceeds the ${SEVERE_MS} m/s threshold used here — significant disruption likely, operations may need to pause.`,
  };
}

/**
 * `InterpretationProvider` for Logistics & Shipping's Route Risk status
 * — the sixth workspace built, second of the six previously-unbuilt
 * PRD workspaces (after Public Explorer). Classifies current wind
 * speed (`WS2M`, via `NasaPowerConnector`, unchanged — the same
 * parameter Construction and Renewable Energy already validated) into
 * a route-disruption risk band, per PRD Section A.5's "AI synthesizes
 * storm tracks, port-condition data, and route-specific historical
 * disruption patterns into a single 'route risk' recommendation."
 *
 * **Honest scope, stated plainly, not silently glossed over — this
 * covers a small fraction of PRD A.5's actual ambition:**
 * - **Wind speed only, at a single point.** The PRD describes
 *   synthesizing storm tracks, port-condition data, and
 *   route-specific historical disruption patterns — none of that
 *   exists in this codebase. There is no storm-track data source, no
 *   port-status data source, no flooding/corridor data source, and no
 *   concept of a multi-waypoint "route" at all (this evaluates one
 *   location, the same single-point pattern every other workspace's
 *   first cut uses, e.g. Construction's original Stage 12 status-only
 *   build before its Stage 12 follow-up added a timeline).
 * - **No forecast/outlook yet** — current conditions only, same
 *   incremental pattern Construction and Renewable Energy both
 *   followed (status first, forecast-based outlook as a deliberate
 *   follow-up, not assumed to ship together). `classifyRouteRisk` is
 *   already exported in anticipation of that follow-up, same reuse
 *   pattern as `classifyWindSpeed`.
 * - **Wind-only disruption signal** — real shipping/route disruption
 *   also comes from precipitation-driven flooding, visibility
 *   (fog/dust), and sea state, none of which this codebase has a data
 *   source for.
 *
 * Same threshold-based/non-ML/auditable pattern as every other status
 * provider in this codebase.
 */
export class LogisticsRouteRiskProvider implements InterpretationProvider {
  readonly id = "logistics-route-risk-v1";
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
        summary: `No ${WIND_METRIC} (wind speed) data is available for this route and time range.`,
        confidence: "insufficient-data",
        explanation: `This capability requires at least one wind speed reading (metric "${WIND_METRIC}") and none were provided in the input records.`,
        contributingFactors: [],
        unableToAnswer: {
          reason: `No records with metric "${WIND_METRIC}" in the request.`,
        },
      };
    }

    const latest = windRecords[windRecords.length - 1]!;
    const { band, reason } = classifyRouteRisk(latest.value);

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
      explanation: `${reason} Based on ${windRecords.length} wind speed reading(s), wind-only. Thresholds used are this project's own reasonable interpretation, not a specific port authority's or regulatory body's official advisory — see this provider's doc comment.`,
      contributingFactors,
    };
  }

  async evaluate(
    request: InterpretationRequest,
    groundTruth: unknown,
  ): Promise<{ result: InterpretationResult; matchesGroundTruth: boolean }> {
    const result = await this.interpret(request);
    const expectedBand = (groundTruth as { band?: RouteRiskBand } | undefined)?.band;
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
