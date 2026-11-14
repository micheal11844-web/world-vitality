import type { FloodAlert, GlobeFire, GlobeFlood, PublicCamera } from "@world-vitality/hazard-feeds";

export type { FloodAlert, GlobeFire, GlobeFlood, PublicCamera };

/**
 * The Globe's shared, browser-safe shapes. They live apart from
 * `globe-viewer.tsx` so the instant flat-map preview, the page shell and the
 * server can all use them without pulling the 3D engine's module graph in.
 */
export interface GlobePin {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  /** Which workspace this pin belongs to — drives pin color and the
   *  "open in workspace" link, not fetched/rendered here directly. */
  workspaceKey: string;
  workspaceLabel: string;
  href: string;
}

export const WORKSPACE_PIN_COLOR: Record<string, string> = {
  agriculture: "#1d6e56", // --wv-color-accent-500, this app's core green
  insurance: "#b3401f", // --wv-color-critical-500
  "government-ngos": "#2563a8", // a distinct blue, matches the logo's globe
  // Disaster Monitoring's three point-based layers (BUILD_PLAN "STAGE
  // — GLOBE VIEW: DISASTER MONITORING LAYERS") get their own distinct
  // colors rather than sharing one, since a flood pin and a fire
  // detection pin next to each other on the map need to read as
  // different things at a glance.
  "disaster-monitoring-flood": "#2563a8", // same blue as water elsewhere in this app
  "disaster-monitoring-shelter": "#1d6e56", // same green as "safe"/positive elsewhere
  "disaster-monitoring-fire": "#d4652f", // --wv-color-critical-400, warm/urgent
};

export function pinColor(workspaceKey: string): string {
  return WORKSPACE_PIN_COLOR[workspaceKey] ?? "#666666";
}

/** What the person has opened on the Globe: a satellite heat detection, a flood event or a public camera. */
export type GlobeSelection =
  | { kind: "fire"; id: string }
  | { kind: "flood"; id: string }
  /** `fromFireId` is set when the camera was opened from a fire's "cameras nearby" list. */
  | { kind: "camera"; id: string; fromFireId?: string };

/** Marker colours for the layers drawn from the live fire, flood and camera feeds. */
export const FIRE_COLOR = "#e8501a";
export const FLOOD_COLOR = "#2f7fe6";
export const CAMERA_COLOR = "#17b3a3";
export const SELECTED_COLOR = "#ffd23f";

/** Marker diameter in pixels for a fire area: bigger where more detections were folded together. */
export function fireMarkerSize(count: number): number {
  return Math.round(7 + Math.min(7, Math.log2(Math.max(1, count))));
}

/** Marker diameter in pixels for a flood event: bigger for a higher GDACS alert level. */
export function floodMarkerSize(alert: FloodAlert): number {
  return alert === "red" ? 13 : alert === "orange" ? 10 : 8;
}

/** The marker id Cesium and the flat map use for a selection (`fire:…` / `camera:…`). */
export function markerId(selection: Pick<GlobeSelection, "kind" | "id">): string {
  return `${selection.kind}:${selection.id}`;
}
