import type {
  InterpretationProvider,
  InterpretationRequest,
  InterpretationResult,
  ConfidenceLevel,
  ContributingFactor,
} from "../InterpretationProvider.js";

export const CAPABILITY_ID = "weather.forecast-trend";

const METRIC = "T2M";

type Range = "short" | "medium" | "long";

/** Lead-time boundaries, in days, for the PRD's "short/medium/long-range"
 *  gradient. Own reasonable interpretation, not a transcription of a
 *  meteorological standard — flagged rather than presented as
 *  authoritative, same discipline as WeatherStatusProvider's band
 *  thresholds. */
function rangeFor(leadDays: number): Range {
  if (leadDays <= 3) return "short";
  if (leadDays <= 7) return "medium";
  return "long";
}

/**
 * Confidence genuinely decreases with lead time — the actual point of
 * this provider existing separately from `WeatherStatusProvider`. This
 * isn't a stylistic gradient; forecast skill really does degrade with
 * lead time in real meteorology, and asserting otherwise (e.g. treating
 * a 10-day-out prediction with the same confidence as tomorrow's) would
 * be exactly the "silent AI misinterpretation presented as fact" the
 * Engineering Blueprint ranks as this platform's single highest risk.
 */
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

/**
 * `InterpretationProvider` for Weather & Climate's forecast/trend
 * capability (BUILD_PLAN Stage 10, ticket 10.6) — the PRD's own
 * description of a "short/medium/long-range confidence gradient,"
 * which `WeatherStatusProvider` explicitly could not produce (no
 * forecast data existed anywhere in this codebase when that provider
 * was built — see its doc comment). Consumes `OpenMeteoConnector`'s
 * forecast records specifically (`recordType: "forecast"`), the second,
 * genuinely different data provider this project has integrated.
 *
 * Deliberately a separate provider from `WeatherStatusProvider`, not a
 * mode flag on it: the two have fundamentally different confidence
 * models (data-sufficiency-based vs. lead-time-based) and different
 * data sources (NASA POWER observed data vs. Open-Meteo forecast data)
 * — conflating them into one class with branching logic would blur
 * exactly the distinction ADR-0002 exists to keep clear.
 */
export class WeatherForecastProvider implements InterpretationProvider {
  readonly id = "weather-forecast-trend-v1";
  readonly supportedCapabilities = [CAPABILITY_ID];

  async interpret(request: InterpretationRequest): Promise<InterpretationResult> {
    if (request.capability !== CAPABILITY_ID) {
      throw new Error(
        `${this.id} does not support capability "${request.capability}" — only ${CAPABILITY_ID}`,
      );
    }

    const forecastRecords = request.records
      .filter((r) => r.metric === METRIC && r.recordType === "forecast" && r.forecastIssuedAt)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    if (forecastRecords.length === 0) {
      return {
        summary: "No forecast data is available for this location.",
        confidence: "insufficient-data",
        explanation:
          'This capability requires forecast records (recordType: "forecast") and none were provided in the input.',
        contributingFactors: [],
        unableToAnswer: {
          reason: 'No records with metric "T2M" and recordType "forecast" in the request.',
        },
      };
    }

    // Real per-day lead time, computed from each record's own
    // forecastIssuedAt — not assumed uniform, since a mixed batch
    // (e.g. a cached earlier forecast alongside a freshly-issued one)
    // could genuinely have different lead times per record.
    const dayEntries = forecastRecords.map((r) => {
      const leadMs = new Date(r.timestamp).getTime() - new Date(r.forecastIssuedAt!).getTime();
      const leadDays = Math.max(0, Math.round(leadMs / (1000 * 60 * 60 * 24)));
      return { record: r, leadDays, range: rangeFor(leadDays) };
    });

    const overallRange = rangeFor(Math.max(...dayEntries.map((d) => d.leadDays)));
    const confidence = confidenceFor(overallRange);

    const first = dayEntries[0]!.record;
    const last = dayEntries[dayEntries.length - 1]!.record;
    const trendDirection =
      last.value > first.value + 1 ? "rising" : last.value < first.value - 1 ? "falling" : "steady";

    const contributingFactors: ContributingFactor[] = dayEntries.map((d, i) => ({
      description: `${d.record.timestamp.slice(0, 10)}: ${d.record.value.toFixed(1)}°C forecast, ${d.leadDays} day(s) ahead (${d.range}-range).`,
      recordIds: [d.record.id],
      relativeInfluence: i === 0 ? "primary" : "secondary",
    }));

    return {
      summary: this.summaryFor(dayEntries, trendDirection, confidence),
      confidence,
      explanation: this.explanationFor(dayEntries, overallRange),
      contributingFactors,
    };
  }

  async evaluate(
    request: InterpretationRequest,
    groundTruth: unknown,
  ): Promise<{ result: InterpretationResult; matchesGroundTruth: boolean }> {
    const result = await this.interpret(request);
    const expectedTrend = (groundTruth as { trend?: string } | undefined)?.trend;
    const matchesGroundTruth =
      expectedTrend !== undefined && result.summary.toLowerCase().includes(expectedTrend);
    return { result, matchesGroundTruth };
  }

  private summaryFor(
    dayEntries: { record: { value: number }; leadDays: number }[],
    trend: "rising" | "falling" | "steady",
    confidence: ConfidenceLevel,
  ): string {
    const spanDays = dayEntries[dayEntries.length - 1]!.leadDays;
    const qualifier =
      confidence === "low" ? " — treat the far end of this range as indicative only" : "";
    return `Temperatures are forecast to stay ${trend} over the next ${spanDays} day(s)${qualifier}.`;
  }

  private explanationFor(
    dayEntries: { leadDays: number; range: Range }[],
    overallRange: Range,
  ): string {
    const rangeCounts = dayEntries.reduce(
      (acc, d) => ({ ...acc, [d.range]: (acc[d.range] ?? 0) + 1 }),
      {} as Record<Range, number>,
    );
    const breakdown = (["short", "medium", "long"] as Range[])
      .filter((r) => rangeCounts[r])
      .map((r) => `${rangeCounts[r]} day(s) ${r}-range`)
      .join(", ");
    return `This forecast spans ${breakdown}. Confidence is set by the furthest-out day (${overallRange}-range) since that's the least reliable part of the whole window — forecast accuracy genuinely decreases with lead time, not a stylistic choice.`;
  }
}
