import type { GlobePin } from "../app/globe/globe-types";
import { fetchFloodingLocations, type FloodImpactLocation } from "./usgs-flood-impacts";
import { fetchNearbyShelters, type ShelterLocation } from "./fema-shelters";
import { fetchActiveFireDetections, type FireDetection } from "./nasa-firms";
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

export type LiveLayerName = "floods" | "shelters" | "fires";

export interface LiveLayerSources {
  floods: () => Promise<FloodImpactLocation[]>;
  shelters: () => Promise<ShelterLocation[]>;
  fires: () => Promise<FireDetection[]>;
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
  fires: cached(() =>
    fetchActiveFireDetections(
      DISASTER_MONITORING_DEMO_LOCATION.latitude,
      DISASTER_MONITORING_DEMO_LOCATION.longitude,
    ),
  ),
};

/** True when fire detection is simply not set up (no `NASA_FIRMS_MAP_KEY`), as opposed to broken. */
function isFireNotConfigured(err: unknown): boolean {
  return err instanceof Error && err.message.includes("NASA_FIRMS_MAP_KEY");
}

/**
 * Disaster Monitoring's three point-based layers as Globe pins — the same
 * pins `app/globe/page.tsx` used to build inline while the page waited for
 * the outside services. They now load after the page is already on screen,
 * through `/api/globe/live-layers`.
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
  fireLabel,
  sources = DEFAULT_SOURCES,
  timeoutMs = LAYER_TIMEOUT_MS,
}: {
  fireLabel: (confidence: string) => string;
  sources?: LiveLayerSources;
  timeoutMs?: number;
}): Promise<LiveLayersResult> {
  const failed: LiveLayerName[] = [];

  const run = async <T>(name: LiveLayerName, load: () => Promise<T[]>): Promise<T[]> => {
    try {
      return await withDeadline(load(), timeoutMs);
    } catch (err) {
      if (name === "fires" && isFireNotConfigured(err)) return [];
      failed.push(name);
      logSecurity.error(`globe_${name}_fetch_failed`, err);
      return [];
    }
  };

  const [floods, shelters, fires] = await Promise.all([
    run("floods", sources.floods),
    run("shelters", sources.shelters),
    run("fires", sources.fires),
  ]);

  return { pins: buildLiveLayerPins({ floods, shelters, fires, fireLabel }), failed };
}

export function buildLiveLayerPins({
  floods,
  shelters,
  fires,
  fireLabel,
}: {
  floods: FloodImpactLocation[];
  shelters: ShelterLocation[];
  fires: FireDetection[];
  fireLabel: (confidence: string) => string;
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
    ...fires.map((f, i) => ({
      id: `disaster-monitoring-fire-${i}`,
      // The confidence is FIRMS's own wording and is shown as issued.
      label: fireLabel(f.confidence),
      latitude: f.latitude,
      longitude: f.longitude,
      workspaceKey: "disaster-monitoring-fire",
      workspaceLabel: "Disaster Monitoring",
      href: "/workspaces/disaster-monitoring",
    })),
  ];
}
