import type {
  InterpretationProvider,
  InterpretationRequest,
  InterpretationResult,
  ConfidenceLevel,
  ContributingFactor,
} from "../InterpretationProvider.js";

/**
 * NASA POWER parameter codes this provider consumes. Both come through
 * the same `NasaPowerConnector` already used by `SoilMoistureStatusProvider`
 * (GWETROOT) and `WeatherStatusProvider` (T2M) — no data-ingestion changes
 * needed, same validation of the ingestion/interpretation boundary those
 * providers already established (see `WeatherStatusProvider`'s doc comment).
 * `WS2M` is POWER's "Wind Speed at 2 Meters", m/s.
 */
const TEMPERATURE_METRIC = "T2M";
const WIND_METRIC = "WS2M";
/** POWER's "Precipitation Corrected", mm/day. Closing this provider's
 *  own previously-honest "not implemented" gap for excavation/
 *  flash-flood risk — see the doc comment below and BUILD_PLAN
 *  "STAGE — CONSTRUCTION FOLLOW-UP: EXCAVATION FLASH-FLOOD RISK". */
const PRECIP_METRIC = "PRECTOTCORR";

export const CAPABILITY_ID = "construction.site-risk-status";

export type ActivityId = "concretePour" | "craneOperation" | "roofingWork" | "excavation";

export type ActivityStatus = "go" | "caution" | "no-go";

export interface ActivityAssessment {
  activity: ActivityId;
  label: string;
  status: ActivityStatus;
  reason: string;
}

const ACTIVITY_LABELS: Record<ActivityId, string> = {
  concretePour: "Concrete pour",
  craneOperation: "Crane operation",
  roofingWork: "Roofing work",
  excavation: "Excavation (flash-flood risk)",
};

/**
 * Threshold values below, in °C / m/s. **Stated plainly rather than
 * implied authoritative** (same discipline as `WeatherStatusProvider`'s
 * temperature bands and `SoilMoistureStatusProvider`'s moisture bands):
 * these are this implementation's own reasonable interpretation of
 * commonly-cited general guidance (ACI cold/hot-weather concreting
 * practice; commonly-cited mobile-crane and roofing wind-caution
 * figures), not a transcription of any single binding standard, and not
 * specific to any manufacturer's load chart or a given jurisdiction's
 * code. The PRD (Section A.2) explicitly calls these "configurable per
 * activity type" as the eventual real feature — these are fixed
 * defaults, not yet configurable per project, which is a real gap
 * flagged rather than hidden.
 *
 * **Honest scope, stated plainly:** the PRD also lists "lightning
 * proximity" as an alert for this workspace — not implemented here.
 * Lightning proximity needs a fundamentally different data source
 * (strike-detection, not POWER's daily aggregates) this codebase has
 * no connector for at all. Building it under a name implying it works
 * would be exactly the kind of fabrication the Constitution's AI
 * Principles prohibit — real, open, permanent gap, not silently
 * scoped out.
 *
 * "Flash-flood risk for excavation sites" — also named in the PRD —
 * **is** implemented below (`assessExcavation`), using POWER's
 * `PRECTOTCORR` (Precipitation Corrected, mm/day), added alongside
 * `T2M`/`WS2M` with zero data-ingestion changes needed: same
 * `NasaPowerConnector`, same "AG" community, one more parameter code
 * in the same request — the same validated reuse pattern as every
 * prior workspace extension.
 */
const CONCRETE_POUR_MIN_C = 5;
const CONCRETE_POUR_CAUTION_MAX_C = 32;
const CRANE_CAUTION_MIN_MS = 8;
const CRANE_NO_GO_MIN_MS = 13;
const ROOFING_CAUTION_MIN_MS = 8;
const ROOFING_NO_GO_MIN_MS = 12;
/**
 * mm/day. This project's own reasonable interpretation of commonly-
 * cited general guidance on when standing/ponding water becomes a
 * real hazard for open excavations and trenches (soil-wall
 * destabilization, sudden collapse, engulfment risk) — not a
 * transcription of any single binding standard (e.g. OSHA 1926
 * Subpart P names the hazard but doesn't specify a rainfall
 * threshold; site-specific geotechnical judgment governs in
 * practice), and not specific to any soil type or shoring method.
 * Same "stated plainly, not implied authoritative" discipline as
 * every other threshold in this provider.
 */
