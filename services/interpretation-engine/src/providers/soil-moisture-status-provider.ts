import type {
  InterpretationProvider,
  InterpretationRequest,
  InterpretationResult,
  ConfidenceLevel,
  ContributingFactor,
} from "../InterpretationProvider.js";

/**
 * POWER's root-zone soil wetness parameter (0 = dry, 1 = saturated) —
 * see docs/data-provenance/nasa-power.md. This provider only interprets
 * this one metric; it does not itself fetch data (that's
 * `NasaPowerConnector`'s job, per ADR-0002's separation).
 */
const SOIL_MOISTURE_METRIC = "GWETROOT";

export const CAPABILITY_ID = "agriculture.soil-moisture-status";

type MoistureBand = "very-dry" | "dry" | "moderate" | "moist" | "saturated";

/**
 * Threshold bands over GWETROOT's documented 0 (dry) – 1 (saturated)
 * range. These specific cut points are this implementation's own
 * reasonable interpretation — no source doc specifies exact agricultural
 * thresholds for this parameter — and should be reviewed against real
 * agronomic guidance (e.g. crop-specific wilting point / field capacity
 * data) before this is trusted for real farming decisions. Flagged here
 * rather than presented as authoritative.
 */
const BANDS: { max: number; band: MoistureBand; label: string }[] = [
  { max: 0.2, band: "very-dry", label: "very dry" },
  { max: 0.4, band: "dry", label: "dry" },
  { max: 0.6, band: "moderate", label: "moderate moisture" },
  { max: 0.8, band: "moist", label: "moist" },
  { max: Infinity, band: "saturated", label: "saturated" },
];

function bandFor(value: number): { band: MoistureBand; label: string } {
  const found = BANDS.find((b) => value <= b.max);
  return found ?? BANDS[BANDS.length - 1]!;
}

/**
 * `InterpretationProvider` for agriculture soil-moisture status
 * (BUILD_PLAN Stage 4, ticket 4.1) — the first narrow capability built
 * against the Stage 1 AI interface.
 *
 * Deliberately not a machine-learning model: a transparent, threshold-
 * based interpretation over a single well-documented parameter. ADR-0003
 * requires a traceable explanation and honest confidence signal from any
 * interpretation provider — it does not require the provider to be an ML
 * model. Starting here keeps the first capability auditable end-to-end
 * before adding model complexity; a future ML-based provider can
 * implement the same interface (`InterpretationProvider`) without
 * changing any caller, exactly as ADR-0003's abstraction is meant to
 * allow.
 *
 * Confidence reflects *data sufficiency*, not the model's own certainty
 * about the world (there is no model) — this provider does not know how
 * volatile soil moisture actually is at a given location, only how much
 * recent data it has to summarize. Constitution Section 9, Principle 1:
 * never claim more certainty than the underlying basis supports.
 */
export class SoilMoistureStatusProvider implements InterpretationProvider {
  readonly id = "soil-moisture-status-v1";
  readonly supportedCapabilities = [CAPABILITY_ID];

  async interpret(request: InterpretationRequest): Promise<InterpretationResult> {
    if (request.capability !== CAPABILITY_ID) {
      throw new Error(
        `${this.id} does not support capability "${request.capability}" — only ${CAPABILITY_ID}`,
      );
    }

    const moistureRecords = request.records
      .filter((r) => r.metric === SOIL_MOISTURE_METRIC)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    if (moistureRecords.length === 0) {
      return {
        summary: `No ${SOIL_MOISTURE_METRIC} (root-zone soil wetness) data is available for this location and time range.`,
        confidence: "insufficient-data",
        explanation:
          "This capability requires at least one root-zone soil wetness reading and none was provided in the input records.",
        contributingFactors: [],
        unableToAnswer: {
          reason: `No records with metric "${SOIL_MOISTURE_METRIC}" in the request.`,
        },
      };
    }

    const latest = moistureRecords[moistureRecords.length - 1]!;
    const { band, label } = bandFor(latest.value);

    const confidence: ConfidenceLevel = this.confidenceFor(moistureRecords.length);

    const contributingFactors: ContributingFactor[] = [
      {
        description: `Most recent root-zone soil wetness reading (${latest.value.toFixed(2)} on a 0–1 scale) from ${latest.timestamp.slice(0, 10)}.`,
        recordIds: [latest.id],
        relativeInfluence: "primary",
      },
    ];

    if (moistureRecords.length > 1) {
      contributingFactors.push({
        description: `${moistureRecords.length} total readings in the requested range provide context for how stable this level is.`,
        recordIds: moistureRecords.map((r) => r.id),
        relativeInfluence: "secondary",
      });
    }

    return {
      summary: this.summaryFor(band, label, latest.value, confidence),
      confidence,
      explanation: this.explanationFor(band, moistureRecords.length),
      contributingFactors,
    };
  }

  async evaluate(
    request: InterpretationRequest,
    groundTruth: unknown,
  ): Promise<{ result: InterpretationResult; matchesGroundTruth: boolean }> {
    const result = await this.interpret(request);
    const expectedBand = (groundTruth as { band?: MoistureBand } | undefined)?.band;
    const actualBand = this.bandFromSummary(result);
    return {
      result,
      matchesGroundTruth: expectedBand !== undefined && expectedBand === actualBand,
    };
  }

  /** More readings in range → more confidence the latest value reflects
   *  a real, non-noisy state rather than a single volatile data point. */
  private confidenceFor(readingCount: number): ConfidenceLevel {
    if (readingCount >= 5) return "high";
    if (readingCount >= 2) return "moderate";
    return "low";
  }

  private summaryFor(
    band: MoistureBand,
    label: string,
    value: number,
    confidence: ConfidenceLevel,
  ): string {
    const qualifier = confidence === "low" ? " (based on limited recent data)" : "";
    if (band === "very-dry" || band === "dry") {
      return `Soil moisture is currently ${label} (${value.toFixed(2)} of 1.0)${qualifier} — conditions may warrant irrigation attention.`;
    }
    if (band === "saturated") {
      return `Soil is currently saturated (${value.toFixed(2)} of 1.0)${qualifier} — waterlogging risk in low-lying areas.`;
    }
    return `Soil moisture is currently at ${label} levels (${value.toFixed(2)} of 1.0)${qualifier}.`;
  }

  private explanationFor(band: MoistureBand, readingCount: number): string {
    const basis =
      readingCount === 1
        ? "a single recent reading"
        : `${readingCount} recent readings, using the most recent as the current status`;
    return `Root-zone soil wetness (NASA POWER's GWETROOT, 0=dry to 1=saturated) was classified into the "${band}" band based on ${basis}. Band thresholds are this system's own interpretation, not a cited agronomic standard — see the provider's source documentation.`;
  }

  private bandFromSummary(result: InterpretationResult): MoistureBand | undefined {
    if (result.unableToAnswer) return undefined;
    for (const b of BANDS) {
      if (result.summary.includes(b.label)) return b.band;
    }
    return undefined;
  }
}
