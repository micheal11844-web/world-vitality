import type { NormalizedDataRecord, IngestionGap, Provenance } from "@world-vitality/data-schemas";
import type {
  DataIngestionConnector,
  IngestionResult,
  IngestionTrigger,
} from "../DataIngestionConnector.js";

const POWER_API_BASE = "https://power.larc.nasa.gov/api/temporal/daily/point";

/**
 * A point location this connector should ingest data for.
 */
export interface NasaPowerLocation {
  /** Identifier used in generated record IDs — keep stable across runs. */
  id: string;
  latitude: number;
  longitude: number;
}

export interface NasaPowerConnectorConfig {
  /** Locations to fetch data for on each ingestion run. */
  locations: NasaPowerLocation[];

  /**
   * POWER parameter codes to request (e.g. "T2M", "RH2M", "PRECTOTCORR").
   * See https://power.larc.nasa.gov/parameters/ for the full dictionary.
   * Max 20 per request, per the POWER API's own limit.
   */
  parameters: string[];

  /**
   * POWER "community" — determines which parameter set/processing is
   * used. "AG" (Agroclimatology) is the default, matching BUILD_PLAN
   * Stage 4's recommended first capability (soil-moisture status).
   */
  community?: "AG" | "RE" | "SB";

  /** How many days back from today to request on each run. */
  lookbackDays?: number;
}

interface PowerApiResponse {
  properties: {
    parameter: Record<string, Record<string, number>>;
  };
  header?: {
    fill_value?: number;
  };
  parameters?: Record<string, { units?: string; longname?: string }>;
  messages?: string[];
}

function formatDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

/** Convert POWER's "YYYYMMDD" date key into an ISO-8601 datetime string. */
function toIsoDate(yyyymmdd: string): string {
  const y = yyyymmdd.slice(0, 4);
  const m = yyyymmdd.slice(4, 6);
  const d = yyyymmdd.slice(6, 8);
  return new Date(`${y}-${m}-${d}T00:00:00Z`).toISOString();
}

/**
 * Pure normalization logic, factored out of the connector class so it's
 * independently testable without a live network call — see
 * `__tests__/nasa-power-connector.test.ts`, which exercises this against
 * a realistic captured POWER API response shape.
 *
 * Handles the one piece of real domain logic in this connector: POWER
 * represents missing/unavailable data with a numeric sentinel fill value
 * (default -999) rather than omitting the key. Treating that sentinel as
 * a real measurement would violate ADR-0003's "never fabricate"
 * requirement just as surely as inventing a value ourselves — so it
 * becomes an explicit `IngestionGap` instead.
 */
export function parsePowerResponse(
  connectorId: string,
  connectorDisplayName: string,
  location: NasaPowerLocation,
  response: PowerApiResponse,
): { records: NormalizedDataRecord[]; gaps: IngestionGap[] } {
  const records: NormalizedDataRecord[] = [];
  const gaps: IngestionGap[] = [];
  const fillValue = response.header?.fill_value ?? -999;
  const retrievedAt = new Date().toISOString();

  for (const [metric, byDate] of Object.entries(response.properties.parameter)) {
    const unit = response.parameters?.[metric]?.units ?? "unknown";

    for (const [dateKey, value] of Object.entries(byDate)) {
      if (value === fillValue || value <= -900) {
        gaps.push({
          description: `No "${metric}" value available for ${location.id} on ${dateKey}`,
          reason: "field-missing-at-source",
          occurredAt: retrievedAt,
          transient: false,
        });
        continue;
      }

      const provenance: Provenance = {
        source: connectorId,
        sourceName: connectorDisplayName,
        license: "CC-BY-4.0",
        attributionUrl: "https://power.larc.nasa.gov/docs/referencing/",
        retrievedAt,
        observedAt: toIsoDate(dateKey),
        knownLimitations: [
          "0.5° x 0.5° grid resolution — point values represent the surrounding grid cell, not an exact coordinate.",
          "Derived from reanalysis/satellite models (MERRA-2, CERES), not direct in-situ ground sensors.",
        ],
      };

      records.push({
        id: `${connectorId}:${location.id}:${metric}:${dateKey}`,
        metric,
        value,
        unit,
        location: { latitude: location.latitude, longitude: location.longitude },
        timestamp: toIsoDate(dateKey),
        provenance,
      });
    }
  }

  return { records, gaps };
}

