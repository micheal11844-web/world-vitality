import { cachedLoader, parseFirmsCsv, type FireDetectionPoint } from "@world-vitality/hazard-feeds";
import { logApplication } from "./logger";

/**
 * One day of NASA FIRMS satellite heat detections for the whole world
 * (VIIRS, near-real-time), for the Globe's fire layer. Same data source, key
 * and caveats as `nasa-firms.ts` (read its note: these are thermal anomalies,
 * not confirmed fires), but a world query instead of a one-degree box.
 *
 * The key is read from `NASA_FIRMS_MAP_KEY` only. It sits inside the request
 * address, so the address is **never** logged or put in an error message.
 *
 * A world day is a large download (several megabytes) and the satellites only
 * add new passes every few hours, so a good answer is kept for 30 minutes and
 * shared between everyone who opens the Globe in that time. If a refresh
 * fails, the older answer is used.
 */

const FIRMS_AREA_API = "https://firms.modaps.eosdis.nasa.gov/api/area/csv";
const SOURCE = "VIIRS_SNPP_NRT";
const TTL_MS = 30 * 60 * 1000;
export const WORLD_FIRES_TIMEOUT_MS = 25_000;
/** A world day is roughly 10–25 MB; anything far past that is not what we asked for. */
const MAX_BODY_BYTES = 80 * 1024 * 1024;

async function fetchWorldDetections(): Promise<FireDetectionPoint[]> {
  const mapKey = process.env.NASA_FIRMS_MAP_KEY;
  if (!mapKey) {
    throw new Error(
      "NASA_FIRMS_MAP_KEY is not configured. Set it in Vercel's environment variables to enable fire detection data.",
    );
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WORLD_FIRES_TIMEOUT_MS);
  try {
    const response = await fetch(
      `${FIRMS_AREA_API}/${encodeURIComponent(mapKey)}/${SOURCE}/world/1`,
      { signal: controller.signal, cache: "no-store" },
    );
    if (!response.ok) throw new Error(`NASA FIRMS answered ${response.status}`);
    const declared = Number(response.headers.get("content-length"));
    if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
      throw new Error("NASA FIRMS answer is larger than expected");
    }
    const points = parseFirmsCsv(await response.text());
    logApplication.info("globe_world_fires_loaded", { detections: points.length });
    return points;
  } finally {
    clearTimeout(timer);
  }
}

export const loadWorldFireDetections = cachedLoader(fetchWorldDetections, TTL_MS, {
  onStale: (err) => logApplication.error("globe_world_fires_using_stale_answer", err),
});

/** True when the failure is only that the optional key is not set (not a broken service). */
export function isFireKeyMissing(err: unknown): boolean {
  return err instanceof Error && err.message.includes("NASA_FIRMS_MAP_KEY");
}
