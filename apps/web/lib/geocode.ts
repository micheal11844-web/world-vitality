/**
 * Public Explorer's real differentiator vs. every other workspace
 * (BUILD_PLAN "STAGE — PUBLIC EXPLORER WORKSPACE"): every existing
 * workspace shows one hardcoded demo location (see e.g.
 * `app/workspaces/weather/page.tsx`'s `DEMO_LOCATION` — no user-
 * configured saved locations exist yet, PRD Section A.6). Public
 * Explorer's PRD mission is explicitly "a person can search their
 * town" — this resolves a free-text place name into coordinates so
 * that search is real, not another hardcoded demo.
 *
 * Uses Open-Meteo's free Geocoding API — the same provider family this
 * app already trusts for forecast data (`OpenMeteoConnector`), not a
 * new, unverified dependency. No API key required. Deliberately kept
 * separate from `services/data-ingestion/`'s connectors: this resolves
 * a place name to coordinates, it isn't itself an environmental data
 * series, so it doesn't fit `DataIngestionConnector`'s shape (which
 * ADR-0002 scopes to normalizing *environmental* provider data) — same
 * reasoning already applied to `password-breach-check.ts` calling an
 * external API directly from `apps/web/lib` rather than forcing it
 * into a layer it doesn't belong in.
 */

const GEOCODING_API_BASE = "https://geocoding-api.open-meteo.com/v1/search";

export interface GeocodedLocation {
  name: string;
  country: string | null;
  latitude: number;
  longitude: number;
}

interface GeocodingApiResponse {
  results?: {
    name: string;
    country?: string;
    latitude: number;
    longitude: number;
  }[];
}

/**
 * Resolves a free-text place name (e.g. "Ibadan", "Paris, France") to
 * its best-match coordinates. Returns `null` — not an error — for "no
 * match found," which is a normal, expected outcome of a free-text
 * search, not a failure; throws only on an actual network/API failure,
 * left for the caller to decide how to present (this module has no
 * opinion on UI wording).
 */
export async function geocodeLocation(query: string): Promise<GeocodedLocation | null> {
  const trimmed = query.trim();
  if (!trimmed) {
    return null;
  }

  const url = new URL(GEOCODING_API_BASE);
  url.searchParams.set("name", trimmed);
  url.searchParams.set("count", "1");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Open-Meteo Geocoding API returned ${response.status}`);
  }

  const data = (await response.json()) as GeocodingApiResponse;
  const first = data.results?.[0];
  if (!first) {
    return null;
  }

  return {
    name: first.name,
    country: first.country ?? null,
    latitude: first.latitude,
    longitude: first.longitude,
  };
}
