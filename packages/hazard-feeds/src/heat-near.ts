import { distanceKm } from "./geo.js";
import type { FireDetectionPoint } from "./types.js";

/** A place a person saved: their home place, a field, a property or a monitored location. */
export interface WatchedPlace {
  /** Stable for the place, e.g. `agriculture-<field id>` or `home`. */
  id: string;
  label: string;
  latitude: number;
  longitude: number;
}

/** What the satellites saw within range of one watched place. */
export interface HeatNearPlace {
  place: WatchedPlace;
  /** Detections within range (low-confidence ones are never counted). */
  detections: number;
  /** Distance to the nearest detection, in kilometres. */
  nearestKm: number;
  /** The nearest detection. */
  nearest: { latitude: number; longitude: number; acquiredAt: string };
}

/** A detection older than this is not news; the FIRMS feed used holds one day anyway. */
const DEFAULT_MAX_AGE_HOURS = 24;
const KM_PER_DEGREE_LATITUDE = 111.32;

/**
 * Which watched places have satellite heat detections within `radiusKm` of them.
 *
 * - Low-confidence detections are ignored, as on the Globe.
 * - A detection older than `maxAgeHours` is ignored, and so is one stamped in the
 *   future (a clock or parsing slip), so neither can raise an alert.
 * - Places come back in the order given, only those with something near; each
 *   carries the nearest detection and how many are in range.
 *
 * A latitude/longitude box rules most detections out before any distance is worked
 * out, so a few places against a day of world detections stays quick.
 */
export function heatNearPlaces(
  points: readonly FireDetectionPoint[],
  places: readonly WatchedPlace[],
  {
    radiusKm = 10,
    now = new Date(),
    maxAgeHours = DEFAULT_MAX_AGE_HOURS,
  }: { radiusKm?: number; now?: Date; maxAgeHours?: number } = {},
): HeatNearPlace[] {
  const newest = now.getTime() + 5 * 60 * 1000;
  const oldest = now.getTime() - maxAgeHours * 60 * 60 * 1000;
  const usable = points.filter((point) => {
    if (point.confidence === "low") return false;
    const at = Date.parse(point.acquiredAt);
    return Number.isFinite(at) && at >= oldest && at <= newest;
  });

  const found: HeatNearPlace[] = [];
  for (const place of places) {
    if (
      !Number.isFinite(place.latitude) ||
      !Number.isFinite(place.longitude) ||
      Math.abs(place.latitude) > 90 ||
      Math.abs(place.longitude) > 180
    ) {
      continue;
    }
    const latitudeSpan = radiusKm / KM_PER_DEGREE_LATITUDE;
    // Longitude degrees shrink towards the poles; near them, skip the box test.
    const cosine = Math.cos((place.latitude * Math.PI) / 180);
    const longitudeSpan = cosine > 0.05 ? latitudeSpan / cosine : 360;

    let detections = 0;
    let best: { km: number; point: FireDetectionPoint } | null = null;
    for (const point of usable) {
      if (Math.abs(point.latitude - place.latitude) > latitudeSpan) continue;
      let dLon = Math.abs(point.longitude - place.longitude);
      if (dLon > 180) dLon = 360 - dLon;
      if (dLon > longitudeSpan) continue;
      const km = distanceKm(place.latitude, place.longitude, point.latitude, point.longitude);
      if (km > radiusKm) continue;
      detections += 1;
      if (!best || km < best.km) best = { km, point };
    }
    if (best) {
      found.push({
        place,
        detections,
        nearestKm: best.km,
        nearest: {
          latitude: best.point.latitude,
          longitude: best.point.longitude,
          acquiredAt: best.point.acquiredAt,
        },
      });
    }
  }
  return found;
}

/** A point on Earth the Globe was asked to open on (from a heat alert's link). */
export interface GlobeFocus {
  latitude: number;
  longitude: number;
}

const FOCUS_PATTERN = /^(-?\d{1,2}(?:\.\d{1,6})?),(-?\d{1,3}(?:\.\d{1,6})?)$/;

/**
 * Reads the `heat` address parameter (`"<latitude>,<longitude>"`, as a heat alert's
 * link writes it) into a point, or `null` for anything else: a missing value, a
 * list of values, extra text, or a point not on Earth. Strict on purpose: this comes
 * from the address bar, so it is never trusted beyond "two numbers in range".
 */
export function parseGlobeFocus(value: string | string[] | null | undefined): GlobeFocus | null {
  if (typeof value !== "string") return null;
  const match = FOCUS_PATTERN.exec(value);
  if (!match) return null;
  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude, longitude };
}
