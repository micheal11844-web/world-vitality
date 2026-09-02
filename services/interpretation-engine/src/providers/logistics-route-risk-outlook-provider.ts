import type {
  InterpretationProvider,
  InterpretationRequest,
  InterpretationResult,
  ConfidenceLevel,
  ContributingFactor,
} from "../InterpretationProvider.js";
import { classifyRouteRisk, type RouteRiskBand } from "./logistics-route-risk-provider.js";

export const CAPABILITY_ID = "logistics.route-risk-outlook";

const WIND_METRIC = "WS2M";

type Range = "short" | "medium" | "long";

/** Same lead-time boundaries as `WindGenerationOutlookProvider` and
 *  every other forecast-based provider in this codebase — reused as
 *  identical values on purpose, no domain reason forecast skill
 *  degrades differently here. */
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

export interface RouteRiskOutlookDayEntry {
  date: string;
  leadDays: number;
  band: RouteRiskBand;
  windMs: number;
}

/**
 * `InterpretationProvider` for Logistics & Shipping's Route Risk
 * Outlook — closing the "no forecast-based outlook yet" gap
 * `LogisticsRouteRiskProvider`'s own doc comment named explicitly when
 * that current-conditions-only provider first shipped
 * (`classifyRouteRisk` was already exported in anticipation of this).
 * Consumes `OpenMeteoConnector`'s wind-speed forecast records
 * (`WS2M`, `recordType: "forecast"`) — the same forecast pipeline
 * already validated by Construction's Site Risk Timeline and
 * Renewable Energy's Wind/Solar outlooks, reused unchanged here.
 * Classifies each forecast day with `LogisticsRouteRiskProvider`'s
 * exact exported band function so the current-status and outlook
 * widgets can never silently disagree about what a given wind speed
 * means.
 *
 * Same lead-time-based confidence gradient as every other forecast
 * provider in this codebase — forecast skill genuinely degrades with
 * lead time, not a stylistic choice.
 *
 * **Honest scope, stated plainly, not silently glossed over — this
 * closes only the one gap it targets:**
 * - **Wind speed only, at a single point** — same limitation
 *   `LogisticsRouteRiskProvider` already carries; no storm-track,
 *   port-status, or flooding forecast data source exists in this
 *   codebase, and there is still no multi-waypoint "route" concept.
 * - **No new gaps introduced beyond those `LogisticsRouteRiskProvider`
 *   already documents.**
 */
export class LogisticsRouteRiskOutlookProvider implements InterpretationProvider {
  readonly id = "logistics-route-risk-outlook-v1";
  readonly supportedCapabilities = [CAPABILITY_ID];

  async interpret(request: InterpretationRequest): Promise<InterpretationResult> {
    if (request.capability !== CAPABILITY_ID) {
      throw new Error(
        `${this.id} does not support capability "${request.capability}" — only ${CAPABILITY_ID}`,
      );
    }

    const forecastRecords = request.records
      .filter((r) => r.metric === WIND_METRIC && r.recordType === "forecast" && r.forecastIssuedAt)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    if (forecastRecords.length === 0) {
      return {
        summary: "No wind speed forecast data is available for this route.",
        confidence: "insufficient-data",
        explanation:
          'This capability requires forecast records (metric "WS2M", recordType: "forecast") and none were provided in the input.',
        contributingFactors: [],
        unableToAnswer: {
          reason: 'No records with metric "WS2M" and recordType "forecast" in the request.',
        },
      };
    }

    const days: RouteRiskOutlookDayEntry[] = forecastRecords.map((r) => {
      const leadMs = new Date(r.timestamp).getTime() - new Date(r.forecastIssuedAt!).getTime();
      const leadDays = Math.max(0, Math.round(leadMs / (1000 * 60 * 60 * 24)));
      const { band } = classifyRouteRisk(r.value);
      return { date: r.timestamp.slice(0, 10), leadDays, band, windMs: r.value };
    });

    const overallRange = rangeFor(Math.max(...days.map((d) => d.leadDays)));
    const confidence = confidenceFor(overallRange);

    const severeDays = days.filter((d) => d.band === "severe").length;
    const highDays = days.filter((d) => d.band === "high").length;
    const clearDays = days.filter((d) => d.band === "clear").length;

    const contributingFactors: ContributingFactor[] = days.map((d, i) => ({
      description: `${d.date}: ${d.windMs.toFixed(1)} m/s forecast, ${d.leadDays} day(s) ahead (${d.band}).`,
      recordIds: [forecastRecords[i]!.id],
      relativeInfluence: i === 0 ? "primary" : "secondary",
    }));

    return {
      summary: this.summaryFor(days.length, severeDays, highDays, clearDays, confidence),
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
    const expectedAnySevere = (groundTruth as { anySevere?: boolean } | undefined)?.anySevere;
    const actual = /severe risk/i.test(result.summary);
    return {
      result,
      matchesGroundTruth: expectedAnySevere !== undefined && expectedAnySevere === actual,
    };
  }

  private summaryFor(
    spanDays: number,
    severeDays: number,
    highDays: number,
    clearDays: number,
    confidence: ConfidenceLevel,
  ): string {
    const qualifier =
      confidence === "low" ? " (treat the far end of this window as indicative only)" : "";
    const parts = [
      severeDays > 0 ? `${severeDays} day(s) at severe risk` : undefined,
      highDays > 0 ? `${highDays} day(s) at high risk` : undefined,
      clearDays > 0 ? `${clearDays} day(s) clear` : undefined,
    ].filter((p): p is string => Boolean(p));
    const breakdown = parts.length > 0 ? parts.join(", ") : "risk staying elevated throughout";
    return `Over the next ${spanDays} day(s): ${breakdown}${qualifier}.`;
  }

  private explanationFor(days: RouteRiskOutlookDayEntry[], overallRange: Range): string {
    const perDay = days.map((d) => `${d.date}: ${d.windMs.toFixed(1)} m/s (${d.band})`).join("; ");
    return `${perDay}. Confidence is set by the furthest-out day (${overallRange}-range) since that's the least reliable part of the window. Thresholds are this project's own reasonable interpretation, not a specific port authority's or regulatory body's official advisory — see LogisticsRouteRiskProvider's doc comment.`;
  }
}
