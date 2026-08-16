import type {
  InterpretationProvider,
  InterpretationRequest,
  InterpretationResult,
  ConfidenceLevel,
  ContributingFactor,
} from "../InterpretationProvider.js";
import {
  assessConcretePour,
  assessCraneOperation,
  assessRoofingWork,
  type ActivityAssessment,
} from "./construction-risk-status-provider.js";

export const CAPABILITY_ID = "construction.site-risk-timeline";

const TEMPERATURE_METRIC = "T2M";
const WIND_METRIC = "WS2M";

type Range = "short" | "medium" | "long";

/** Same lead-time boundaries as `WeatherForecastProvider` — own
 *  reasonable interpretation, not a transcription of a meteorological
 *  standard, flagged rather than presented as authoritative. Reused
 *  as the identical boundary values on purpose: there's no domain
 *  reason forecast skill would degrade differently for Construction
 *  than for Weather & Climate. */
function rangeFor(leadDays: number): Range {
  if (leadDays <= 3) return "short";
  if (leadDays <= 7) return "medium";
  return "long";
}

function confidenceFor(range: Range): ConfidenceLevel {
  switch (range) {
    case "short":
      return "high";
    case "medium":
      return "moderate";
    case "long":
      return "low";
  }
}

export interface DayRiskEntry {
  date: string;
  leadDays: number;
  assessments: ActivityAssessment[];
  worstStatus: "go" | "caution" | "no-go";
}

function worstOf(assessments: ActivityAssessment[]): "go" | "caution" | "no-go" {
  if (assessments.some((a) => a.status === "no-go")) return "no-go";
  if (assessments.some((a) => a.status === "caution")) return "caution";
  return "go";
}

/**
 * `InterpretationProvider` for Construction's Site Risk **Timeline** —
 * the forward-looking, multi-day calendar the PRD's first-run
 * experience calls for (Section A.2), and the follow-up work
 * `ConstructionRiskStatusProvider`'s doc comment flagged as not yet
 * built. Consumes `OpenMeteoConnector`'s forecast records
 * (`recordType: "forecast"`) for both `T2M` and `WS2M` — Open-Meteo's
 * connector was extended to fetch daily max wind speed alongside
 * temperature specifically to make this provider possible; see that
 * connector's own comment for the `wind_speed_unit=ms` detail that
 * keeps its wind values comparable to NASA POWER's.
 *
 * Reuses `ConstructionRiskStatusProvider`'s exact per-activity
 * threshold functions (`assessConcretePour`/`assessCraneOperation`/
 * `assessRoofingWork`) rather than a second copy of the same logic —
 * the two providers differ in *time horizon and confidence model*
 * (current-conditions/data-sufficiency vs. forecast/lead-time), not in
 * what counts as risky for a given activity, so duplicating the
 * thresholds would only create a way for the two to silently drift
 * apart. Deliberately still a separate class, not a mode flag on
 * `ConstructionRiskStatusProvider` — same reasoning `WeatherForecastProvider`'s
 * doc comment gives for staying separate from `WeatherStatusProvider`.
 *
 * Confidence is lead-time-based, genuinely decreasing with how far out
 * a day is — the far end of a multi-day window is real, less reliable
 * forecast data, not styled to look uncertain.
 */
export class ConstructionSiteRiskTimelineProvider implements InterpretationProvider {
  readonly id = "construction-site-risk-timeline-v1";
  readonly supportedCapabilities = [CAPABILITY_ID];