/**
 * The first concrete ingestion connector (BUILD_PLAN Stage 2, ticket 2.1),
 * built against the `DataIngestionConnector` interface defined in Stage 1.
 *
 * Pulls daily point data from NASA's POWER (Prediction Of Worldwide Energy
 * Resources) API — chosen because it's free, requires no API key, and its
 * Agroclimatology ("AG") community directly supports BUILD_PLAN Stage 4's
 * recommended first interpretation capability (agriculture soil-moisture
 * status). See `docs/data-provenance/nasa-power.md` for licensing and
 * attribution (BUILD_PLAN ticket 2.2).
 *
 * Deliberately narrow at this stage: one API, one community, no retry/
 * backoff strategy beyond a single request per location. Expand once a
 * second, deliberately different connector reveals what's actually
 * shared vs. connector-specific (ADR-0003 Standing Action Item).
 */
export class NasaPowerConnector implements DataIngestionConnector {
  readonly id = "nasa-power";
  readonly displayName = "NASA POWER (Prediction Of Worldwide Energy Resources)";

  private readonly config: Required<NasaPowerConnectorConfig>;

  constructor(config: NasaPowerConnectorConfig) {
    this.config = {
      community: "AG",
      lookbackDays: 7,
      ...config,
    };
  }

  async ingest(trigger: IngestionTrigger): Promise<IngestionResult> {
    const records: NormalizedDataRecord[] = [];
    const gaps: IngestionGap[] = [];

    const end = new Date();
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - this.config.lookbackDays);

    for (const location of this.config.locations) {
      try {
        const response = await this.fetchLocation(location, start, end);
        const { records: locationRecords, gaps: locationGaps } = parsePowerResponse(
          this.id,
          this.displayName,
          location,
          response,
        );
        records.push(...locationRecords);
        gaps.push(...locationGaps);
      } catch (err) {
        // Network failure, non-2xx response, or malformed JSON — an
        // expected failure mode (Engineering Blueprint Section 11), not
        // a programming error. Report as a gap rather than throwing, per
        // the interface contract.
        gaps.push({
          description: `Failed to retrieve POWER data for location "${location.id}"`,
          reason: err instanceof TypeError ? "provider-unavailable" : "malformed-response",
          detail: err instanceof Error ? err.message : String(err),
          occurredAt: new Date().toISOString(),
          transient: true,
        });
      }
    }

    void trigger; // available for logging; not branched on at this stage

    return { records, gaps };
  }

  async checkHealth(): Promise<{ healthy: boolean; detail?: string }> {
    try {
      const probeLocation = this.config.locations[0];
      if (!probeLocation) {
        return { healthy: false, detail: "No locations configured to probe." };
      }
      const today = new Date();
      await this.fetchLocation(probeLocation, today, today);
      return { healthy: true };
    } catch (err) {
      return {
        healthy: false,
        detail: err instanceof Error ? err.message : String(err),
      };
    }
  }

  private async fetchLocation(
    location: NasaPowerLocation,
    start: Date,
    end: Date,
  ): Promise<PowerApiResponse> {
    const url = new URL(POWER_API_BASE);
    url.searchParams.set("parameters", this.config.parameters.join(","));
    url.searchParams.set("community", this.config.community);
    url.searchParams.set("longitude", String(location.longitude));
    url.searchParams.set("latitude", String(location.latitude));
    url.searchParams.set("format", "JSON");
    url.searchParams.set("start", formatDate(start));
    url.searchParams.set("end", formatDate(end));

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`POWER API returned ${res.status} ${res.statusText}`);
    }
    const body = (await res.json()) as PowerApiResponse;
    if (!body?.properties?.parameter) {
      throw new Error("POWER API response missing expected properties.parameter shape");
    }
    return body;
  }
}
