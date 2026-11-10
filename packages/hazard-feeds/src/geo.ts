import type { CameraNearPoint, PublicCamera } from "./types.js";

const EARTH_RADIUS_KM = 6371.0088;
const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/** Great-circle distance between two points, in kilometres (haversine). */
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Initial compass bearing from the first point to the second, 0 ≤ degrees < 360 (0 = north, 90 = east). */
export function bearingDegrees(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export type CompassPoint = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";
const COMPASS: CompassPoint[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

/** The eight-point compass name for a bearing. */
export function compassPoint(bearing: number): CompassPoint {
  const normalised = ((bearing % 360) + 360) % 360;
  return COMPASS[Math.round(normalised / 45) % 8] as CompassPoint;
}

/**
 * Finds cameras near many points quickly. Cameras are bucketed into one-degree
 * cells so each lookup only measures the few cameras in the cells around the
 * point instead of every camera (a few thousand cameras times a thousand
 * fires would otherwise be millions of distance measurements per request).
 */
export class CameraIndex {
  private readonly cells = new Map<string, PublicCamera[]>();

  constructor(cameras: readonly PublicCamera[]) {
    for (const camera of cameras) {
      const key = CameraIndex.key(Math.floor(camera.latitude), Math.floor(camera.longitude));
      const bucket = this.cells.get(key);
      if (bucket) bucket.push(camera);
      else this.cells.set(key, [camera]);
    }
  }

  private static key(latCell: number, lonCell: number): string {
    return `${latCell}:${lonCell}`;
  }

  /** The nearest cameras within `radiusKm` of a point, nearest first. */
  near(
    latitude: number,
    longitude: number,
    { radiusKm = 25, limit = 4 }: { radiusKm?: number; limit?: number } = {},
  ): CameraNearPoint[] {
    const latSpan = Math.ceil(radiusKm / 111.32);
    // A degree of longitude is shorter away from the equator, so look further sideways.
    const lonSpan = Math.ceil(radiusKm / (111.32 * Math.max(0.05, Math.cos(toRad(latitude)))));
    const latCell = Math.floor(latitude);
    const lonCell = Math.floor(longitude);
    const found: CameraNearPoint[] = [];
    for (let dLat = -latSpan; dLat <= latSpan; dLat += 1) {
      for (let dLon = -lonSpan; dLon <= lonSpan; dLon += 1) {
        // Wrap longitude cells around the date line.
        const wrappedLon = ((((lonCell + dLon + 180) % 360) + 360) % 360) - 180;
        const bucket = this.cells.get(CameraIndex.key(latCell + dLat, wrappedLon));
        if (!bucket) continue;
        for (const camera of bucket) {
          const km = distanceKm(latitude, longitude, camera.latitude, camera.longitude);
          if (km <= radiusKm) {
            found.push({
              camera,
              distanceKm: km,
              bearingDegrees: bearingDegrees(
                latitude,
                longitude,
                camera.latitude,
                camera.longitude,
              ),
            });
          }
        }
      }
    }
    found.sort((a, b) => a.distanceKm - b.distanceKm);
    return found.slice(0, limit);
  }
}

/**
 * Picks the cameras to draw as standalone markers. Dense cities have many
 * cameras a few hundred metres apart, which on a globe is one smear of dots,
 * so at most one camera is kept per `cellDegrees` square (0.05° is about 5 km),
 * and then each provider is limited to `maxPerProvider`, thinned evenly (every
 * n-th camera) rather than cut off, so a provider is not drawn only where its
 * list happens to start. Cameras are never altered.
 */
export function thinCameras(
  cameras: readonly PublicCamera[],
  {
    cellDegrees = 0.05,
    maxPerProvider = 600,
  }: { cellDegrees?: number; maxPerProvider?: number } = {},
): PublicCamera[] {
  const seenCells = new Set<string>();
  const byProvider = new Map<string, PublicCamera[]>();
  for (const camera of cameras) {
    const cell = `${Math.floor(camera.latitude / cellDegrees)}:${Math.floor(camera.longitude / cellDegrees)}`;
    if (seenCells.has(cell)) continue;
    seenCells.add(cell);
    const list = byProvider.get(camera.providerId);
    if (list) list.push(camera);
    else byProvider.set(camera.providerId, [camera]);
  }
  const out: PublicCamera[] = [];
  for (const list of byProvider.values()) {
    if (list.length <= maxPerProvider) {
      out.push(...list);
      continue;
    }
    for (let i = 0; i < maxPerProvider; i += 1) {
      out.push(list[Math.floor((i * list.length) / maxPerProvider)] as PublicCamera);
    }
  }
  return out;
}
