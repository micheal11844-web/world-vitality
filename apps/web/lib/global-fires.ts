import { cachedLoader, parseFirmsCsv, type FireDetectionPoint } from "@world-vitality/hazard-feeds";
import { logApplication } from "./logger";

/**
 * One day of NASA FIRMS satellite heat detections for the whole world
 * (VIIRS, near-real-time, from three satellites), for the Globe's fire layer. Same data source, key
 * and caveats as `nasa-firms.ts` (read its note: these are thermal anomalies,
 * not confirmed fires), but a world query instead of a one-degree box.
 *
 * The key is read from `NASA_FIRMS_MAP_KEY` only. It sits inside the request
 * address, so the address is **never** logged or put in an error message.
 *
 * **Why three satellites.** One satellite sees a given place only about twice a
 * day, so a fire that starts just after it passes would wait many hours to
 * appear. Suomi NPP, NOAA-20 and NOAA-21 fly the same kind of instrument in
 * staggered orbits, so together they look more often and a new fire shows up
 * sooner. NASA says detections reach FIRMS up to about 3 hours after a pass,
 * which no change here can shorten: this is a heat-detection layer, not a
 * live view, and the panel says when the latest pass was.
 *
 * A world day is a large download (several megabytes each) and new passes only
 * arrive every so often, so a good answer is kept for 10 minutes and shared
 * between everyone who opening the Globe in that time. If one satellite's file
 * cannot be read the others are still used (the point is to show what we can);
 * only if none can is it a failure, and then the older answer is used if there
 * is one.
 */

const FIRMS_AREA_API = "https://firms.modaps.eosdis.nasa.gov/api/area/csv";
const SOURCES = ["VIIRS_SNPP_NRT", "VIIRS_NOAA20_NRT", "VIIRS_NOAA21_NRT"] as const;
const TTL_MS = 10 * 60 * 1000;
export const WORLD_FIRES_TIMEOUT_MS = 25_000;
/** A world day is roughly 10–25 MB; anything far past that is not what we asked for. */
const MAX_BODY_BYTES = 80 * 1024 * 1024;

async function fetchOneSource(
  mapKey: string,
  source: (typeof SOURCES)[number],
  signal: AbortSignal,
): Promise<FireDetectionPoint[]> {
  const response = await fetch(
    `${FIRMS_AREA_API}/${encodeURIComponent(mapKey)}/${source}/world/1`,
    {
      signal,
      cache: "no-store",
    },
  );
  if (!response.ok) throw new Error(`NASA FIRMS answered ${response.status} for ${source}`);
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    throw new Error(`NASA FIRMS answer for ${source} is larger than expected`);
  }
  return parseFirmsCsv(await response.text());
}

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
    const results = await Promise.allSettled(
      SOURCES.map((source) => fetchOneSource(mapKey, source, controller.signal)),
    );
    const points: FireDetectionPoint[] = [];
    const failedSources: string[] = [];
    let firstFailure: unknown = null;
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        for (const point of result.value) points.push(point);
      } else {
        failedSources.push(SOURCES[index] as string);
        firstFailure ??= result.reason;
      }
    });
    // Nothing at all from any satellite is a failure (so the older answer is
    // kept and the page says so); some of them is a good-enough answer.
    if (failedSources.length === SOURCES.length) throw firstFailure;
    logApplication.info("globe_world_fires_loaded", {
      detections: points.length,
      failedSources: failedSources.join(",") || "none",
    });
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
