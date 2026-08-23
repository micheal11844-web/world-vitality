/**
 * Disaster Monitoring's shelter reference data (BUILD_PLAN "STAGE —
 * DISASTER MONITORING WORKSPACE FOLLOW-UP: FLOOD + SHELTER DATA"):
 * FEMA/American Red Cross designated shelter facility locations, from
 * the Homeland Infrastructure Foundation-Level Data (HIFLD) Open
 * portal's `national_shelter_system_facilities` layer — public
 * domain, free, no key required.
 *
 * Queried via the standard Esri ArcGIS REST API spatial-query pattern
 * (a long-established, widely-documented public contract, not this
 * app's own invention) against
 * `https://maps.nccs.nasa.gov/mapping/rest/services/hifld_open/emergency_services/FeatureServer/7`
 * — layer id 7, confirmed as `national_shelter_system_facilities` from
 * that FeatureServer's own published layer metadata.
 *
 * **The single most important thing about this data, stated verbatim
 * from FEMA/HIFLD's own layer description, not paraphrased into
 * something softer:** "THIS LAYER SHOULD NOT BE USED TO DETERMINE THE
 * OPERATIONAL STATUS OF A FACILITY DURING AN ACTIVE EMERGENCY." These
 * are designated potential shelter locations — a reference list, not
 * live open/closed status. `SHELTER_STATUS_CAVEAT` below is displayed
 * on-page exactly as written here, not summarized or softened.
 *
 * **Honest uncertainty about field names:** the layer's own published
 * metadata confirms `name`/`fema_id`/`arc_id`/`evac_cap` exist, but
 * this module could not fetch a live response from this sandbox (no
 * outbound access to maps.nccs.nasa.gov) to confirm address/city/state
 * field names — parsing here is deliberately defensive, matching
 * `usgs-flood-impacts.ts`'s same honest-uncertainty approach.
 */

const SHELTERS_LAYER_URL =
  "https://maps.nccs.nasa.gov/mapping/rest/services/hifld_open/emergency_services/FeatureServer/7/query";

export const SHELTER_STATUS_CAVEAT =
  "This layer should not be used to determine the operational status of a facility during an active emergency. — FEMA/HIFLD";

export interface ShelterLocation {
  id: string;
  name: string;
  address: string | null;
  evacuationCapacity: number | null;
  latitude: number;
  longitude: number;
}

interface ArcGisFeature {
  attributes: Record<string, unknown>;
  geometry?: { x: number; y: number };
}

interface ArcGisQueryResponse {
  features?: ArcGisFeature[];
}

function readString(attrs: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = attrs[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function readNumber(attrs: Record<string, unknown>, ...keys: string[]): number | null {
  for (const key of keys) {
    const value = attrs[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
}

/**
 * Fetches designated shelter facilities within `radiusMiles` of a
 * point via a standard ArcGIS REST spatial query. Returns an empty
 * array for "no designated shelters within range" — not an error.
 * Throws only on an actual network/API failure.
 */
export async function fetchNearbyShelters(
  latitude: number,
  longitude: number,
  radiusMiles = 25,
): Promise<ShelterLocation[]> {
  const url = new URL(SHELTERS_LAYER_URL);
  url.searchParams.set("where", "1=1");
  url.searchParams.set("geometry", `${longitude},${latitude}`);
  url.searchParams.set("geometryType", "esriGeometryPoint");
  url.searchParams.set("inSR", "4326");
  url.searchParams.set("distance", String(radiusMiles));
  url.searchParams.set("units", "esriSRUnit_StatuteMile");
  url.searchParams.set("spatialRel", "esriSpatialRelIntersects");
  url.searchParams.set("outFields", "*");
  url.searchParams.set("returnGeometry", "true");
  url.searchParams.set("f", "json");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`HIFLD shelter facilities service returned ${response.status}`);
  }

  const data = (await response.json()) as ArcGisQueryResponse;
  return (data.features ?? [])
    .filter((f) => f.geometry)
    .map((f) => ({
      id: String(
        readString(f.attributes, "objectid", "OBJECTID") ?? `${f.geometry!.x},${f.geometry!.y}`,
      ),
      name: readString(f.attributes, "name", "NAME") ?? "Unnamed facility",
      address: readString(f.attributes, "address", "ADDRESS", "full_address"),
      evacuationCapacity: readNumber(f.attributes, "evac_cap", "EVAC_CAP"),
      latitude: f.geometry!.y,
      longitude: f.geometry!.x,
    }));
}
