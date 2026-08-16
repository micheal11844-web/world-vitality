import type {
  InterpretationProvider,
  InterpretationRequest,
  InterpretationResult,
  ConfidenceLevel,
  ContributingFactor,
} from "../InterpretationProvider.js";
import { classifyWindSpeed, type GenerationBand } from "./wind-generation-status-provider.js";

export const CAPABILITY_ID = "renewable-energy.wind-generation-outlook";

const WIND_METRIC = "WS2M";

type Range = "short" | "medium" | "long";

/** Same lead-time boundaries as `WeatherForecastProvider` and
 *  `ConstructionSiteRiskTimelineProvider` — reused as identical values
 *  on purpose, no domain reason forecast skill degrades differently
 *  here. */
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

export interface OutlookDayEntry {
  date: string;
  leadDays: number;
  band: GenerationBand;
  windMs: number;
}

/**
 * `InterpretationProvider` for Renewable Energy's **Asset Generation
 * Outlook** — the PRD's own named first-run experience widget ("shows
 * an Asset Generation Outlook — near-term forecast of expected
 * generation conditions"). Consumes `OpenMeteoConnector`'s wind-speed
 * forecast records (`WS2M`, `recordType: "forecast"`) — the same
 * forecast pipeline Construction's Site Risk Timeline validated,
 * reused unchanged here. Classifies each forecast day with
 * `WindGenerationStatusProvider`'s exact exported band function so the
 * two can never silently disagree about what a given wind speed means.
 *
 * Same lead-time-based confidence gradient as
 * `WeatherForecastProvider` and `ConstructionSiteRiskTimelineProvider`
 * — forecast skill genuinely degrades with lead time, not a stylistic
 * choice.
 *
 * **Honest scope:** wind only, generic turbine envelope — see
 * `WindGenerationStatusProvider`'s doc comment for the full list of
 * gaps (no solar/hydro, no anomaly detection against real output, no
 * asset-specific power curve). This provider adds no new gaps beyond
 * those.
 */
export class WindGenerationOutlookProvider implements InterpretationProvider {
  readonly id = "wind-generation-outlook-v1";
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
        summary: "No wind speed forecast data is available for this asset location.",
        confidence: "insufficient-data",
        explanation:
          'This capability requires forecast records (metric "WS2M", recordType: "forecast") and none were provided in the input.',
        contributingFactors: [],
        unableToAnswer: {
          reason: 'No records with metric "WS2M" and recordType "forecast" in the request.',
        },
      };
    }

    const days: OutlookDayEntry[] = forecastRecords.map((r) => {
      const leadMs = new Date(r.timestamp).getTime() - new Date(r.forecastIssuedAt!).getTime();
      const leadDays = Math.max(0, Math.round(leadMs / (1000 * 60 * 60 * 24)));
      const { band } = classifyWindSpeed(r.value);
      return { date: r.timestamp.slice(0, 10), leadDays, band, windMs: r.value };
    });

    const overallRange = rangeFor(Math.max(...days.map((d) => d.leadDays)));
    const confidence = confidenceFor(overallRange);

    const ratedDays = days.filter((d) => d.band === "rated-output").length;
    const cutOutDays = days.filter((d) => d.band === "cut-out").length;
    const belowCutInDays = days.filter((d) => d.band === "below-cut-in").length;

    const contributingFactors: ContributingFactor[] = days.map((d, i) => ({
      description: `${d.date}: ${d.windMs.toFixed(1)} m/s forecast, ${d.leadDays} day(s) ahead (${d.band}).`,
      recordIds: [forecastRecords[i]!.id],
      relativeInfluence: i === 0 ? "primary" : "secondary",
    }));

    return {
      summary: this.summaryFor(days.length, ratedDays, cutOutDays, belowCutInDays, confidence),
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
    const expectedAnyCutOut = (groundTruth as { anyCutOut?: boolean } | undefined)?.anyCutOut;
    const actual = /cut-out/.test(result.summary);
    return {
      result,
      matchesGroundTruth: expectedAnyCutOut !== undefined && expectedAnyCutOut === actual,
    };
  }

  private summaryFor(
    spanDays: number,
    ratedDays: number,
    cutOutDays: number,
    belowCutInDays: number,
    confidence: ConfidenceLevel,
  ): string {
    const qualifier =
      confidence === "low" ? " (treat the far end of this window as indicative only)" : "";
    const parts = [
      ratedDays > 0 ? `${ratedDays} day(s) at rated output` : undefined,
      cutOutDays > 0 ? `${cutOutDays} day(s) at cut-out (safety shutdown)` : undefined,
      belowCutInDays > 0 ? `${belowCutInDays} day(s) below cut-in (no generation)` : undefined,
    ].filter((p): p is string => Boolean(p));
    const breakdown = parts.length > 0 ? parts.join(", ") : "generation ramping throughout";
    return `Over the next ${spanDays} day(s): ${breakdown}${qualifier}.`;
  }

  private explanationFor(days: OutlookDayEntry[], overallRange: Range): string {
    const perDay = days.map((d) => `${d.date}: ${d.windMs.toFixed(1)} m/s (${d.band})`).join("; ");
    return `${perDay}. Confidence is set by the furthest-out day (${overallRange}-range) since that's the least reliable part of the window. Bands are a generic turbine envelope, not asset-specific — see WindGenerationStatusProvider's doc comment.`;
  }
}
