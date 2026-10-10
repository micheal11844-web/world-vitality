import type { GeocodedLocation } from "./geocode";

/**
 * Deep link into Public Explorer for an already-resolved place, so a
 * search result opens *that* "Paris" rather than re-geocoding the name
 * and landing on whichever one the geocoder ranks first.
 *
 * The coordinates travel in the URL, so the receiving side
 * (`parseExploreLocation`) treats them as untrusted input: finite
 * numbers inside real latitude/longitude ranges, bounded text lengths.
 */
export function exploreHref(location: GeocodedLocation): string {
  const params = new URLSearchParams({
    lat: String(round(location.latitude)),
    lon: String(round(location.longitude)),
    name: location.name,
  });
  if (location.country) params.set("country", location.country);
  if (location.region) params.set("region", location.region);
  return `/explore?${params.toString()}`;
}

function round(n: number): number {
  return Math.round(n * 10_000) / 10_000;
}

const MAX_TEXT = 120;

function firstString(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Validates `?lat&lon&name[&country&region]`; `null` if absent or invalid. */
export function parseExploreLocation(
  params: Record<string, string | string[] | undefined>,
): GeocodedLocation | null {
  const latRaw = firstString(params.lat);
  const lonRaw = firstString(params.lon);
  const name = firstString(params.name)?.trim();
  if (latRaw === undefined || lonRaw === undefined || !name) return null;

  const latitude = Number(latRaw);
  const longitude = Number(lonRaw);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  if (name.length > MAX_TEXT) return null;

  const country = firstString(params.country)?.trim().slice(0, MAX_TEXT) || null;
  const region = firstString(params.region)?.trim().slice(0, MAX_TEXT) || null;
  return { name, country, region, latitude, longitude };
}

/** "Paris, Texas, United States" — the label used everywhere a place is listed. */
export function placeLabel(location: GeocodedLocation): string {
  const parts: string[] = [];
  for (const part of [location.name, location.region, location.country]) {
    // "Lagos, Lagos, Nigeria" reads as a typo — skip a part that repeats the previous one.
    if (part && part !== parts[parts.length - 1]) parts.push(part);
  }
  return parts.join(", ");
}
