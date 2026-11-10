/**
 * The shapes the Globe's fire and camera layers share. Everything in this
 * package is pure (no network, no clock, no environment): the app fetches the
 * outside feeds, then hands the raw payloads here to be checked and reshaped,
 * so the rules can be tested on sample payloads.
 */

/** The official camera sources the Globe knows about. Adding one is a code change on purpose (see `providers.ts`). */
export type CameraProviderId = "caltrans" | "tfl" | "nsw" | "digitraffic" | "drivebc";

/** One public traffic or road-weather camera, reduced to what the Globe needs. */
export interface PublicCamera {
  /** Provider-prefixed and stable, e.g. `caltrans-d7-tv102`. */
  id: string;
  providerId: CameraProviderId;
  /** The agency's own name for the camera, trimmed and length-capped. Shown as text, never as markup. */
  name: string;
  latitude: number;
  longitude: number;
  /** The agency's own still image: always `https`, always on the provider's pinned host. */
  imageUrl: string;
  /** How often the agency says the picture refreshes, in minutes; `null` when it does not say. */
  refreshMinutes: number | null;
  /** A partner's image credit that the agency publishes with the camera (DriveBC only), plain text. */
  credit?: string;
}

/** Who a camera feed belongs to, and the terms it is used under. */
export interface CameraProviderInfo {
  id: CameraProviderId;
  /** The credit shown with every picture from this provider. */
  attribution: string;
  licenceName: string;
  licenceUrl: string;
  /** Where the agency publishes the feed. */
  sourceUrl: string;
  /** ISO 3166-1 alpha-2 country the provider's cameras are in (picks the emergency number). */
  countryCode: string;
  /** Picture addresses must start with this (scheme, host and path prefix). */
  imageOrigin: string;
  /** The same origin written as a Content-Security-Policy `img-src` source. */
  cspImageSource: string;
}

export type FireConfidence = "high" | "nominal" | "low";

/** One satellite heat detection (a thermal anomaly, not a confirmed fire). */
export interface FireDetectionPoint {
  latitude: number;
  longitude: number;
  /** UTC, ISO 8601. */
  acquiredAt: string;
  satellite: string;
  confidence: FireConfidence;
  /** Fire radiative power in megawatts, when reported. */
  frp: number | null;
}

/** Nearby detections folded into one map point so the globe stays fast. */
export interface FireCluster {
  /** Stable for a given grid cell and cell size, e.g. `fire-1241_615` (row and column counted from the south-west corner of the map). */
  id: string;
  latitude: number;
  longitude: number;
  /** How many detections were folded into this point. */
  count: number;
  maxFrp: number | null;
  /** The best confidence among the folded detections. */
  confidence: "high" | "nominal";
  /** The most recent detection time (UTC, ISO 8601). */
  latestAcquiredAt: string;
  satellite: string;
}

export interface CameraNearPoint {
  camera: PublicCamera;
  distanceKm: number;
  /** Compass bearing from the point to the camera, 0–360 degrees (0 = north). */
  bearingDegrees: number;
}
