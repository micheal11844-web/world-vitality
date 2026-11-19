import type { GlobeFire } from "./fire-watch.js";
import type { FloodAlert, GlobeFlood } from "./floods.js";

/**
 * The order of the Globe's text list of events (the way in for a keyboard or
 * screen-reader user, who cannot pick a dot drawn on the 3D canvas).
 *
 * Floods: the highest GDACS alert first (red, orange, green), the most recent
 * start first within a level. Heat detections: the strongest heat output
 * first (an unknown output last), then the most detections folded together;
 * only the first `max` are listed, since a day can bring thousands and the
 * list is for finding the ones that matter, not for browsing all of them.
 * Neither function changes the list it is given.
 */
const ALERT_RANK: Record<FloodAlert, number> = { red: 0, orange: 1, green: 2 };

export function rankFloods(floods: readonly GlobeFlood[]): GlobeFlood[] {
  return [...floods].sort(
    (a, b) =>
      ALERT_RANK[a.alert] - ALERT_RANK[b.alert] ||
      Date.parse(b.startedAt) - Date.parse(a.startedAt) ||
      a.id.localeCompare(b.id),
  );
}

export function rankFires(fires: readonly GlobeFire[], max: number): GlobeFire[] {
  return [...fires]
    .sort(
      (a, b) =>
        (b.maxFrp ?? -1) - (a.maxFrp ?? -1) || b.count - a.count || a.id.localeCompare(b.id),
    )
    .slice(0, Math.max(0, max));
}
