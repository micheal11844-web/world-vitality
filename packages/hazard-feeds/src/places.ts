import type { PlaceTier } from "./places-data.js";

export { CITY_PLACES, COUNTRY_PLACES } from "./places-data.js";
export type { CityPlace, CountryPlace, PlaceTier } from "./places-data.js";

/**
 * How far from the camera (in metres, straight-line to the name) a place name is
 * drawn. A name shows only while the camera is between `near` and `far`, so the
 * whole-Earth view carries a handful of country names, and city names arrive in
 * steps as the person comes closer, instead of hundreds of names on top of each other.
 */
export interface VisibleRange {
  near: number;
  far: number;
}

/** Countries: the biggest are readable from the whole-Earth view, small ones only from up close. */
export const COUNTRY_VISIBLE_M: Readonly<Record<PlaceTier, VisibleRange>> = {
  0: { near: 900_000, far: 40_000_000 },
  1: { near: 900_000, far: 9_000_000 },
  2: { near: 600_000, far: 4_500_000 },
};

/**
 * Cities: the very large ones from a continent-sized view, capitals and big cities
 * from a region-sized view, the rest only close in. None are shown from the
 * whole-Earth view, which belongs to the country names.
 */
export const CITY_VISIBLE_M: Readonly<Record<PlaceTier, VisibleRange>> = {
  0: { near: 0, far: 9_000_000 },
  1: { near: 0, far: 4_500_000 },
  2: { near: 0, far: 2_200_000 },
};

const displayNames = new Map<string, Intl.DisplayNames | null>();

function displayNamesFor(locale: string): Intl.DisplayNames | null {
  if (displayNames.has(locale)) return displayNames.get(locale) ?? null;
  let names: Intl.DisplayNames | null = null;
  try {
    names = new Intl.DisplayNames([locale], { type: "region", fallback: "none" });
  } catch {
    names = null;
  }
  displayNames.set(locale, names);
  return names;
}

/**
 * The name of a country in the person's language, from the browser's own language
 * data (so no name list is shipped or translated by hand). `null` when the browser
 * has no name for it, in which case the Globe shows no label for that country
 * rather than a bare code.
 */
export function countryName(code: string, locale: string): string | null {
  try {
    const name = displayNamesFor(locale)?.of(code);
    return name && name !== code ? name : null;
  } catch {
    return null;
  }
}
