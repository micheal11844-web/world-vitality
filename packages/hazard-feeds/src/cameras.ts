import { CAMERA_PROVIDERS } from "./providers.js";
import type { CameraProviderId, PublicCamera } from "./types.js";

/**
 * Turns each agency's raw camera list into `PublicCamera`s.
 *
 * The payload shapes below are the ones the agencies publish and that the
 * open-source God's Eye View project (MIT) reads for the same feeds. They
 * could NOT be fetched from the build sandbox (the agencies' API paths are
 * closed to its web tools, and its shell has no outside access), so these
 * parsers are written to be forgiving about everything except safety: a
 * record that is missing a field, in the wrong shape, switched off, or whose
 * picture is not on the agency's own host is skipped, never repaired or
 * guessed, and a payload that is not the expected kind of list gives an empty
 * list. The app logs how many cameras each provider produced, so a feed that
 * changed shape shows up as "0 cameras" rather than as wrong data.
 */

const MAX_NAME_LENGTH = 120;
const MAX_CREDIT_LENGTH = 160;

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/** A finite number from a number or numeric string; `null` otherwise (never 0 for "missing"). */
function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** A real position: in range, and not the (0, 0) "no position" placeholder. */
export function isUsableCoordinate(latitude: unknown, longitude: unknown): boolean {
  return (
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    !(latitude === 0 && longitude === 0)
  );
}

/** Text from a feed, as one trimmed line with control characters removed and a length cap. */
function cleanText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  const text = value
    // eslint-disable-next-line no-control-regex -- stripping control characters is the point
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/**
 * The same picture address with a changing `wv` query value, so a browser or
 * a cache in between fetches the picture again instead of showing one it kept.
 * Agency cameras publish each new still at the SAME address, and some serve
 * it with a cache lifetime, which is how a picture can look an hour old.
 * `stamp` is whatever changes when a fresh look is wanted (a minute number
 * when a camera is opened, the current time when the person reloads).
 * Anything that is not a readable web address is returned unchanged.
 */
export function cacheBustedImageUrl(imageUrl: string, stamp: number): string {
  try {
    const url = new URL(imageUrl);
    url.searchParams.set("wv", String(Math.trunc(stamp)));
    return url.href;
  } catch {
    return imageUrl;
  }
}

/**
 * `raw` as an `https` address that starts with `origin` exactly (same host,
 * same port, path under the origin's path), or `null`. An `http` address on the
 * right host is upgraded to `https`. Addresses with a username or password,
 * an encoded slash, or a look-alike host (`cwwp2.dot.ca.gov.evil.example`,
 * `evil.example/cwwp2.dot.ca.gov`) are refused.
 */
export function pinImageUrl(raw: unknown, origin: string): string | null {
  if (typeof raw !== "string") return null;
  let url: URL;
  let pin: URL;
  try {
    url = new URL(raw.trim());
    pin = new URL(origin);
  } catch {
    return null;
  }
  if (url.protocol === "http:" && url.hostname === pin.hostname && !url.port) {
    url.protocol = "https:";
  }
  const pinPath = pin.pathname.endsWith("/") ? pin.pathname : `${pin.pathname}/`;
  if (
    url.protocol !== "https:" ||
    url.hostname !== pin.hostname ||
    url.port !== "" ||
    url.username !== "" ||
    url.password !== "" ||
    !url.pathname.startsWith(pinPath) ||
    /%2f|%5c|\.\.\//i.test(url.pathname)
  ) {
    return null;
  }
  return url.href;
}

function minutes(value: unknown): number | null {
  const n = toNumber(value);
  return n !== null && n > 0 && n <= 24 * 60 ? Math.round(n) : null;
}

function camera(
  providerId: CameraProviderId,
  fields: Omit<PublicCamera, "providerId">,
): PublicCamera {
  return { providerId, ...fields };
}

/**
 * Caltrans (California), one file per district: `{ data: [{ cctv: {...} }] }`.
 * Kept: `inService === "true"`, with a position and a still-image address on
 * `cwwp2.dot.ca.gov`. The leading token of `location.locationName`
 * ("TV102 -- I-580 : …") is the stable camera code.
 */
