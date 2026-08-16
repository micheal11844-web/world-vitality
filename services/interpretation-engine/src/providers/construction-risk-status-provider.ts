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

export const CAPABILITY_ID = "construction.site-risk-status";

export type ActivityId = "concretePour" | "craneOperation" | "roofingWork";

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
 * **Honest scope, stated plainly:** the PRD also lists "flash-flood
 * risk for excavation sites" and "lightning proximity" as activities/
 * alerts for this workspace. Neither is implemented here — flash-flood
 * risk needs precipitation data (POWER's `PRECTOTCORR`) which isn't
 * ingested by this provider yet, and lightning proximity needs a
 * fundamentally different data source (strike-detection, not POWER's
 * daily aggregates) this codebase has no connector for at all. Building
 * either under a name implying it works would be exactly the kind of
 * fabrication the Constitution's AI Principles prohibit — real,
 * open follow-up work, not silently scoped out.
 */
const CONCRETE_POUR_MIN_C = 5;
const CONCRETE_POUR_CAUTION_MAX_C = 32;
const CRANE_CAUTION_MIN_MS = 8;
const CRANE_NO_GO_MIN_MS = 13;
const ROOFING_CAUTION_MIN_MS = 8;
const ROOFING_NO_GO_MIN_MS = 12;

function assessConcretePour(tempC: number): ActivityAssessment {
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

function assessCraneOperation(windMs: number): ActivityAssessment {
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

function assessRoofingWork(windMs: number): ActivityAssessment {
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

/**
 * `InterpretationProvider` for Construction's Site Risk status (BUILD_PLAN
 * Stage 12 — the third workspace). Cross-references current wind and
 * temperature conditions against fixed, per-activity operational
 * thresholds and produces a go/caution/no-go recommendation with
 * reasoning for each activity, rather than requiring the site manager to
 * interpret raw meteorological data — matching PRD Section A.2's "How AI
 * enhances the experience".
 *
 * Structurally the same threshold-based, non-ML, auditable pattern as
 * `SoilMoistureStatusProvider` and `WeatherStatusProvider`, extended from
 * "one metric, one band set" to "two metrics, several activity-specific
 * band sets" — a real but modest extension of the existing pattern, not
 * a new architecture.
 *
 * **Honest scope:** current conditions only, like `WeatherStatusProvider`
 * before its Stage 10 forecast work — this does not yet produce the PRD's
 * "forward-looking calendar of weather-sensitive risk windows" (the Site
 * Risk *Timeline*). That needs multi-day forecast data cross-referenced
 * against these same thresholds, which is real, scoped follow-up work
 * (`OpenMeteoConnector` would need wind-speed forecast fields added — it
 * currently only fetches temperature — a deliberate architecture decision
 * left for that ticket rather than rushed in here).
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

    if (tempRecords.length === 0 && windRecords.length === 0) {
      return {
        summary: `No ${TEMPERATURE_METRIC} (temperature) or ${WIND_METRIC} (wind speed) data is available for this location and time range.`,
        confidence: "insufficient-data",
        explanation:
          "This capability requires at least one temperature or wind reading and neither was provided in the input records.",
        contributingFactors: [],
        unableToAnswer: {
          reason: `No records with metric "${TEMPERATURE_METRIC}" or "${WIND_METRIC}" in the request.`,
        },
      };
    }

    const latestTemp = tempRecords[tempRecords.length - 1];
    const latestWind = windRecords[windRecords.length - 1];

    const assessments: ActivityAssessment[] = [];
    if (latestTemp) assessments.push(assessConcretePour(latestTemp.value));
    if (latestWind) assessments.push(assessCraneOperation(latestWind.value));
    if (latestWind) assessments.push(assessRoofingWork(latestWind.value));

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

    const readingCount = tempRecords.length + windRecords.length;
    const confidence: ConfidenceLevel = this.confidenceFor(
      Math.min(tempRecords.length || Infinity, windRecords.length || Infinity),
      readingCount,
    );

    const missingMetric =
      tempRecords.length === 0
        ? "temperature"
        : windRecords.length === 0
          ? "wind speed"
          : undefined;

    return {
      summary: this.summaryFor(assessments, missingMetric),
      confidence,
      explanation: this.explanationFor(assessments, missingMetric),
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

  private summaryFor(assessments: ActivityAssessment[], missingMetric?: string): string {
    if (assessments.length === 0) {
      return "No activity assessments could be produced from the available data.";
    }
    const parts = assessments.map((a) => `${a.label}: ${a.status}`);
    const qualifier = missingMetric
      ? ` (no ${missingMetric} data available, so activities depending on it were skipped)`
      : "";
    return `${parts.join("; ")}.${qualifier}`;
  }

  private explanationFor(assessments: ActivityAssessment[], missingMetric?: string): string {
    if (assessments.length === 0) {
      return "Neither temperature nor wind speed data was available to assess any activity.";
    }
    const reasons = assessments.map((a) => `${a.label} — ${a.reason}`).join(" ");
    const gapNote = missingMetric
      ? ` No ${missingMetric} data was available for this location and time range, so activities depending on it were not assessed.`
      : "";
    return `${reasons}${gapNote} Thresholds used here are fixed general-guidance defaults, not project-specific or manufacturer-specific limits — see this provider's doc comment.`;
  }
}
