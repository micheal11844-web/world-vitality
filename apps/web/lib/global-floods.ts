import {
  cachedLoader,
  gdacsFloodListUrl,
  parseGdacsFloods,
  type GlobeFlood,
} from "@world-vitality/hazard-feeds";
import { logApplication } from "./logger";

/**
 * Recent flood events for the whole world, for the Globe's flood layer, from
 * GDACS (the UN and European Commission's Global Disaster Alert and
 * Coordination System). Public, no key. Read `packages/hazard-feeds/src/floods.ts`
 * first: it explains what these events are (model estimates of large floods, not
 * ground reports or official warnings) and why a changed answer must fail loudly.
 *
 * The list is about 100–300 KB and changes a few times a day, so a good answer is
 * kept for 15 minutes and shared by everyone opening the Globe in that time. If a
 * load fails but an older good answer exists, the older one is used and the
 * failure is logged; if there is none, the layer reports itself as unavailable
 * (never as "no floods").
 *
 * Logs carry counts only: how many features and flood events GDACS sent, how many
 * were skipped as unusable and how many are shown. A sudden change in those
 * numbers is how a change in GDACS's format would show up.
 */

const TTL_MS = 15 * 60 * 1000;
export const WORLD_FLOODS_TIMEOUT_MS = 12_000;
/** The real list is a few hundred KB; far beyond that is not what was asked for. */
const MAX_BODY_BYTES = 8 * 1024 * 1024;

const REQUEST_HEADERS = {
  "User-Agent": "World-Vitality-Globe (github.com/micheal11844-web/world-vitality)",
  Accept: "application/json",
};

async function fetchWorldFloods(): Promise<GlobeFlood[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WORLD_FLOODS_TIMEOUT_MS);
  try {
    const response = await fetch(gdacsFloodListUrl(new Date()), {
      headers: REQUEST_HEADERS,
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`GDACS answered ${response.status}`);
    const declared = Number(response.headers.get("content-length"));
    if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
      throw new Error("GDACS answer is larger than expected");
    }
    const text = await response.text();
    if (text.length > MAX_BODY_BYTES) throw new Error("GDACS answer is larger than expected");
    const result = parseGdacsFloods(JSON.parse(text) as unknown);
    logApplication.info("globe_world_floods_loaded", {
      features: result.features,
      floodEvents: result.floodEvents,
      skipped: result.skipped,
      shown: result.floods.length,
    });
    return result.floods;
  } finally {
    clearTimeout(timer);
  }
}

export const loadWorldFloods = cachedLoader(fetchWorldFloods, TTL_MS, {
  onStale: (err) => logApplication.error("globe_world_floods_using_stale_answer", err),
});
