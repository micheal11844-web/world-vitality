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
 * Uses Open-Meteo's Geocoding API — the same provider family this
 * app already trusts for forecast data (`OpenMeteoConnector`), not a
 * new, unverified dependency. No API key is required on the free tier;
 * with `OPEN_METEO_API_KEY` set it uses the paid customer host. Deliberately kept
 * separate from `services/data-ingestion/`'s connectors: this resolves
 * a place name to coordinates, it isn't itself an environmental data
 * series, so it doesn't fit `DataIngestionConnector`'s shape (which
 * ADR-0002 scopes to normalizing *environmental* provider data) — same
 * reasoning already applied to `password-breach-check.ts` calling an
 * external API directly from `apps/web/lib` rather than forcing it
 * into a layer it doesn't belong in.
 */

const GEOCODING_API_FREE = "https://geocoding-api.open-meteo.com/v1/search";
/** The paying-customer host (Open-Meteo: "the server URL requires the prefix
 *  `customer-`"; the key goes in `apikey`). Used only when `OPEN_METEO_API_KEY`
 *  is set, so the free endpoint is never used for a commercial product. */
const GEOCODING_API_CUSTOMER = "https://customer-geocoding-api.open-meteo.com/v1/search";

/** The search URL: the free host, or the paying-customer host with the key. */
function geocodingUrl(name: string): URL {
  const apiKey = process.env.OPEN_METEO_API_KEY?.trim();
  const url = new URL(apiKey ? GEOCODING_API_CUSTOMER : GEOCODING_API_FREE);
  if (apiKey) url.searchParams.set("apikey", apiKey);
  url.searchParams.set("name", name);
  return url;
}

export interface GeocodedLocation {
  name: string;
  country: string | null;
  /** First-level admin region (state/province) — disambiguates the many Parises. Optional. */
  region?: string | null;
  latitude: number;
  longitude: number;
}

interface GeocodingApiResponse {
  results?: {
    name: string;
    country?: string;
    admin1?: string;
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

  const url = geocodingUrl(trimmed);
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
    region: first.admin1 ?? null,
    latitude: first.latitude,
    longitude: first.longitude,
  };
}

/**
 * Up to `count` candidate places for a free-text query — for search
 * suggestions and the results page, where a person needs to pick the
 * right "Paris" rather than be handed the geocoder's first guess.
 * `geocodeLocation` (best single match) stays as the Explorer's
 * original one-shot path.
 *
 * Same contract as `geocodeLocation`: an empty array means "no match"
 * (normal); it throws only on a real network/API failure, left for the
 * caller to present.
 */
export async function geocodeCandidates(query: string, count = 5): Promise<GeocodedLocation[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const url = geocodingUrl(trimmed);
  url.searchParams.set("count", String(Math.min(Math.max(count, 1), 10)));

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Open-Meteo Geocoding API returned ${response.status}`);
  }

  const data = (await response.json()) as GeocodingApiResponse;
  return (data.results ?? []).map((r) => ({
    name: r.name,
    country: r.country ?? null,
    region: r.admin1 ?? null,
    latitude: r.latitude,
    longitude: r.longitude,
  }));
}
