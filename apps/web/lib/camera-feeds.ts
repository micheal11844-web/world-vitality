import {
  CAMERA_PROVIDER_IDS,
  parseCaltransCctv,
  parseDigitrafficStations,
  parseDriveBcWebcams,
  parseNswCameras,
  parseTflJamCams,
  cachedLoader,
  type CameraProviderId,
  type PublicCamera,
} from "@world-vitality/hazard-feeds";
import { logApplication } from "./logger";

/**
 * Loads the public camera lists from the five agencies the Globe knows about
 * (see `packages/hazard-feeds/src/providers.ts` for why these and no others).
 *
 * Only the *lists* come through the server: camera names, positions and the
 * agency's own picture address. The pictures themselves are never fetched,
 * copied or stored here; the viewer's browser loads a picture directly from
 * the agency, and only when that viewer opens a camera.
 *
 * Every provider is fetched at the same time, with its own deadline and its
 * own try/catch, so one agency being down only removes that agency. A good
 * list is kept for 15 minutes (the cameras themselves rarely change), and if
 * a refresh fails the older list is used rather than none.
 *
 * **Honest limit:** these feed shapes could not be fetched from the build
 * environment, so the readers in `hazard-feeds/src/cameras.ts` follow the
 * agencies' published formats and are tested on sample payloads, not live
 * ones. A provider that returns a list but yields **zero** usable cameras is
 * logged as `globe_cameras_empty` so a changed format is easy to spot in the
 * logs.
 */

export const CAMERA_FEED_TIMEOUT_MS = 12_000;
const LIST_TTL_MS = 15 * 60 * 1000;
const USER_AGENT = "WorldVitality/1.0 (+https://world-vitality.vercel.app)";
/** California's twelve Caltrans districts. */
const CALTRANS_DISTRICTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

async function getJson(url: string, extraHeaders: Record<string, string> = {}): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CAMERA_FEED_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT, ...extraHeaders },
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`${new URL(url).hostname} answered ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchCaltrans(): Promise<PublicCamera[]> {
  const results = await Promise.allSettled(
    CALTRANS_DISTRICTS.map(async (district) => {
      const code = String(district).padStart(2, "0");
      const payload = await getJson(
        `https://cwwp2.dot.ca.gov/data/d${district}/cctv/cctvStatusD${code}.json`,
      );
      return parseCaltransCctv(payload, district);
    }),
  );
  const cameras = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  const rejected = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
  if (rejected.length === results.length) throw rejected[0]?.reason ?? new Error("no district");
  if (rejected.length > 0) {
    logApplication.warn("globe_caltrans_districts_failed", {
      failed: rejected.length,
      of: results.length,
    });
  }
  return cameras;
}

export type CameraSources = Record<CameraProviderId, () => Promise<PublicCamera[]>>;

function cachedSource(id: CameraProviderId, load: () => Promise<PublicCamera[]>) {
  return cachedLoader(load, LIST_TTL_MS, {
    onStale: (err) => logApplication.error("globe_cameras_using_stale_list", err, { provider: id }),
  });
}

const DEFAULT_SOURCES: CameraSources = {
  caltrans: cachedSource("caltrans", fetchCaltrans),
  tfl: cachedSource("tfl", async () =>
    parseTflJamCams(await getJson("https://api.tfl.gov.uk/Place/Type/JamCam")),
  ),
  nsw: cachedSource("nsw", async () =>
    parseNswCameras(await getJson("https://data.livetraffic.com/cameras/traffic-cam.json")),
  ),
  digitraffic: cachedSource("digitraffic", async () =>
    parseDigitrafficStations(
      await getJson("https://tie.digitraffic.fi/api/weathercam/v1/stations", {
        // Digitraffic asks every client to identify itself.
        "Digitraffic-User": "WorldVitality",
      }),
    ),
  ),
  drivebc: cachedSource("drivebc", async () =>
    parseDriveBcWebcams(await getJson("https://www.drivebc.ca/api/webcams/")),
  ),
};

export interface CameraLoadResult {
  cameras: PublicCamera[];
  /** Providers whose list could not be loaded right now. */
  failed: CameraProviderId[];
}

/** Loads every provider's camera list; never throws. */
export async function loadCameras(
  sources: CameraSources = DEFAULT_SOURCES,
): Promise<CameraLoadResult> {
  const failed: CameraProviderId[] = [];
  const lists = await Promise.all(
    CAMERA_PROVIDER_IDS.map(async (id) => {
      try {
        const list = await sources[id]();
        if (list.length === 0) {
          logApplication.warn("globe_cameras_empty", { provider: id });
        } else {
          logApplication.info("globe_cameras_loaded", { provider: id, count: list.length });
        }
        return list;
      } catch (err) {
        failed.push(id);
        logApplication.error("globe_cameras_failed", err, { provider: id });
        return [];
      }
    }),
  );
  const seen = new Set<string>();
  const cameras: PublicCamera[] = [];
  for (const camera of lists.flat()) {
    if (seen.has(camera.id)) continue;
    seen.add(camera.id);
    cameras.push(camera);
  }
  return { cameras, failed };
}
