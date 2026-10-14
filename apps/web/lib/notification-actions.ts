"use server";

import { revalidatePath } from "next/cache";
import {
  MANUAL_SYNC_MIN_GAP_MS,
  isOfficialMinTier,
  type OfficialMinTier,
} from "@world-vitality/identity-service";
import { getAccountService } from "./account";
import { getSessionUserId } from "./get-session-user-id";
import { logApplication } from "./logger";
import { syncOfficialAlerts } from "./notification-sync";

const SIGN_IN_AGAIN = "Please sign in again to continue.";
const GENERIC_ERROR = "Something went wrong. Please try again.";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface NotificationActionResult {
  ok: boolean;
  error?: string;
}

/**
 * Every action here resolves the user from the session itself and
 * scopes its write to that user in the query (`AccountService` takes
 * the userId on every call) — an id from the browser can never touch
 * someone else's notification.
 */

export async function markNotificationReadAction(id: string): Promise<NotificationActionResult> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: SIGN_IN_AGAIN };
  if (typeof id !== "string" || !UUID.test(id)) return { ok: false, error: GENERIC_ERROR };
  try {
    await getAccountService().markNotificationRead(userId, id);
    revalidatePath("/notifications");
    return { ok: true };
  } catch (err) {
    logApplication.error("notification_mark_read_failed", err);
    return { ok: false, error: GENERIC_ERROR };
  }
}

export async function markAllNotificationsReadAction(): Promise<NotificationActionResult> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: SIGN_IN_AGAIN };
  try {
    await getAccountService().markAllNotificationsRead(userId);
    revalidatePath("/notifications");
    return { ok: true };
  } catch (err) {
    logApplication.error("notification_mark_all_read_failed", err);
    return { ok: false, error: GENERIC_ERROR };
  }
}

export async function dismissNotificationAction(id: string): Promise<NotificationActionResult> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: SIGN_IN_AGAIN };
  if (typeof id !== "string" || !UUID.test(id)) return { ok: false, error: GENERIC_ERROR };
  try {
    await getAccountService().dismissNotification(userId, id);
    revalidatePath("/notifications");
    return { ok: true };
  } catch (err) {
    logApplication.error("notification_dismiss_failed", err);
    return { ok: false, error: GENERIC_ERROR };
  }
}

/**
 * "Check again": forces a re-check of official alerts, but no more than
 * once a minute so the button can't be used to hammer the weather
 * service. Within the minute it simply reports the last check.
 */
export async function checkAlertsNowAction(): Promise<NotificationActionResult> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: SIGN_IN_AGAIN };
  try {
    const status = await syncOfficialAlerts(userId, { minGapMs: MANUAL_SYNC_MIN_GAP_MS });
    revalidatePath("/notifications");
    if (status.kind === "failed") {
      return { ok: false, error: "Couldn't reach the weather service just now. Please try again." };
    }
    return { ok: true };
  } catch (err) {
    logApplication.error("notification_check_now_failed", err);
    return { ok: false, error: GENERIC_ERROR };
  }
}

export async function saveNotificationSettingsAction(settings: {
  officialMinTier: OfficialMinTier;
  collaborationEnabled: boolean;
}): Promise<NotificationActionResult> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: SIGN_IN_AGAIN };
  if (
    !isOfficialMinTier(settings?.officialMinTier) ||
    typeof settings.collaborationEnabled !== "boolean"
  ) {
    return { ok: false, error: GENERIC_ERROR };
  }
  try {
    await getAccountService().saveNotificationSettings(userId, {
      officialMinTier: settings.officialMinTier,
      collaborationEnabled: settings.collaborationEnabled,
    });
    revalidatePath("/notifications");
    revalidatePath("/settings");
    return { ok: true };
  } catch (err) {
    logApplication.error("notification_settings_save_failed", err);
    return { ok: false, error: "Couldn't save your notification settings. Please try again." };
  }
}
