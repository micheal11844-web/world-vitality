import type { GlobePin } from "../app/globe/globe-types";
import { fetchFloodingLocations, type FloodImpactLocation } from "./usgs-flood-impacts";
import { fetchNearbyShelters, type ShelterLocation } from "./fema-shelters";
import { logSecurity } from "./logger";

// Same shared demo location Disaster Monitoring's own page uses — see
// that page's own doc comment for why it's U.S.-only (National
// Weather Service has no coverage outside U.S. jurisdiction).
export const DISASTER_MONITORING_DEMO_LOCATION = {
  latitude: 34.0522,
  longitude: -118.2437,
  stateCode: "CA",
};

/** How long one outside service may take before the Globe gives up on that layer. */
export const LAYER_TIMEOUT_MS = 8000;
/** How long a good answer is reused. The sources update every few minutes at most. */
const CACHE_TTL_MS = 5 * 60 * 1000;

export type LiveLayerName = "floods" | "shelters";

export interface LiveLayerSources {
  floods: () => Promise<FloodImpactLocation[]>;
  shelters: () => Promise<ShelterLocation[]>;
}

export interface LiveLayersResult {
  pins: GlobePin[];
  /** Layers that errored or timed out (a layer that is simply not configured is not listed). */
  failed: LiveLayerName[];
}

/** Rejects if `promise` has not settled within `ms`. The timer never outlives the call. */
export function withDeadline<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timed out after ${ms} ms`)), ms);
  });
  return Promise.race([promise, deadline]).finally(() => clearTimeout(timer));
}

function cached<T>(load: () => Promise<T>): () => Promise<T> {
  let entry: { at: number; value: T } | null = null;
  return async () => {
    if (entry && Date.now() - entry.at < CACHE_TTL_MS) return entry.value;
    const value = await load();
    entry = { at: Date.now(), value };
    return value;
  };
}

const DEFAULT_SOURCES: LiveLayerSources = {
  floods: cached(() => fetchFloodingLocations(DISASTER_MONITORING_DEMO_LOCATION.stateCode)),
  shelters: cached(() =>
    fetchNearbyShelters(
      DISASTER_MONITORING_DEMO_LOCATION.latitude,
      DISASTER_MONITORING_DEMO_LOCATION.longitude,
    ),
  ),
};

/**
 * Disaster Monitoring's two point-based layers (flooding locations and
 * shelters) as Globe pins — the same pins `app/globe/page.tsx` used to build
 * inline while the page waited for the outside services. They now load after
 * the page is already on screen, through `/api/globe/live-layers`.
 *
 * Fire detections used to be a third layer here, but only for one demo
 * location (Los Angeles). They are now a worldwide layer with their own route
 * (`/api/globe/fires`, see `global-fires.ts`), because that data is large and
 * slow enough that it must not hold the floods and shelters back.
 *
 * Each layer is fetched at the same time as the others, with its own
 * deadline and its own try/catch — one slow or broken source must never
 * hold up or take down the rest, matching the graceful-degradation pattern
 * `disaster-monitoring/page.tsx` itself established. A fire layer that is
 * only missing its optional `NASA_FIRMS_MAP_KEY` is omitted silently, the
 * same as before. No resource-scoped filtering is needed (see the note in
 * `page.tsx`): these are public safety data, gated only by the session the
 * route requires.
 */
export async function loadLiveLayerPins({
  sources = DEFAULT_SOURCES,
  timeoutMs = LAYER_TIMEOUT_MS,
}: {
  sources?: LiveLayerSources;
  timeoutMs?: number;
} = {}): Promise<LiveLayersResult> {
  const failed: LiveLayerName[] = [];

  const run = async <T>(name: LiveLayerName, load: () => Promise<T[]>): Promise<T[]> => {
    try {
      return await withDeadline(load(), timeoutMs);
    } catch (err) {
      failed.push(name);
      logSecurity.error(`globe_${name}_fetch_failed`, err);
      return [];
    }
  };

  const [floods, shelters] = await Promise.all([
    run("floods", sources.floods),
    run("shelters", sources.shelters),
  ]);

  return { pins: buildLiveLayerPins({ floods, shelters }), failed };
}

export function buildLiveLayerPins({
  floods,
  shelters,
}: {
  floods: FloodImpactLocation[];
  shelters: ShelterLocation[];
}): GlobePin[] {
  return [
    ...floods
      .filter((f) => f.latitude !== null && f.longitude !== null)
      .map((f) => ({
        id: `disaster-monitoring-flood-${f.id}`,
        label: f.name,
        latitude: f.latitude as number,
        longitude: f.longitude as number,
        workspaceKey: "disaster-monitoring-flood",
        workspaceLabel: "Disaster Monitoring",
        href: "/workspaces/disaster-monitoring",
      })),
    ...shelters.map((s) => ({
      id: `disaster-monitoring-shelter-${s.id}`,
      label: s.name,
      latitude: s.latitude,
      longitude: s.longitude,
      workspaceKey: "disaster-monitoring-shelter",
      workspaceLabel: "Disaster Monitoring",
      href: "/workspaces/disaster-monitoring",
    })),
  ];
}
