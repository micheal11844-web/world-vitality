import type { Metadata } from "next";
import {
  groupByTier,
  TIER_ORDER,
  type Notification,
  type NotificationTier,
} from "@world-vitality/identity-service";
import { localizeNotificationText, type Translator } from "@world-vitality/i18n";
import { getTranslator } from "../../lib/i18n/server";
import { requireSession } from "../../lib/require-session";
import { logApplication, logTelemetry } from "../../lib/logger";
import { loadInbox, syncOfficialAlerts, type AlertCheckStatus } from "../../lib/notification-sync";
import {
  NotificationsView,
  type AlertStatusView,
  type NotificationItemView,
} from "./notifications-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Notifications — World Vitality",
  robots: { index: false },
};

function toItemView(n: Notification, now: Date, translator: Translator): NotificationItemView {
  // The app's own notifications (a teammate's comment, a new membership)
  // are re-worded here in the reader's language from what they record;
  // official alerts come back untouched — see `localizeNotificationText`.
  const { title, body } = localizeNotificationText(n, translator);
  return {
    id: n.id,
    tier: n.tier,
    source: n.source,
    title,
    body,
    detail: n.detail,
    href: n.href,
    ago: translator.relativeTime(n.createdAt, now),
    unread: !n.readAt,
  };
}

function toStatusView(
  status: AlertCheckStatus | null,
  now: Date,
  translator: Translator,
): AlertStatusView {
  if (!status) return { kind: "failed", place: null, lastCheckedAgo: null };
  switch (status.kind) {
    case "no_place":
      return { kind: "no_place" };
    case "out_of_coverage":
      return { kind: "out_of_coverage", place: status.place };
    case "checked":
      return {
        kind: "checked",
        place: status.place,
        checkedAgo: status.checkedAt ? translator.relativeTime(status.checkedAt, now) : null,
      };
    case "failed":
      return {
        kind: "failed",
        place: status.place,
        lastCheckedAgo: status.lastCheckedAt
          ? translator.relativeTime(status.lastCheckedAt, now)
          : null,
      };
  }
}

/**
 * Notification Center (PRD B.6; Experience Blueprint Section 12): an
 * in-app inbox with three stacked severity tiers. Opening it brings
 * official weather alerts for the user's home place up to date (at most
 * once per few minutes), then lists what's there.
 *
 * In-app only, stated on the page: no push/SMS/email exists yet, and
 * nothing is checked while the app is closed.
 */
export default async function NotificationsPage() {
  const session = await requireSession();
  logTelemetry.event("workspace_viewed", { workspace: "notifications" });

  const now = new Date();
  const translator = await getTranslator();

  let status: AlertCheckStatus | null = null;
  try {
    status = await syncOfficialAlerts(session.userId, { now });
  } catch (err) {
    // Fail open: still show the inbox, but say the check didn't happen.
    logApplication.error("notifications_page_sync_failed", err);
  }

  let loadFailed = false;
  let visible: Notification[] = [];
  try {
    ({ visible } = await loadInbox(session.userId, now));
  } catch (err) {
    logApplication.error("notifications_page_load_failed", err);
    loadFailed = true;
  }

  const groups = groupByTier(visible);
  const views = Object.fromEntries(
    TIER_ORDER.map((tier) => [tier, groups[tier].map((n) => toItemView(n, now, translator))]),
  ) as Record<NotificationTier, NotificationItemView[]>;

  return (
    <NotificationsView
      groups={views}
      unreadCount={visible.filter((n) => !n.readAt).length}
      status={toStatusView(status, now, translator)}
      hasOfficialAlerts={visible.some((n) => n.source === "official_alert")}
      loadFailed={loadFailed}
    />
  );
}
