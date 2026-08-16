import type { NormalizedDataRecord, IngestionGap, Provenance } from "@world-vitality/data-schemas";
import type {
  DataIngestionConnector,
  IngestionResult,
  IngestionTrigger,
} from "../DataIngestionConnector.js";

const FORECAST_API_BASE = "https://api.open-meteo.com/v1/forecast";
const METRIC = "T2M";
/** Same metric code NASA POWER uses for wind speed at 2 meters, so any
 *  consumer (e.g. `ConstructionRiskStatusProvider`) can treat wind
 *  records the same way regardless of which connector produced them —
 *  requested explicitly in m/s (`wind_speed_unit=ms`) below, since
 *  Open-Meteo's own default is km/h, which would silently mismatch
 *  NASA POWER's WS2M unit otherwise. */
const WIND_METRIC = "WS2M";

export interface OpenMeteoLocation {
  id: string;
  latitude: number;
  longitude: number;
}

export interface OpenMeteoConnectorConfig {
  locations: OpenMeteoLocation[];
  /** How many days ahead to request, per location. Open-Meteo supports
   *  up to 16; kept far lower by default since the PRD's own gradient
   *  concept ("short/medium/long-range") only needs about a week to be
   *  meaningfully demonstrated, and every extra day is an extra request
   *  weight against the free tier's daily/hourly/minute call limits. */
  forecastDays?: number;
}

interface OpenMeteoApiResponse {
  daily?: {
    time: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    /** Daily maximum wind speed, m/s (see `WIND_METRIC` above for why
     *  the unit is requested explicitly). Optional in the type since
     *  older/other callers of this parser (existing tests) don't
     *  include it — additive, not a breaking change. */
    wind_speed_10m_max?: number[];
  };
  daily_units?: Record<string, string>;
  error?: boolean;
  reason?: string;
}

/**
 * Pure normalization logic, factored out for independent testability —
 * same structure as `parsePowerResponse`. Open-Meteo's daily endpoint
 * gives min/max, not a single representative value; this averages them
 * (a standard, honest meteorological convention for "the day's
 * temperature"), rather than picking one arbitrarily or inventing a
 * fake hourly-resolution value the API didn't actually provide.
 */
export function parseOpenMeteoResponse(
  connectorId: string,
  connectorDisplayName: string,
  location: OpenMeteoLocation,
  response: OpenMeteoApiResponse,
): { records: NormalizedDataRecord[]; gaps: IngestionGap[] } {
  const records: NormalizedDataRecord[] = [];
  const gaps: IngestionGap[] = [];
  const retrievedAt = new Date().toISOString();

  if (response.error || !response.daily) {
    gaps.push({
      description: `Open-Meteo returned no forecast data for location "${location.id}"${
        response.reason ? `: ${response.reason}` : ""
      }`,
      reason: "field-missing-at-source",
      occurredAt: retrievedAt,
      transient: false,
    });
    return { records, gaps };
  }

  const {
    time,
    temperature_2m_max: highs,
    temperature_2m_min: lows,
    wind_speed_10m_max: winds,
  } = response.daily;
  const unit = response.daily_units?.temperature_2m_max ?? "°C";
  const windUnit = response.daily_units?.wind_speed_10m_max ?? "m/s";

  const knownLimitations = [
    "Free-tier, non-commercial-use license (Open-Meteo Terms of Use) — revisit before any commercial launch; see docs/data-provenance/open-meteo.md.",
    "Model-predicted, not observed — accuracy decreases with lead time (see forecastIssuedAt on this record).",
  ];

  const provenanceFor = (extra: string): Provenance => ({
    source: connectorId,
    sourceName: connectorDisplayName,
    license: "CC-BY-4.0",
    attributionUrl: "https://open-meteo.com/en/docs",
    retrievedAt,
    knownLimitations: [...knownLimitations, extra],
  });

  time.forEach((dateStr, i) => {
    const high = highs?.[i];
    const low = lows?.[i];
    const timestamp = new Date(`${dateStr}T12:00:00Z`).toISOString();

    if (high === undefined || low === undefined) {
      gaps.push({
        description: `Missing high/low temperature for "${location.id}" on ${dateStr}`,
        reason: "field-missing-at-source",
        occurredAt: retrievedAt,
        transient: false,
      });
    } else {
      records.push({
        id: `${connectorId}:${location.id}:${METRIC}:${dateStr}`,
        metric: METRIC,
        value: (high + low) / 2,
        unit,
        location: { latitude: location.latitude, longitude: location.longitude },
        timestamp,
        recordType: "forecast",
        forecastIssuedAt: retrievedAt,
        provenance: provenanceFor(
          "Daily value is the average of the model's forecast high/low, not an hourly-resolution or single authoritative figure.",
        ),
      });
    }

    // Wind is additive, requested for Construction's Site Risk Timeline
    // (BUILD_PLAN Stage 12 follow-up). Deliberately no gap when it's
    // absent — unlike temperature, not every caller of this connector
    // needs wind, and a request that only asked for temperature would
    // otherwise report a confusing gap for data it never wanted.
    const wind = winds?.[i];
    if (wind !== undefined) {
      records.push({
        id: `${connectorId}:${location.id}:${WIND_METRIC}:${dateStr}`,
        metric: WIND_METRIC,
        value: wind,
        unit: windUnit,
        location: { latitude: location.latitude, longitude: location.longitude },
        timestamp,
        recordType: "forecast",
        forecastIssuedAt: retrievedAt,
        provenance: provenanceFor(
          "Daily value is the model's forecast maximum wind speed for the day, not an hourly-resolution figure.",
        ),
      });
    }
  });

  return { records, gaps };
}