  async interpret(request: InterpretationRequest): Promise<InterpretationResult> {
    if (request.capability !== CAPABILITY_ID) {
      throw new Error(
        `${this.id} does not support capability "${request.capability}" — only ${CAPABILITY_ID}`,
      );
    }

    const tempByDate = new Map<string, { value: number; id: string; leadDays: number }>();
    const windByDate = new Map<string, { value: number; id: string; leadDays: number }>();

    for (const r of request.records) {
      if (r.recordType !== "forecast" || !r.forecastIssuedAt) continue;
      if (r.metric !== TEMPERATURE_METRIC && r.metric !== WIND_METRIC) continue;

      const date = r.timestamp.slice(0, 10);
      const leadMs = new Date(r.timestamp).getTime() - new Date(r.forecastIssuedAt).getTime();
      const leadDays = Math.max(0, Math.round(leadMs / (1000 * 60 * 60 * 24)));
      const entry = { value: r.value, id: r.id, leadDays };

      if (r.metric === TEMPERATURE_METRIC) tempByDate.set(date, entry);
      else windByDate.set(date, entry);
    }

    const dates = Array.from(new Set([...tempByDate.keys(), ...windByDate.keys()])).sort();

    if (dates.length === 0) {
      return {
        summary: "No forecast data is available to build a Site Risk Timeline for this location.",
        confidence: "insufficient-data",
        explanation:
          'This capability requires forecast records (recordType: "forecast") for temperature and/or wind speed, and none were provided in the input.',
        contributingFactors: [],
        unableToAnswer: {
          reason: 'No forecast records with metric "T2M" or "WS2M" in the request.',
        },
      };
    }

    const days: DayRiskEntry[] = dates.map((date) => {
      const temp = tempByDate.get(date);
      const wind = windByDate.get(date);
      const assessments: ActivityAssessment[] = [];
      if (temp) assessments.push(assessConcretePour(temp.value));
      if (wind) assessments.push(assessCraneOperation(wind.value));
      if (wind) assessments.push(assessRoofingWork(wind.value));

      return {
        date,
        leadDays: Math.max(temp?.leadDays ?? 0, wind?.leadDays ?? 0),
        assessments,
        worstStatus: worstOf(assessments),
      };
    });

    const overallRange = rangeFor(Math.max(...days.map((d) => d.leadDays)));
    const confidence = confidenceFor(overallRange);

    const riskDays = days.filter((d) => d.worstStatus !== "go");

    const contributingFactors: ContributingFactor[] = days.map((d, i) => {
      const temp = tempByDate.get(d.date);
      const wind = windByDate.get(d.date);
      const recordIds = [temp?.id, wind?.id].filter((id): id is string => Boolean(id));
      return {
        description: `${d.date}: overall ${d.worstStatus} (${d.leadDays} day(s) ahead, ${rangeFor(d.leadDays)}-range).`,
        recordIds,
        relativeInfluence: i === 0 ? "primary" : "secondary",
      };
    });

    return {
      summary: this.summaryFor(days, riskDays, confidence),
      confidence,
      explanation: this.explanationFor(days, overallRange),
      contributingFactors,
    };
  }

  async evaluate(
    request: InterpretationRequest,
    groundTruth: unknown,
  ): Promise<{ result: InterpretationResult; matchesGroundTruth: boolean }> {
    const result = await this.interpret(request);
    const expected = (groundTruth as { anyRiskDay?: boolean } | undefined)?.anyRiskDay;
    const actual = /\b(caution|no-go)\b/.test(result.summary);
    return { result, matchesGroundTruth: expected !== undefined && expected === actual };
  }

  private summaryFor(
    days: DayRiskEntry[],
    riskDays: DayRiskEntry[],
    confidence: ConfidenceLevel,
  ): string {
    const spanDays = days.length;
    if (riskDays.length === 0) {
      return `No caution or no-go days in the next ${spanDays} day(s) — all assessed activities are go.`;
    }
    const qualifier =
      confidence === "low" ? " (treat the far end of this window as indicative only)" : "";
    const flagged = riskDays.map((d) => `${d.date} (${d.worstStatus})`).join(", ");
    return `${riskDays.length} of ${spanDays} day(s) have a caution or no-go: ${flagged}${qualifier}.`;
  }

  private explanationFor(days: DayRiskEntry[], overallRange: Range): string {
    const perDay = days
      .map((d) => {
        const parts = d.assessments.map((a) => `${a.label}: ${a.status}`).join(", ");
        return `${d.date} — ${parts || "no data"}`;
      })
      .join("; ");
    return `${perDay}. Confidence is set by the furthest-out day (${overallRange}-range) since that's the least reliable part of the window. Thresholds used are the same fixed general-guidance defaults as the current-conditions status — see ConstructionRiskStatusProvider's doc comment.`;
  }
}
