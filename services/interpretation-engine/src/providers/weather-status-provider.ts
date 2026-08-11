import type {
  InterpretationProvider,
  InterpretationRequest,
  InterpretationResult,
  ConfidenceLevel,
  ContributingFactor,
} from "../InterpretationProvider.js";

/**
 * POWER's "Temperature at 2 Meters" parameter, in °C — see
 * docs/data-provenance/nasa-power.md. Same connector as
 * `SoilMoistureStatusProvider` (`NasaPowerConnector`), different
 * parameter code — no data-ingestion changes were needed to support
 * this, which is the real validation ADR-0003's Standing Action Item
 * asked for ("a second, deliberately different provider" was the
 * original plan; a second, deliberately different *parameter* through
 * the same provider is a smaller but still real test of whether the
 * ingestion/interpretation boundary actually holds).
 */
const TEMPERATURE_METRIC = "T2M";

export const CAPABILITY_ID = "weather.temperature-status";

type TemperatureBand = "cold" | "cool" | "mild" | "warm" | "hot";

/**
 * Threshold bands in °C. Like `SoilMoistureStatusProvider`'s bands,
 * these are this implementation's own reasonable interpretation, not a
 * transcription of a meteorological standard — flagged rather than
 * presented as authoritative. Deliberately broad, general-purpose bands
 * (not crop- or activity-specific), matching the PRD's description of
 * Weather & Climate as "the general-purpose environmental intelligence
 * workspace," not a vertical with domain-specific stakes.
 */
const BANDS: { max: number; band: TemperatureBand; label: string }[] = [
  { max: 5, band: "cold", label: "cold" },
  { max: 15, band: "cool", label: "cool" },
  { max: 25, band: "mild", label: "mild" },
  { max: 32, band: "warm", label: "warm" },
  { max: Infinity, band: "hot", label: "hot" },
];

function bandFor(value: number): { band: TemperatureBand; label: string } {
  const found = BANDS.find((b) => value <= b.max);
  return found ?? BANDS[BANDS.length - 1]!;
}

/**
 * `InterpretationProvider` for Weather & Climate's current-conditions
 * status (BUILD_PLAN Stage 10, the second workspace beyond Agriculture —
 * un-deferred from BUILD_PLAN's own deferred list at the owner's
 * explicit request; see BUILD_PLAN changelog for that history).
 *
 * **Honest scope, stated plainly rather than implied away:** the PRD's
 * Weather & Climate mission describes "a clear current-conditions-
 * plus-trend view with an honest short/medium/long-range confidence
 * gradient." This provider delivers the *current-conditions* half only.
 * There is no forecast data source wired in anywhere in this codebase —
 * NASA POWER's Daily API returns historical/recent observational data,
 * not a future forecast — so a "short/medium/long-range" gradient isn't
 * something this provider can honestly produce yet. Building a forecast
 * feature under a name that implies it exists would be exactly the kind
 * of fabrication ADR-0003 and the Constitution's AI Principles
 * prohibit. This is recorded as real, open follow-up work, not silently
 * scoped out of the ticket.
 *
 * Structurally identical to `SoilMoistureStatusProvider` on purpose —
 * same threshold-based, non-ML, auditable approach, same confidence-
 * from-data-sufficiency reasoning. Two workspaces now share the same
 * interpretation *pattern* without sharing code that shouldn't be
 * shared (each provider's bands/domain logic stay separate, per
 * Engineering Blueprint 4.5 — promote to a shared package only once a
 * genuine third consumer reveals what's actually common).
 */
export class WeatherStatusProvider implements InterpretationProvider {
  readonly id = "weather-temperature-status-v1";
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

    if (tempRecords.length === 0) {
      return {
        summary: `No ${TEMPERATURE_METRIC} (temperature at 2 meters) data is available for this location and time range.`,
        confidence: "insufficient-data",
        explanation:
          "This capability requires at least one temperature reading and none was provided in the input records.",
        contributingFactors: [],
        unableToAnswer: {
          reason: `No records with metric "${TEMPERATURE_METRIC}" in the request.`,
        },
      };
    }

    const latest = tempRecords[tempRecords.length - 1]!;
    const { band, label } = bandFor(latest.value);
    const confidence: ConfidenceLevel = this.confidenceFor(tempRecords.length);

    const contributingFactors: ContributingFactor[] = [
      {
        description: `Most recent temperature reading (${latest.value.toFixed(1)}°C) from ${latest.timestamp.slice(0, 10)}.`,
        recordIds: [latest.id],
        relativeInfluence: "primary",
      },
    ];

    if (tempRecords.length > 1) {
      contributingFactors.push({
        description: `${tempRecords.length} total readings in the requested range provide context for how stable this level is.`,
        recordIds: tempRecords.map((r) => r.id),
        relativeInfluence: "secondary",
      });
    }

    return {
      summary: this.summaryFor(band, label, latest.value, confidence),
      confidence,
      explanation: this.explanationFor(band, tempRecords.length),
      contributingFactors,
    };
  }

  async evaluate(
    request: InterpretationRequest,
    groundTruth: unknown,
  ): Promise<{ result: InterpretationResult; matchesGroundTruth: boolean }> {
    const result = await this.interpret(request);
    const expectedBand = (groundTruth as { band?: TemperatureBand } | undefined)?.band;
    const actualBand = this.bandFromSummary(result);
    return {
      result,
      matchesGroundTruth: expectedBand !== undefined && expectedBand === actualBand,
    };
  }

  private confidenceFor(readingCount: number): ConfidenceLevel {
    if (readingCount >= 5) return "high";
    if (readingCount >= 2) return "moderate";
    return "low";
  }

  private summaryFor(
    band: TemperatureBand,
    label: string,
    value: number,
    confidence: ConfidenceLevel,
  ): string {
    const qualifier = confidence === "low" ? " (based on limited recent data)" : "";
    return `Current temperature is ${label} at ${value.toFixed(1)}°C${qualifier}.`;
  }

  private explanationFor(band: TemperatureBand, readingCount: number): string {
    const basis =
      readingCount === 1
        ? "a single recent reading"
        : `${readingCount} recent readings, using the most recent as the current status`;
    return `Temperature at 2 meters (NASA POWER's T2M) was classified into the "${band}" band based on ${basis}. This reflects current conditions only — no forecast/trend gradient is produced by this provider yet (see class doc comment for why).`;
  }

  private bandFromSummary(result: InterpretationResult): TemperatureBand | undefined {
    if (result.unableToAnswer) return undefined;
    for (const b of BANDS) {
      if (result.summary.includes(`${b.label} at`)) return b.band;
    }
    return undefined;
  }
}
