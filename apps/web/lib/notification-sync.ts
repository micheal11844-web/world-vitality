import {
  ALERT_SYNC_INTERVAL_MS,
  NOTIFICATION_RETENTION_DAYS,
  homePlaceLabel,
  isNwsCoverageCountry,
  isSyncDue,
  officialAlertToNotification,
  visibleNotifications,
  type NewNotification,
  type Notification,
  type NotificationSettings,
} from "@world-vitality/identity-service";
import { getAccountService } from "./account";
import { logApplication } from "./logger";
import { NwsCoverageError, fetchActiveAlerts } from "./nws-alerts";

/**
 * What the last check of official alerts could and couldn't tell the
 * user — shown on the Notification Center so an empty inbox is never
 * mistaken for "all clear" when no source actually covers them.
 */
export type AlertCheckStatus =
  | { kind: "no_place" }
  | { kind: "out_of_coverage"; place: string }
  | { kind: "checked"; place: string; checkedAt: string | null }
  | { kind: "failed"; place: string; lastCheckedAt: string | null };

/**
 * Brings the user's official alerts up to date for their home place,
 * at most once per `minGapMs` (default 10 minutes) — called when the
 * bell polls, the Notification Center opens, or the Dashboard loads.
 *
 * **There is no background job.** Alerts are only checked while someone
 * has World Vitality open; nothing is pushed to a phone, SMS or inbox.
 * The Notification Center says so in plain words.
 *
 * Source: the U.S. National Weather Service (`nws-alerts.ts`), U.S. and
 * territories only. Outside coverage, or with no home place, this
 * returns that status and leaves any old alerts ended rather than
 * pretending to have checked.
 *
 * A failed fetch never ends or hides alerts already in the inbox: the
 * "end alerts the agency no longer lists" step runs only after a
 * *successful* fetch.
 *
 * Throws only on a database failure; callers decide whether to fail
 * open (the bell and Dashboard do).
 */
export async function syncOfficialAlerts(
  userId: string,
  options: { minGapMs?: number; now?: Date } = {},
): Promise<AlertCheckStatus> {
  const account = getAccountService();
  const now = options.now ?? new Date();
  const minGapMs = options.minGapMs ?? ALERT_SYNC_INTERVAL_MS;

  const [prefs, settings] = await Promise.all([
    account.getPreferences(userId),
    account.getNotificationSettings(userId),
  ]);
  const place = prefs.homePlace;
  const due = isSyncDue(settings.alertsSyncedAt, now, minGapMs);

  if (!place) {
    if (due) {
      await account.expireOfficialNotificationsExcept(userId, [], now);
      await account.markAlertsSynced(userId, now);
    }
    return { kind: "no_place" };
  }

  const label = homePlaceLabel(place);
  const coverage = isNwsCoverageCountry(place.country);

  if (coverage === false) {
    if (due) {
      await account.expireOfficialNotificationsExcept(userId, [], now);
      await account.markAlertsSynced(userId, now);
    }
    return { kind: "out_of_coverage", place: label };
  }

  if (!due) {
    return { kind: "checked", place: label, checkedAt: settings.alertsSyncedAt };
  }

  let items: NewNotification[];
  try {
    const alerts = await fetchActiveAlerts(place.latitude, place.longitude);
    items = alerts
      .map((alert) => officialAlertToNotification(alert, now))
      .filter((item): item is NewNotification => item !== null);
  } catch (err) {
    if (err instanceof NwsCoverageError) {
      // Country was unknown, and NWS says the point is outside coverage.
      return { kind: "out_of_coverage", place: label };
    }
    // Never log the coordinates or place name — only that a check failed.
    logApplication.error("official_alert_check_failed", err);
    return { kind: "failed", place: label, lastCheckedAt: settings.alertsSyncedAt };
  }

  await account.createNotifications(userId, items, now);
  await account.expireOfficialNotificationsExcept(
    userId,
    items.map((item) => item.dedupeKey as string),
    now,
  );
  await account.markAlertsSynced(userId, now);
  await account.pruneNotifications(
    userId,
    new Date(now.getTime() - NOTIFICATION_RETENTION_DAYS * 24 * 60 * 60 * 1000),
  );
  return { kind: "checked", place: label, checkedAt: now.toISOString() };
}

/** The inbox as the user should see it right now, plus their settings. */
export async function loadInbox(
  userId: string,
  now: Date = new Date(),
): Promise<{ visible: Notification[]; settings: NotificationSettings }> {
  const account = getAccountService();
  const [all, settings] = await Promise.all([
    account.listNotifications(userId, { now }),
    account.getNotificationSettings(userId),
  ]);
  return { visible: visibleNotifications(all, settings, now), settings };
}

/**
 * Best-effort notify: adds a notification for `userId` and swallows any
 * failure. A notification is a courtesy layered on top of an action that
 * already succeeded (a comment posted, an invite accepted) — it must
 * never make that action fail.
 */
export async function notifyUser(userId: string, item: NewNotification): Promise<void> {
  try {
    await getAccountService().createNotifications(userId, [item]);
  } catch (err) {
    logApplication.error("notify_user_failed", err, { source: item.source });
  }
}
