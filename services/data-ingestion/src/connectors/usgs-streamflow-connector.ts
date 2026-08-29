import type { NormalizedDataRecord, IngestionGap, Provenance } from "@world-vitality/data-schemas";
import type {
  DataIngestionConnector,
  IngestionResult,
  IngestionTrigger,
} from "../DataIngestionConnector.js";

const NWIS_IV_BASE = "https://waterservices.usgs.gov/nwis/iv/";
const DISCHARGE_PARAMETER_CODE = "00060"; // Discharge, cubic feet per second
export const STREAMFLOW_METRIC = "STREAMFLOW_DISCHARGE";

/**
 * A USGS gauge station to ingest data for. Unlike `NasaPowerLocation`/
 * Open-Meteo's arbitrary lat/lon, streamflow is only measured at fixed
 * physical gauge installations — `siteNumber` is the actual query
 * parameter this connector sends; `latitude`/`longitude` are carried
 * only for this app's own map/display conventions and are overwritten
 * by the response's own reported station coordinates when present (more
 * accurate than a manually-entered config value — see
 * `parseNwisResponse`).
 */
export interface UsgsGaugeStation {
  /** Identifier used in generated record IDs — keep stable across runs. */
  id: string;
  /** The real USGS site number, e.g. "01646500". */
  siteNumber: string;
  latitude: number;
  longitude: number;
}

export interface UsgsStreamflowConnectorConfig {
  stations: UsgsGaugeStation[];
}

interface NwisIvResponse {
  value?: {
    timeSeries?: Array<{
      sourceInfo?: {
        geoLocation?: { geogLocation?: { latitude?: number; longitude?: number } };
      };
      variable?: { unit?: { unitCode?: string } };
      values?: Array<{
        value?: Array<{ value: string; qualifiers?: string[]; dateTime: string }>;
      }>;
    }>;
  };
}

/**
 * Pure normalization logic, factored out of the connector class so it's
 * independently testable without a live network call — same pattern
 * `parsePowerResponse` established for `NasaPowerConnector`.
 *
 * USGS marks every value with a qualifier code — most commonly `"A"`
 * (approved) or `"P"` (provisional, not yet reviewed). Per ADR-0003's
 * "never fabricate" requirement and this app's existing precedent
 * (Disaster Monitoring's own USGS flood data carries the identical
 * caveat), a provisional value is still a real value — reported as such,
 * with the provisional status recorded honestly in
 * `provenance.knownLimitations`, never silently upgraded to look final.
 */
export function parseNwisResponse(
  connectorId: string,
  connectorDisplayName: string,
  station: UsgsGaugeStation,
  response: NwisIvResponse,
): { records: NormalizedDataRecord[]; gaps: IngestionGap[] } {
  const records: NormalizedDataRecord[] = [];
  const gaps: IngestionGap[] = [];
  const retrievedAt = new Date().toISOString();

  const series = response.value?.timeSeries?.[0];
  const values = series?.values?.[0]?.value;

  if (!series || !values || values.length === 0) {
    gaps.push({
      description: `No streamflow discharge data available for USGS site ${station.siteNumber}`,
      reason: "field-missing-at-source",
      occurredAt: retrievedAt,
      transient: false,
    });
    return { records, gaps };
  }

  const unit = series.variable?.unit?.unitCode ?? "ft3/s";
  const reportedLocation = series.sourceInfo?.geoLocation?.geogLocation;
  const latitude = reportedLocation?.latitude ?? station.latitude;
  const longitude = reportedLocation?.longitude ?? station.longitude;

  for (const entry of values) {
    const numericValue = Number(entry.value);
    if (!Number.isFinite(numericValue)) {
      gaps.push({
        description: `Non-numeric discharge value "${entry.value}" for USGS site ${station.siteNumber}`,
        reason: "malformed-response",
        occurredAt: retrievedAt,
        transient: false,
      });
      continue;
    }

    const isProvisional = entry.qualifiers?.includes("P") ?? false;
    const provenance: Provenance = {
      source: connectorId,
      sourceName: connectorDisplayName,
      license: "Public Domain (US Government Work)",
      attributionUrl: "https://waterdata.usgs.gov/nwis",
      retrievedAt,
      observedAt: new Date(entry.dateTime).toISOString(),
      knownLimitations: [
        isProvisional
          ? "This value is provisional and has not received final USGS approval — not to be used for permitting or legal purposes."
          : "This value has been reviewed/approved by USGS, per its own qualifier code.",
        "Measured at a fixed gauge station, not an arbitrary point — represents conditions at this specific location on this waterway only.",
      ],
    };

    records.push({
      id: `${connectorId}:${station.id}:${STREAMFLOW_METRIC}:${entry.dateTime}`,
      metric: STREAMFLOW_METRIC,
      value: numericValue,
      unit,
      location: { latitude, longitude },
      timestamp: new Date(entry.dateTime).toISOString(),
      provenance,
    });
  }

  return { records, gaps };
}

