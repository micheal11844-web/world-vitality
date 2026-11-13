import { NextResponse } from "next/server";
import { summarize } from "@world-vitality/identity-service";
import { getSessionUserId } from "../../../../lib/get-session-user-id";
import { logApplication } from "../../../../lib/logger";
import { startHeatWatch } from "../../../../lib/heat-watch";
import { loadInbox, syncOfficialAlerts } from "../../../../lib/notification-sync";

export const dynamic = "force-dynamic";
// The satellite-heat check runs after the answer has gone out and may download a
// world file from NASA (up to 25 s); this is the time it is allowed to finish in.
export const maxDuration = 30;

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * The header bell's data (Notification Center, PRD B.6): how many
 * unread notifications the signed-in user has and how many of those are
 * critical. Also the moment official alerts are brought up to date —
 * the bell polls on page load, on focus and every few minutes, and
 * `syncOfficialAlerts` re-checks the source at most once per interval,
 * so most calls are just two small reads. It is also where satellite heat
 * near the person's saved places is checked (`startHeatWatch`, at most every
 * 15 minutes, with the slow part run after the answer has gone).
 *
 * Always HTTP 200 (`signedIn: false` for an anonymous visitor): the
 * bell is rendered on every page and a 401 would show up as a console
 * error on public ones. Failures degrade to "no count" rather than an
 * error the person can't act on; the Notification Center itself says
 * plainly when something couldn't be checked.
 */
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ signedIn: false }, { headers: NO_STORE });
  }

  try {
    try {
      await syncOfficialAlerts(userId);
    } catch (err) {
      // A sync failure must not hide what is already in the inbox.
      logApplication.error("notification_summary_sync_failed", err);
    }
    try {
      // Satellite heat near the person's saved places: the slow part runs after
      // this answer is sent (see `heat-watch.ts`), so the bell never waits for it.
      await startHeatWatch(userId);
    } catch (err) {
      logApplication.error("notification_summary_heat_failed", err);
    }
    const { visible } = await loadInbox(userId);
    return NextResponse.json({ signedIn: true, ...summarize(visible) }, { headers: NO_STORE });
  } catch (err) {
    logApplication.error("notification_summary_failed", err);
    return NextResponse.json({ signedIn: true, degraded: true }, { headers: NO_STORE });
  }
}
