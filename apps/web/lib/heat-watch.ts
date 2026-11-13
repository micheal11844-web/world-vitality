import { after } from "next/server";
import { heatNearPlaces, type WatchedPlace } from "@world-vitality/hazard-feeds";
import {
  HEAT_SYNC_INTERVAL_MS,
  HEAT_WATCH_MAX_PLACES,
  HEAT_WATCH_RADIUS_KM,
  heatNearPlaceNotification,
  homePlaceLabel,
  isSyncDue,
} from "@world-vitality/identity-service";
import { getAccountService } from "./account";
import { isFireKeyMissing, loadWorldFireDetections } from "./global-fires";
import { logApplication } from "./logger";
import { loadWatchedPlaces } from "./watched-places";

/**
 * Tells a person when a satellite sees heat near a place they saved (Decision #033).
 *
 * "Places" are the person's home place and every field, insured property and
 * monitored location they are allowed to open (`watched-places.ts`). A satellite
 * heat detection (NASA FIRMS) within `HEAT_WATCH_RADIUS_KM` of one becomes a
 * notification, at most one per place per day, linking to the Globe on the
 * detection (where the nearest public cameras and the call button are).
 *
 * **There is no background job, same as official alerts.** The check runs while
 * someone has World Vitality open: the header bell calls it every few minutes,
 * and it is skipped unless the last check was 15 minutes ago or more. Nothing is
 * pushed to a phone, SMS or email. On the free Vercel plan a scheduled job can
 * run at most once a day, which is too slow to be worth building here.
 *
 * Order of work, and why:
 *  1. Cheap checks first (the person's switch, the 15-minute throttle, whether
 *     the NASA key is set), so most calls read one row and stop.
 *  2. The slot is claimed *before* the work, so two tabs polling together do not
 *     both run it. If the work then fails, the next try is 15 minutes later:
 *     a failure is never retried in a tight loop against NASA.
 *  3. The person's places are read now, while the request's session is available.
 *  4. The heavy part (the world file, the comparison, the notifications) runs
 *     after the response has gone, so the bell never waits for NASA. The new
 *     notification shows on the bell's next refresh.
 *
 * Never logs a place name or coordinates: only counts.
 */
export type HeatWatchStart =
  | { kind: "off" }
  | { kind: "not_due" }
  | { kind: "not_configured" }
  | { kind: "no_places" }
  | { kind: "started"; places: number };

export async function startHeatWatch(
  userId: string,
  options: { now?: Date } = {},
): Promise<HeatWatchStart> {
  const now = options.now ?? new Date();
  const account = getAccountService();

  const settings = await account.getNotificationSettings(userId);
  if (!settings.heatWatchEnabled) return { kind: "off" };
  if (!isSyncDue(settings.heatSyncedAt, now, HEAT_SYNC_INTERVAL_MS)) return { kind: "not_due" };
  if (!process.env.NASA_FIRMS_MAP_KEY) return { kind: "not_configured" };

  await account.markHeatSynced(userId, now);

  const [prefs, saved] = await Promise.all([account.getPreferences(userId), loadWatchedPlaces()]);
  const places: WatchedPlace[] = [];
  if (prefs.homePlace) {
    places.push({
      id: "home",
      label: homePlaceLabel(prefs.homePlace),
      latitude: prefs.homePlace.latitude,
      longitude: prefs.homePlace.longitude,
    });
  }
  for (const pin of saved) {
    places.push({
      id: pin.id,
      label: pin.label,
      latitude: pin.latitude,
      longitude: pin.longitude,
    });
  }
  if (places.length > HEAT_WATCH_MAX_PLACES) {
    logApplication.warn("heat_watch_places_capped", {
      places: places.length,
      checked: HEAT_WATCH_MAX_PLACES,
    });
    places.length = HEAT_WATCH_MAX_PLACES;
  }
  if (places.length === 0) return { kind: "no_places" };

  after(() => runHeatWatch(userId, places, now));
  return { kind: "started", places: places.length };
}

/** The heavy part of the check. Never throws: it runs after the response has been sent. */
async function runHeatWatch(userId: string, places: WatchedPlace[], now: Date): Promise<void> {
  try {
    const detections = await loadWorldFireDetections();
    const near = heatNearPlaces(detections, places, { radiusKm: HEAT_WATCH_RADIUS_KM, now });
    if (near.length > 0) {
      await getAccountService().createNotifications(
        userId,
        near.map((hit) =>
          heatNearPlaceNotification({
            placeId: hit.place.id,
            placeLabel: hit.place.label,
            distanceKm: hit.nearestKm,
            detections: hit.detections,
            passAt: hit.nearest.acquiredAt,
            latitude: hit.nearest.latitude,
            longitude: hit.nearest.longitude,
            now,
          }),
        ),
        now,
      );
    }
    logApplication.info("heat_watch_checked", { places: places.length, withHeat: near.length });
  } catch (err) {
    if (isFireKeyMissing(err)) return;
    logApplication.error("heat_watch_failed", err);
  }
}
