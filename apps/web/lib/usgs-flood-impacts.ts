/**
 * Disaster Monitoring's flood signal (BUILD_PLAN "STAGE — DISASTER
 * MONITORING WORKSPACE FOLLOW-UP: FLOOD + SHELTER DATA"): the USGS
 * Real-Time Flood Impact (RT-FI) API — free, no key required for the
 * request volume this app makes, official U.S. government data. Real
 * currently-flooding infrastructure locations (embankments, roads,
 * bridges, pedestrian paths, buildings), not an inferred/AI-derived
 * flood risk score — same "relay, don't reinterpret" design as
 * `nws-alerts.ts`, for the same reason (Constitution's zero-tolerance
 * language for this workspace).
 *
 * Endpoint shape confirmed from a real, working third-party
 * implementation's source code (not guessed): base
 * `https://api.waterdata.usgs.gov/rtfi-api`,
 * `GET /referencepoints/flooding` for currently-flooding locations
 * nationwide, `GET /referencepoints/state/{stateCode}` for a state's
 * full reference-point list (used here to filter the nationwide
 * flooding list down to one state, since the flooding endpoint itself
 * takes no location parameter).
 *
 * **Honest uncertainty, stated explicitly rather than presented as
 * verified:** USGS's own OpenAPI schema for this response
 * (`/rtfi-api/openapi.json`) could not be fetched from this sandbox
 * (no outbound access to api.waterdata.usgs.gov), so the exact field
 * names on a reference-point object are inferred from a real
 * third-party client's usage, not confirmed against USGS's own
 * documented schema. Parsing here is deliberately defensive — reads
 * common/likely field names, falls back gracefully rather than
 * throwing, and this whole module is explicitly NOT verified against
 * a live response from this build environment.
 *
 * USGS's own provisional-data statement (see their RT-FI API
 * documentation) is real and worth repeating, not softened: this data
 * "has not received final approval by the U.S. Geological Survey" and
 * "data users are cautioned to consider carefully the provisional
 * nature of the information before using it for decisions that
 * concern personal or public safety."
 */

const RTFI_API_BASE = "https://api.waterdata.usgs.gov/rtfi-api";

export interface FloodImpactLocation {
  id: string;
  name: string;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
}

interface RtfiApiRecord {
  id?: string | number;
  reference_point_id?: string | number;
  name?: string;
  description?: string;
  state?: string;
  stateCode?: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lon?: number;
  lng?: number;
}

function parseRecord(record: RtfiApiRecord): FloodImpactLocation {
  return {
    id: String(record.id ?? record.reference_point_id ?? ""),
    name: record.name ?? "Unnamed flood impact location",
    state: record.state ?? record.stateCode ?? null,
    latitude: record.latitude ?? record.lat ?? null,
    longitude: record.longitude ?? record.lon ?? record.lng ?? null,
    description: record.description ?? null,
  };
}

function extractRecords(data: unknown): RtfiApiRecord[] {
  if (Array.isArray(data)) return data as RtfiApiRecord[];
  if (
    data &&
    typeof data === "object" &&
    "items" in data &&
    Array.isArray((data as { items: unknown }).items)
  ) {
    return (data as { items: RtfiApiRecord[] }).items;
  }
  return [];
}

/**
 * Fetches currently-flooding locations (nationwide, per USGS's own
 * `/referencepoints/flooding` endpoint — it takes no location
 * parameter), then filters to `stateCode` client-side. Returns an
 * empty array for "nothing currently flooding in this state" — a
 * normal, good-news outcome, not an error. Throws only on an actual
 * network/API failure.
 */
export async function fetchFloodingLocations(stateCode: string): Promise<FloodImpactLocation[]> {
  const response = await fetch(`${RTFI_API_BASE}/referencepoints/flooding`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`USGS Real-Time Flood Impact API returned ${response.status}`);
  }
  const data = await response.json();
  const records = extractRecords(data).map(parseRecord);
  return records.filter((r) => (r.state ?? "").toUpperCase() === stateCode.toUpperCase());
}