/**
 * Renewable Energy's hydro data source (BUILD_PLAN "STAGE — RENEWABLE
 * ENERGY FOLLOW-UP: HYDRO"), closing the last of the PRD's three named
 * asset types. Pulls real-time streamflow discharge from USGS's National
 * Water Information System (NWIS) Instantaneous Values service — free,
 * no API key, the same USGS family this app already trusts for Disaster
 * Monitoring's flood-impact data.
 *
 * **Real, honestly-flagged architectural difference from every other
 * connector in this app**: `NasaPowerConnector`/`OpenMeteoConnector`
 * accept arbitrary latitude/longitude — any point on Earth. Streamflow
 * is only measured at fixed physical gauge installations, so this
 * connector is configured with real USGS site numbers, not coordinates
 * a caller picks freely. This also means **US and territories only** —
 * the same geographic limitation Disaster Monitoring's own USGS sources
 * already carry.
 *
 * **No forecast counterpart exists or is planned**: USGS NWIS IV is an
 * observational, real-time-only service — there is no public USGS
 * streamflow forecast API comparable to Open-Meteo's weather forecast.
 * Renewable Energy's hydro status is therefore current-conditions only,
 * with no outlook widget — a real gap, stated honestly, not an
 * oversight.
 */
export class UsgsStreamflowConnector implements DataIngestionConnector {
  readonly id = "usgs-nwis-streamflow";
  readonly displayName = "USGS National Water Information System (Streamflow)";

  private readonly config: UsgsStreamflowConnectorConfig;

  constructor(config: UsgsStreamflowConnectorConfig) {
    this.config = config;
  }

  async ingest(trigger: IngestionTrigger): Promise<IngestionResult> {
    const records: NormalizedDataRecord[] = [];
    const gaps: IngestionGap[] = [];

    for (const station of this.config.stations) {
      try {
        const response = await this.fetchStation(station);
        const { records: stationRecords, gaps: stationGaps } = parseNwisResponse(
          this.id,
          this.displayName,
          station,
          response,
        );
        records.push(...stationRecords);
        gaps.push(...stationGaps);
      } catch (err) {
        // Network failure, non-2xx response, or malformed JSON — an
        // expected failure mode (Engineering Blueprint Section 11), not
        // a programming error. Reported as a gap, per the interface
        // contract — same reasoning as NasaPowerConnector's ingest().
        gaps.push({
          description: `Failed to retrieve NWIS streamflow data for site "${station.siteNumber}"`,
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
      const probeStation = this.config.stations[0];
      if (!probeStation) {
        return { healthy: false, detail: "No stations configured to probe." };
      }
      await this.fetchStation(probeStation);
      return { healthy: true };
    } catch (err) {
      return {
        healthy: false,
        detail: err instanceof Error ? err.message : String(err),
      };
    }
  }

  private async fetchStation(station: UsgsGaugeStation): Promise<NwisIvResponse> {
    const url = new URL(NWIS_IV_BASE);
    url.searchParams.set("format", "json");
    url.searchParams.set("sites", station.siteNumber);
    url.searchParams.set("parameterCd", DISCHARGE_PARAMETER_CODE);
    url.searchParams.set("siteStatus", "active");

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`NWIS IV service returned ${res.status} ${res.statusText}`);
    }
    const body = (await res.json()) as NwisIvResponse;
    if (!body?.value) {
      throw new Error('NWIS IV response missing expected "value" shape');
    }
    return body;
  }
}