const EXCAVATION_CAUTION_MIN_MM = 10;
const EXCAVATION_NO_GO_MIN_MM = 25;

/** Exported so `ConstructionSiteRiskTimelineProvider` can reuse the
 *  exact same per-activity logic against forecast data, rather than a
 *  second, easy-to-drift copy of the same thresholds. */
export function assessConcretePour(tempC: number): ActivityAssessment {
  if (tempC < CONCRETE_POUR_MIN_C) {
    return {
      activity: "concretePour",
      label: ACTIVITY_LABELS.concretePour,
      status: "no-go",
      reason: `Below ${CONCRETE_POUR_MIN_C}°C (currently ${tempC.toFixed(1)}°C) — cold-weather concreting precautions would be required.`,
    };
  }
  if (tempC > CONCRETE_POUR_CAUTION_MAX_C) {
    return {
      activity: "concretePour",
      label: ACTIVITY_LABELS.concretePour,
      status: "caution",
      reason: `Above ${CONCRETE_POUR_CAUTION_MAX_C}°C (currently ${tempC.toFixed(1)}°C) — hot-weather concreting precautions (rapid set, plastic shrinkage cracking) recommended.`,
    };
  }
  return {
    activity: "concretePour",
    label: ACTIVITY_LABELS.concretePour,
    status: "go",
    reason: `${tempC.toFixed(1)}°C is within the normal pour temperature range.`,
  };
}

export function assessCraneOperation(windMs: number): ActivityAssessment {
  if (windMs >= CRANE_NO_GO_MIN_MS) {
    return {
      activity: "craneOperation",
      label: ACTIVITY_LABELS.craneOperation,
      status: "no-go",
      reason: `Wind at ${windMs.toFixed(1)} m/s meets or exceeds the ${CRANE_NO_GO_MIN_MS} m/s caution threshold used here — check the specific crane's rated wind limit before operating.`,
    };
  }
  if (windMs >= CRANE_CAUTION_MIN_MS) {
    return {
      activity: "craneOperation",
      label: ACTIVITY_LABELS.craneOperation,
      status: "caution",
      reason: `Wind at ${windMs.toFixed(1)} m/s is elevated — monitor conditions and the crane's rated limit closely.`,
    };
  }
  return {
    activity: "craneOperation",
    label: ACTIVITY_LABELS.craneOperation,
    status: "go",
    reason: `Wind at ${windMs.toFixed(1)} m/s is within normal operating range.`,
  };
}

export function assessRoofingWork(windMs: number): ActivityAssessment {
  if (windMs >= ROOFING_NO_GO_MIN_MS) {
    return {
      activity: "roofingWork",
      label: ACTIVITY_LABELS.roofingWork,
      status: "no-go",
      reason: `Wind at ${windMs.toFixed(1)} m/s meets or exceeds the ${ROOFING_NO_GO_MIN_MS} m/s threshold used here — elevated fall-hazard risk for roofing crews.`,
    };
  }
  if (windMs >= ROOFING_CAUTION_MIN_MS) {
    return {
      activity: "roofingWork",
      label: ACTIVITY_LABELS.roofingWork,
      status: "caution",
      reason: `Wind at ${windMs.toFixed(1)} m/s is elevated for work at height.`,
    };
  }
  return {
    activity: "roofingWork",
    label: ACTIVITY_LABELS.roofingWork,
    status: "go",
    reason: `Wind at ${windMs.toFixed(1)} m/s is within normal range for roofing work.`,
  };
}

/** Exported so `ConstructionSiteRiskTimelineProvider` can reuse the
 *  exact same logic against forecast data, same reuse pattern as
 *  `assessConcretePour`/`assessCraneOperation`/`assessRoofingWork`. Not
 *  yet consumed by the timeline provider — `OpenMeteoConnector` doesn't
 *  fetch a precipitation forecast today, only wind and temperature, so
 *  wiring this into the forward-looking timeline is real, separate,
 *  deliberately deferred follow-up work, not built here. */