/**
 * The second, genuinely different data-provider connector (BUILD_PLAN's
 * deferred-list item, closed alongside Stage 10 ticket 10.6) — unlike
 * Weather & Climate's temperature-status capability, which reused
 * NASA POWER with a different parameter, this is a real, structurally
 * different provider: a different API shape (daily min/max arrays
 * keyed by date, not POWER's per-parameter-per-date object), a
 * different domain (forward-looking forecast, not historical/current
 * observation), and a different license (Open-Meteo's own CC BY 4.0
 * terms, with a real non-commercial-use restriction on the free tier —
 * see docs/data-provenance/open-meteo.md). This is the concrete
 * evidence ADR-0003's Standing Action Item asked for: whether the
 * ingestion interface holds up against a provider whose data doesn't
 * look like the first one at all. It required zero changes to
 * `DataIngestionConnector` itself — only an additive schema change
 * (`recordType`/`forecastIssuedAt`, fully backward-compatible) to
 * represent what NASA POWER's data never needed to: a value that
 * hasn't happened yet.
 *
 * No API key, no signup — matching this project's existing preference
 * for zero-friction data sources (NASA POWER shares this property).
 */
export class OpenMeteoConnector implements DataIngestionConnector {
  readonly id = "open-meteo";
  readonly displayName = "Open-Meteo";

  private readonly config: Required<OpenMeteoConnectorConfig>;

  constructor(config: OpenMeteoConnectorConfig) {
    this.config = { forecastDays: 7, ...config };
  }

  async ingest(trigger: IngestionTrigger): Promise<IngestionResult> {
    const records: NormalizedDataRecord[] = [];
    const gaps: IngestionGap[] = [];

    for (const location of this.config.locations) {
      try {
        const response = await this.fetchLocation(location);
        const { records: locationRecords, gaps: locationGaps } = parseOpenMeteoResponse(
          this.id,
          this.displayName,
          location,
          response,
        );
        records.push(...locationRecords);
        gaps.push(...locationGaps);
      } catch (err) {
        gaps.push({
          description: `Failed to retrieve Open-Meteo forecast for location "${location.id}"`,
          reason: err instanceof TypeError ? "provider-unavailable" : "malformed-response",
          detail: err instanceof Error ? err.message : String(err),
          occurredAt: new Date().toISOString(),
          transient: true,
        });
      }
    }

    void trigger;

    return { records, gaps };
  }

  async checkHealth(): Promise<{ healthy: boolean; detail?: string }> {
    try {
      const probeLocation = this.config.locations[0];
      if (!probeLocation) {
        return { healthy: false, detail: "No locations configured to probe." };
      }
      await this.fetchLocation(probeLocation);
      return { healthy: true };
    } catch (err) {
      return { healthy: false, detail: err instanceof Error ? err.message : String(err) };
    }
  }

  private async fetchLocation(location: OpenMeteoLocation): Promise<OpenMeteoApiResponse> {
    const url = new URL(FORECAST_API_BASE);
    url.searchParams.set("latitude", String(location.latitude));
    url.searchParams.set("longitude", String(location.longitude));
    url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,wind_speed_10m_max");
    url.searchParams.set("wind_speed_unit", "ms");
    url.searchParams.set("forecast_days", String(this.config.forecastDays));
    url.searchParams.set("timezone", "UTC");

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Open-Meteo API returned ${res.status} ${res.statusText}`);
    }
    const body = (await res.json()) as OpenMeteoApiResponse;
    if (body.error) {
      throw new Error(`Open-Meteo API error: ${body.reason ?? "unknown"}`);
    }
    return body;
  }
}
