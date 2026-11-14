import { NextResponse } from "next/server";
import { getSessionUserId } from "../../../../lib/get-session-user-id";
import { loadWorldFloods } from "../../../../lib/global-floods";
import { logApplication } from "../../../../lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 20;

/**
 * The Globe's worldwide flood layer: recent flood events from GDACS (the UN and
 * European Commission's disaster alert system). These are model estimates of
 * large floods, **not** ground reports and not official warnings.
 *
 * Signed-in only, like the Globe. A source that cannot be read answers
 * `failed: true` (so the page says "unavailable"); an empty `floods` list with no
 * `failed` flag means GDACS answered and listed no recent flood.
 */
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  try {
    const floods = await loadWorldFloods();
    return NextResponse.json({ floods }, { headers: { "Cache-Control": "private, max-age=300" } });
  } catch (err) {
    logApplication.error("globe_floods_failed", err);
    return NextResponse.json(
      { floods: [], failed: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