export function assessExcavation(precipMm: number): ActivityAssessment {
  if (precipMm >= EXCAVATION_NO_GO_MIN_MM) {
    return {
      activity: "excavation",
      label: ACTIVITY_LABELS.excavation,
      status: "no-go",
      reason: `${precipMm.toFixed(1)} mm of precipitation meets or exceeds the ${EXCAVATION_NO_GO_MIN_MM} mm threshold used here — real risk of water accumulation and soil-wall destabilization in open excavations/trenches; a site-specific geotechnical assessment is warranted before proceeding.`,
    };
  }
  if (precipMm >= EXCAVATION_CAUTION_MIN_MM) {
    return {
      activity: "excavation",
      label: ACTIVITY_LABELS.excavation,
      status: "caution",
      reason: `${precipMm.toFixed(1)} mm of precipitation is elevated — monitor open excavations/trenches for water accumulation.`,
    };
  }
  return {
    activity: "excavation",
    label: ACTIVITY_LABELS.excavation,
    status: "go",
    reason: `${precipMm.toFixed(1)} mm of precipitation is within the normal range for excavation work.`,
  };
}

/**
 * `InterpretationProvider` for Construction's Site Risk status (BUILD_PLAN
 * Stage 12 — the third workspace). Cross-references current wind,
 * temperature, and precipitation conditions against fixed, per-activity
 * operational thresholds and produces a go/caution/no-go recommendation
 * with reasoning for each activity, rather than requiring the site
 * manager to interpret raw meteorological data — matching PRD Section
 * A.2's "How AI enhances the experience".
 *
 * Structurally the same threshold-based, non-ML, auditable pattern as
 * `SoilMoistureStatusProvider` and `WeatherStatusProvider`, extended from
 * "one metric, one band set" to "three metrics, several activity-specific
 * band sets" — a real but modest extension of the existing pattern, not
 * a new architecture.
 *
 * **Current conditions only** — this provider itself does not produce
 * the PRD's "forward-looking calendar of weather-sensitive risk windows."
 * That's `ConstructionSiteRiskTimelineProvider`, a separate provider
 * (Stage 12 follow-up) that reuses this file's exported per-activity
 * threshold functions against `OpenMeteoConnector`'s forecast data —
 * see that provider's own doc comment for why it's a separate class
 * rather than a mode flag here. **Excavation is current-conditions only
 * for now**: the timeline provider doesn't yet include it, since
 * `OpenMeteoConnector` doesn't fetch a precipitation forecast today
 * (wind and temperature only) — real, separate follow-up work.
 */
export class ConstructionRiskStatusProvider implements InterpretationProvider {
  readonly id = "construction-risk-status-v1";
  readonly supportedCapabilities = [CAPABILITY_ID];

