import type {
  InterpretationProvider,
  InterpretationRequest,
  InterpretationResult,
  ConfidenceLevel,
  ContributingFactor,
} from "../InterpretationProvider.js";
import { classifySolarIrradiance, type IrradianceBand } from "./solar-irradiance-status-provider.js";

export const CAPABILITY_ID = "renewable-energy.solar-irradiance-outlook";

const SOLAR_METRIC = "ALLSKY_SFC_SW_DWN";

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

export interface SolarOutlookDayEntry {
  date: string;
  leadDays: number;
  band: IrradianceBand;
  kwhPerM2PerDay: number;
}

/**
 * `InterpretationProvider` for Renewable Energy's solar forecast
 * outlook — the solar counterpart to `WindGenerationOutlookProvider`,
 * closing the "no solar forecast/outlook widget" gap flagged when
 * `SolarIrradianceStatusProvider` (current-conditions only) first
 * shipped. Consumes `OpenMeteoConnector`'s solar-irradiance forecast
 * records (`ALLSKY_SFC_SW_DWN`, `recordType: "forecast"`, added
 * alongside this provider — see the connector's own doc comment for
 * the MJ/m²→kWh/m²/day conversion). Classifies each forecast day with
 * `SolarIrradianceStatusProvider`'s exact exported band function so the
 * two can never silently disagree about what a given irradiance value
 * means — same reuse discipline `WindGenerationOutlookProvider` already
 * established for wind.
 *
 * Same lead-time-based confidence gradient as every other forecast
 * provider in this codebase — forecast skill genuinely degrades with
 * lead time, not a stylistic choice.
 *
 * **Honest scope:** irradiance level only, not generation output or
 * capacity factor — see `SolarIrradianceStatusProvider`'s doc comment
 * for the full list of gaps (no hydro, no anomaly detection against
 * real output, generic not asset-specific bands). This provider adds
 * no new gaps beyond those.
 */
export class SolarIrradianceOutlookProvider implements InterpretationProvider {
  readonly id = "solar-irradiance-outlook-v1";
  readonly supportedCapabilities = [CAPABILITY_ID];

  async interpret(request: InterpretationRequest): Promise<InterpretationResult> {
    if (request.capability !== CAPABILITY_ID) {
      throw new Error(
        `${this.id} does not support capability "${request.capability}" — only ${CAPABILITY_ID}`,
      );
    }

    const forecastRecords = request.records
      .filter(
        (r) => r.metric === SOLAR_METRIC && r.recordType === "forecast" && r.forecastIssuedAt,
      )
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    if (forecastRecords.length === 0) {
      return {
        summary: "No solar irradiance forecast data is available for this asset location.",
        confidence: "insufficient-data",
        explanation:
          'This capability requires forecast records (metric "ALLSKY_SFC_SW_DWN", recordType: "forecast") and none were provided in the input.',
        contributingFactors: [],
        unableToAnswer: {
          reason:
            'No records with metric "ALLSKY_SFC_SW_DWN" and recordType "forecast" in the request.',
        },
      };
    }

    const days: SolarOutlookDayEntry[] = forecastRecords.map((r) => {
      const leadMs = new Date(r.timestamp).getTime() - new Date(r.forecastIssuedAt!).getTime();
      const leadDays = Math.max(0, Math.round(leadMs / (1000 * 60 * 60 * 24)));
      const { band } = classifySolarIrradiance(r.value);
      return { date: r.timestamp.slice(0, 10), leadDays, band, kwhPerM2PerDay: r.value };
    });

    const overallRange = rangeFor(Math.max(...days.map((d) => d.leadDays)));
    const confidence = confidenceFor(overallRange);

    const highDays = days.filter((d) => d.band === "high").length;
    const minimalDays = days.filter((d) => d.band === "minimal").length;

    const contributingFactors: ContributingFactor[] = days.map((d, i) => ({
      description: `${d.date}: ${d.kwhPerM2PerDay.toFixed(1)} kWh/m²/day forecast, ${d.leadDays} day(s) ahead (${d.band}).`,
      recordIds: [forecastRecords[i]!.id],
      relativeInfluence: i === 0 ? "primary" : "secondary",
    }));

    return {
      summary: this.summaryFor(days.length, highDays, minimalDays, confidence),
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
    const expectedAnyHigh = (groundTruth as { anyHigh?: boolean } | undefined)?.anyHigh;
    const actual = /high irradiance/i.test(result.summary);
    return {
      result,
      matchesGroundTruth: expectedAnyHigh !== undefined && expectedAnyHigh === actual,
    };
  }

  private summaryFor(
    spanDays: number,
    highDays: number,
    minimalDays: number,
    confidence: ConfidenceLevel,
  ): string {
    const qualifier =
      confidence === "low" ? " (treat the far end of this window as indicative only)" : "";
    const parts = [
      highDays > 0 ? `${highDays} day(s) with high irradiance` : undefined,
      minimalDays > 0 ? `${minimalDays} day(s) with minimal irradiance` : undefined,
    ].filter((p): p is string => Boolean(p));
    const breakdown = parts.length > 0 ? parts.join(", ") : "irradiance staying moderate throughout";
    return `Over the next ${spanDays} day(s): ${breakdown}${qualifier}.`;
  }

  private explanationFor(days: SolarOutlookDayEntry[], overallRange: Range): string {
    const perDay = days
      .map((d) => `${d.date}: ${d.kwhPerM2PerDay.toFixed(1)} kWh/m²/day (${d.band})`)
      .join("; ");
    return `${perDay}. Confidence is set by the furthest-out day (${overallRange}-range) since that's the least reliable part of the window. Bands are this project's own generic interpretation, not a cited standard — see SolarIrradianceStatusProvider's doc comment.`;
  }
}
