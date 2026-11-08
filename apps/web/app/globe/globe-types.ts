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