  async interpret(request: InterpretationRequest): Promise<InterpretationResult> {
    if (request.capability !== CAPABILITY_ID) {
      throw new Error(
        `${this.id} does not support capability "${request.capability}" — only ${CAPABILITY_ID}`,
      );
    }

    const tempRecords = request.records
      .filter((r) => r.metric === TEMPERATURE_METRIC)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const windRecords = request.records
      .filter((r) => r.metric === WIND_METRIC)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const precipRecords = request.records
      .filter((r) => r.metric === PRECIP_METRIC)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    if (tempRecords.length === 0 && windRecords.length === 0 && precipRecords.length === 0) {
      return {
        summary: `No ${TEMPERATURE_METRIC} (temperature), ${WIND_METRIC} (wind speed), or ${PRECIP_METRIC} (precipitation) data is available for this location and time range.`,
        confidence: "insufficient-data",
        explanation:
          "This capability requires at least one temperature, wind, or precipitation reading and none were provided in the input records.",
        contributingFactors: [],
        unableToAnswer: {
          reason: `No records with metric "${TEMPERATURE_METRIC}", "${WIND_METRIC}", or "${PRECIP_METRIC}" in the request.`,
        },
      };
    }

    const latestTemp = tempRecords[tempRecords.length - 1];
    const latestWind = windRecords[windRecords.length - 1];
    const latestPrecip = precipRecords[precipRecords.length - 1];

    const assessments: ActivityAssessment[] = [];
    if (latestTemp) assessments.push(assessConcretePour(latestTemp.value));
    if (latestWind) assessments.push(assessCraneOperation(latestWind.value));
    if (latestWind) assessments.push(assessRoofingWork(latestWind.value));
    if (latestPrecip) assessments.push(assessExcavation(latestPrecip.value));

    const contributingFactors: ContributingFactor[] = [];
    if (latestTemp) {
      contributingFactors.push({
        description: `Most recent temperature reading (${latestTemp.value.toFixed(1)}°C) from ${latestTemp.timestamp.slice(0, 10)}.`,
        recordIds: [latestTemp.id],
        relativeInfluence: "primary",
      });
    }
    if (latestWind) {
      contributingFactors.push({
        description: `Most recent wind speed reading (${latestWind.value.toFixed(1)} m/s) from ${latestWind.timestamp.slice(0, 10)}.`,
        recordIds: [latestWind.id],
        relativeInfluence: "primary",
      });
    }
    if (latestPrecip) {
      contributingFactors.push({
        description: `Most recent precipitation reading (${latestPrecip.value.toFixed(1)} mm) from ${latestPrecip.timestamp.slice(0, 10)}.`,
        recordIds: [latestPrecip.id],
        relativeInfluence: "primary",
      });
    }

    const readingCount = tempRecords.length + windRecords.length + precipRecords.length;
    const confidence: ConfidenceLevel = this.confidenceFor(
      Math.min(
        tempRecords.length || Infinity,
        windRecords.length || Infinity,
        precipRecords.length || Infinity,
      ),
      readingCount,
    );

    const missingMetrics: string[] = [];
    if (tempRecords.length === 0) missingMetrics.push("temperature");
    if (windRecords.length === 0) missingMetrics.push("wind speed");
    if (precipRecords.length === 0) missingMetrics.push("precipitation");

    return {
      summary: this.summaryFor(assessments, missingMetrics),
      confidence,
      explanation: this.explanationFor(assessments, missingMetrics),
      contributingFactors,
    };
  }

  async evaluate(
    request: InterpretationRequest,
    groundTruth: unknown,
  ): Promise<{ result: InterpretationResult; matchesGroundTruth: boolean }> {
    const result = await this.interpret(request);
    const expected = (groundTruth as { anyNoGo?: boolean } | undefined)?.anyNoGo;
    const actual = /\bno-go\b/.test(result.summary);
    return {
      result,
      matchesGroundTruth: expected !== undefined && expected === actual,
    };
  }

  private confidenceFor(minPerMetricCount: number, totalCount: number): ConfidenceLevel {
    if (totalCount === 0) return "insufficient-data";
    const effective = Number.isFinite(minPerMetricCount) ? minPerMetricCount : totalCount;
    if (effective >= 5) return "high";
    if (effective >= 2) return "moderate";
    return "low";
  }

  private summaryFor(assessments: ActivityAssessment[], missingMetrics: string[]): string {
    if (assessments.length === 0) {
      return "No activity assessments could be produced from the available data.";
    }
    const parts = assessments.map((a) => `${a.label}: ${a.status}`);
    const qualifier =
      missingMetrics.length > 0
        ? ` (${missingMetrics.map((m) => `no ${m} data available`).join("; ")}, so activities depending on it were skipped)`
        : "";
    return `${parts.join("; ")}.${qualifier}`;
  }

  private explanationFor(assessments: ActivityAssessment[], missingMetrics: string[]): string {
    if (assessments.length === 0) {
      return "No temperature, wind speed, or precipitation data was available to assess any activity.";
    }
    const reasons = assessments.map((a) => `${a.label} — ${a.reason}`).join(" ");
    const gapNote =
      missingMetrics.length > 0
        ? ` ${missingMetrics.map((m) => `No ${m} data was available for this location and time range`).join("; ")}, so activities depending on ${missingMetrics.length > 1 ? "them" : "it"} were not assessed.`
        : "";
    return `${reasons}${gapNote} Thresholds used here are fixed general-guidance defaults, not project-specific or manufacturer-specific limits — see this provider's doc comment.`;
  }
}