export function parseCaltransCctv(payload: unknown, district: number): PublicCamera[] {
  const out: PublicCamera[] = [];
  const seen = new Set<string>();
  for (const row of list(record(payload).data)) {
    const cctv = record(record(row).cctv);
    if (String(cctv.inService).toLowerCase() !== "true") continue;
    const location = record(cctv.location);
    const latitude = toNumber(location.latitude);
    const longitude = toNumber(location.longitude);
    if (latitude === null || longitude === null || !isUsableCoordinate(latitude, longitude)) {
      continue;
    }
    const still = record(record(cctv.imageData).static);
    const imageUrl = pinImageUrl(still.currentImageURL, CAMERA_PROVIDERS.caltrans.imageOrigin);
    if (!imageUrl) continue;

    const locationName = cleanText(location.locationName, 300);
    const match = /^([A-Za-z0-9_-]+)\s*--\s*(.*)$/.exec(locationName);
    const code = (match?.[1] ?? "").toLowerCase();
    const label = cleanText(match ? match[2] : locationName, MAX_NAME_LENGTH);
    const id = code ? `caltrans-d${district}-${code}` : `caltrans-d${district}-${out.length}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const place = cleanText(location.nearbyPlace, 60);
    const base = label || `Caltrans district ${district} camera`;
    out.push(
      camera("caltrans", {
        id,
        name: place ? `${base} (${place})` : base,
        latitude,
        longitude,
        imageUrl,
        refreshMinutes: minutes(still.currentImageUpdateFrequency),
      }),
    );
  }
  return out;
}

/**
 * Transport for London JamCams: an array of places whose `additionalProperties`
 * carry `available` and `imageUrl`. Kept: `available === "true"`, with a
 * position and a picture on TfL's own bucket (`jamcams.tfl.gov.uk`).
 */
export function parseTflJamCams(payload: unknown): PublicCamera[] {
  const out: PublicCamera[] = [];
  for (const place of Array.isArray(payload) ? payload : []) {
    const p = record(place);
    const props: Record<string, unknown> = {};
    for (const entry of list(p.additionalProperties)) {
      const e = record(entry);
      if (typeof e.key === "string") props[e.key] = e.value;
    }
    if (String(props.available).toLowerCase() !== "true") continue;
    const latitude = toNumber(p.lat);
    const longitude = toNumber(p.lon);
    if (latitude === null || longitude === null || !isUsableCoordinate(latitude, longitude)) {
      continue;
    }
    const imageUrl = pinImageUrl(props.imageUrl, CAMERA_PROVIDERS.tfl.imageOrigin);
    if (!imageUrl) continue;
    const rawId = typeof p.id === "string" ? p.id.replace(/^JamCams_/, "") : "";
    if (!/^[A-Za-z0-9._-]+$/.test(rawId)) continue;
    out.push(
      camera("tfl", {
        id: `tfl-${rawId}`,
        name: cleanText(p.commonName, MAX_NAME_LENGTH) || `London camera ${rawId}`,
        latitude,
        longitude,
        imageUrl,
        refreshMinutes: null,
      }),
    );
  }
  return out;
}

/**
 * Live Traffic NSW: a GeoJSON feature collection. `properties.href` is the
 * picture (on `webcams.transport.nsw.gov.au`); `properties.view` is a short
 * description of what the camera sees, `properties.title` its name. NSW
 * sometimes reuses `view` for a long works notice, so only a short one-line
 * `view` is used as the name.
 */
export function parseNswCameras(payload: unknown): PublicCamera[] {
  const out: PublicCamera[] = [];
  for (const feature of list(record(payload).features)) {
    const f = record(feature);
    const rawId = typeof f.id === "string" || typeof f.id === "number" ? String(f.id).trim() : "";
    if (!/^[A-Za-z0-9._-]+$/.test(rawId)) continue;
    const coordinates = record(f.geometry).coordinates;
    const lon = Array.isArray(coordinates) ? coordinates[0] : undefined;
    const lat = Array.isArray(coordinates) ? coordinates[1] : undefined;
    // Numbers only: Number(null) is 0, which would put a camera on the equator.
    if (typeof lat !== "number" || typeof lon !== "number" || !isUsableCoordinate(lat, lon)) {
      continue;
    }
    const props = record(f.properties);
    const imageUrl = pinImageUrl(props.href, CAMERA_PROVIDERS.nsw.imageOrigin);
    if (!imageUrl) continue;
    const view = typeof props.view === "string" ? props.view.trim() : "";
    const shortView = view.length > 0 && view.length <= 140 && !/[\r\n]/.test(view) ? view : "";
    out.push(
      camera("nsw", {
        id: `nsw-${rawId}`,
        name:
          cleanText(shortView || props.title, MAX_NAME_LENGTH) || `New South Wales camera ${rawId}`,
        latitude: lat,
        longitude: lon,
        imageUrl,
        refreshMinutes: null,
      }),
    );
  }
  return out;
}

/**
 * Fintraffic / Digitraffic road-weather cameras: a GeoJSON feature collection
 * of stations, each with `presets` (fixed views). One preset is one camera.
 * Kept: the station is `GATHERING` and the preset is `inCollection`. The
 * picture address is built from the preset id (`C` and seven digits, starting
 * with the station id), never read from the payload.
 */
export function parseDigitrafficStations(payload: unknown): PublicCamera[] {
  const out: PublicCamera[] = [];
  for (const feature of list(record(payload).features)) {
    const f = record(feature);
    const props = record(f.properties);
    const stationId = typeof props.id === "string" ? props.id.trim() : "";
    if (!/^C\d{5}$/.test(stationId)) continue;
    if (String(props.collectionStatus).toUpperCase() !== "GATHERING") continue;
    const coordinates = record(f.geometry).coordinates;
    const lon = Array.isArray(coordinates) ? coordinates[0] : undefined;
    const lat = Array.isArray(coordinates) ? coordinates[1] : undefined;
    if (typeof lat !== "number" || typeof lon !== "number" || !isUsableCoordinate(lat, lon)) {
      continue;
    }
    const stationName = cleanText(String(props.name ?? "").replace(/_/g, " "), MAX_NAME_LENGTH);
    for (const preset of list(props.presets)) {
      const pr = record(preset);
      if (pr.inCollection !== true) continue;
      const presetId = typeof pr.id === "string" ? pr.id.trim() : "";
      if (!/^C\d{7}$/.test(presetId) || !presetId.startsWith(stationId)) continue;
      out.push(
        camera("digitraffic", {
          id: `digitraffic-${presetId.toLowerCase()}`,
          name: stationName || `Finland road camera ${stationId}`,
          latitude: lat,
          longitude: lon,
          imageUrl: `${CAMERA_PROVIDERS.digitraffic.imageOrigin}${presetId}.jpg`,
          refreshMinutes: 10,
        }),
      );
    }
  }
  return out;
}

/**
 * DriveBC (British Columbia): an array of cameras. Kept: `is_on` and
 * `should_appear` are both true, the id is a positive integer and the position
 * is a GeoJSON point (`[longitude, latitude]`). The picture address is built
 * from the id. The agency's `credit` text is kept only when it names a
 * partner that supplied the picture ("Images courtesy of …"); operational
 * notes in the same field are dropped.
 */
export function parseDriveBcWebcams(payload: unknown): PublicCamera[] {
  const out: PublicCamera[] = [];
  for (const row of Array.isArray(payload) ? payload : []) {
    const r = record(row);
    if (r.is_on !== true || r.should_appear !== true) continue;
    const id = r.id;
    if (typeof id !== "number" || !Number.isSafeInteger(id) || id <= 0) continue;
    const coordinates = record(r.location).coordinates;
    const lon = Array.isArray(coordinates) ? coordinates[0] : undefined;
    const lat = Array.isArray(coordinates) ? coordinates[1] : undefined;
    if (typeof lat !== "number" || typeof lon !== "number" || !isUsableCoordinate(lat, lon)) {
      continue;
    }
    const credit = driveBcPartnerCredit(r.credit);
    out.push(
      camera("drivebc", {
        id: `drivebc-${id}`,
        name: cleanText(r.name, MAX_NAME_LENGTH) || `DriveBC camera ${id}`,
        latitude: lat,
        longitude: lon,
        imageUrl: `${CAMERA_PROVIDERS.drivebc.imageOrigin}${id}.jpg`,
        refreshMinutes: null,
        ...(credit ? { credit } : {}),
      }),
    );
  }
  return out;
}

/** The part of a DriveBC `credit` that credits a partner, as plain text, or `""`. */
export function driveBcPartnerCredit(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const text = cleanText(raw.replace(/<[^>]*>/g, " "), MAX_CREDIT_LENGTH);
  return /courtesy|provided by|presented in cooperation|city of|parks canada/i.test(text)
    ? text
    : "";
}
