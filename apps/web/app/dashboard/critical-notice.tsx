import { getSessionUserId } from "../../lib/get-session-user-id";
import { logApplication } from "../../lib/logger";
import { loadInbox, syncOfficialAlerts } from "../../lib/notification-sync";
import { CriticalBanner } from "./critical-banner";

/**
 * The Dashboard's urgent-item banner: shown only when the signed-in user
 * has an **unread critical** notification — in practice, an official
 * life-safety alert for their home place (Experience Blueprint Section
 * 12). Marking it read (in the Notification Center) clears it; it never
 * auto-dismisses.
 *
 * Visual language: the heavy critical border, tinted ground and the
 * "!" CRITICAL label, which the design reserves for this tier alone.
 * Wording is the agency's own title with a calm pointer to the full
 * text — no extra urgency copy added.
 *
 * Fails to *nothing* on any error (the bell and the Notification Center
 * still work, and say plainly when a check couldn't be made): this must
 * never take the Dashboard down. An absent banner is not an all-clear.
 */
export async function CriticalNotice() {
  const userId = await getSessionUserId();
  if (!userId) return null;

  try {
    try {
      await syncOfficialAlerts(userId);
    } catch (err) {
      logApplication.error("dashboard_critical_sync_failed", err);
    }
    const { visible } = await loadInbox(userId);
    const critical = visible.filter((n) => n.tier === "critical" && !n.readAt);
    const first = critical[0];
    if (!first) return null;
    const others = critical.length - 1;

    return <CriticalBanner title={first.title} body={first.body} othersCount={others} />;
  } catch (err) {
    logApplication.error("dashboard_critical_notice_failed", err);
    return null;
  }
}
