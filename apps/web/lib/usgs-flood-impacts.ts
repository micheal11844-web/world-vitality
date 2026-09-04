/**
 * Disaster Monitoring's flood signal (BUILD_PLAN "STAGE — DISASTER
 * MONITORING WORKSPACE FOLLOW-UP: FLOOD + SHELTER DATA", corrected by
 * "STAGE — DISASTER MONITORING FIX: USGS FLOOD IMPACT FIELD MAPPING"):
 * the USGS Real-Time Flood Impact (RT-FI) API — free, no key required,
 * official U.S. government data. Real currently-flooding infrastructure
 * locations (embankments, roads, bridges, pedestrian paths, buildings),
 * not an inferred/AI-derived flood risk score — same "relay, don't
 * reinterpret" design as `nws-alerts.ts`, for the same reason
 * (Constitution's zero-tolerance language for this workspace).
 *
 * **Field names and endpoints below are confirmed against USGS's own
 * published OpenAPI schema** (`GET /rtfi-api/openapi.json`, fetched
 * live and read directly — not guessed or inferred from a third party's
 * usage, unlike this file's first version). Two real bugs that version
 * had are fixed here:
 * - The response's actual name field is `site_name`, not `name` — this
 *   file's first version always fell through to the "Unnamed flood
 *   impact location" fallback.
 * - There is no `state`/`stateCode` string field at all — state is
 *   `state_id`, an **integer** foreign key, not a two-letter
 *   abbreviation. This file's first version filtered every record
 *   against `(record.state ?? "").toUpperCase() === stateCode`, which
 *   was always comparing an empty string against e.g. `"CA"` — meaning
 *   `fetchFloodingLocations` silently returned an empty array for
 *   every state, every time, regardless of what was actually flooding.
 *   That's a real, silent false-negative bug (not the visible
 *   "couldn't reach the API" failure state — a genuinely different,
 *   quieter problem: this always *succeeded* with a wrong, empty
 *   answer), now fixed by resolving the numeric `state_id` first via
 *   `GET /referencepoints/count/state/{state_abbreviation}` (which
 *   accepts the abbreviation directly and returns the matching
 *   `state_id`), then filtering the nationwide flooding list against
 *   that real integer.
 *
 * USGS's own provisional-data statement (see their RT-FI API
 * documentation) is real and worth repeating, not softened: this data
 * "has not received final approval by the U.S. Geological Survey" and
 * "data users are cautioned to consider carefully the provisional
 * nature of the information before using it for decisions that
 * concern personal or public safety."
 *
 * A descriptive `User-Agent` header is included on both requests below,
 * same precedent `nws-alerts.ts` already established for a different
 * U.S. government API — USGS's RT-FI docs don't document this as a
 * hard requirement the way NWS's API does, but many federal API
 * gateways apply bot-mitigation (Akamai/CloudFront/WAF) that can reject
 * or rate-limit requests carrying a generic or missing User-Agent,
 * and there is no downside to sending a real one.
 */

const RTFI_API_BASE = "https://api.waterdata.usgs.gov/rtfi-api";

const REQUEST_HEADERS = {
  "User-Agent": "World-Vitality-Disaster-Monitoring (github.com/micheal11844-web/world-vitality)",
  Accept: "application/json",
};

export interface FloodImpactLocation {
  id: string;
  name: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  /** True when `gage_height` exceeds `rp_elevation` as of USGS's last
   *  check (performed every 30 minutes per their own documentation) —
   *  included since `/referencepoints/flooding` can, per USGS's own
   *  endpoint description, return points that are not currently
   *  flooding when a date range is requested; always `true` for the
   *  no-arguments current-conditions call this file makes today. */
  isFlooding: boolean;
}

/** Real shape of `ReferencePointModel`, confirmed against USGS's
 *  published OpenAPI schema — see this file's own doc comment. Fields
 *  irrelevant to this app (gage_height, rp_elevation, unit, county_id,
 *  etc.) are intentionally omitted rather than transcribed in full. */
interface RtfiReferencePoint {
  id: number;
  site_name: string;
  description: string | null;
  state_id: number;
  latitude: number;
  longitude: number;
  is_flooding: boolean;
}

interface StateCountResponse {
  state_id: number;
  state_name: string;
  state_abbreviation: string;
  reference_point_count: number;
}

function parseRecord(record: RtfiReferencePoint, stateAbbreviation: string): FloodImpactLocation {
  return {
    id: String(record.id),
    name: record.site_name || "Unnamed flood impact location",
    state: stateAbbreviation.toUpperCase(),
    latitude: record.latitude ?? null,
    longitude: record.longitude ?? null,
    description: record.description ?? null,
    isFlooding: Boolean(record.is_flooding),
  };
}

/**
 * Resolves a two-letter state abbreviation to USGS's internal numeric
 * `state_id`, via the one endpoint that accepts the abbreviation
 * directly (`/referencepoints/count/state/{abbreviation}`) rather than
 * paginating through the full `/states` list to find a match.
 */
async function resolveStateId(stateCode: string): Promise<number> {
  const response = await fetch(
    `${RTFI_API_BASE}/referencepoints/count/state/${encodeURIComponent(stateCode)}`,
    { headers: REQUEST_HEADERS },
  );
  if (!response.ok) {
    throw new Error(
      `USGS Real-Time Flood Impact API could not resolve state "${stateCode}" (status ${response.status})`,
    );
  }
  const data = (await response.json()) as StateCountResponse;
  return data.state_id;
}

/**
 * Fetches currently-flooding locations (nationwide, per USGS's own
 * `/referencepoints/flooding` endpoint — it takes no location
 * parameter for current conditions), then filters to `stateCode`
 * client-side by the real numeric `state_id`. Returns an empty array
 * for "nothing currently flooding in this state" — a normal, good-news
 * outcome, not an error. Throws only on an actual network/API failure
 * or an unrecognized state code.
 */
export async function fetchFloodingLocations(stateCode: string): Promise<FloodImpactLocation[]> {
  const stateId = await resolveStateId(stateCode);

  const response = await fetch(`${RTFI_API_BASE}/referencepoints/flooding`, {
    headers: REQUEST_HEADERS,
  });
  if (!response.ok) {
    throw new Error(`USGS Real-Time Flood Impact API returned ${response.status}`);
  }
  const records = (await response.json()) as RtfiReferencePoint[];
  return records
    .filter((r) => r.state_id === stateId)
    .map((r) => parseRecord(r, stateCode));
}

