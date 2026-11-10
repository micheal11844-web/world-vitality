import { NextResponse } from "next/server";
import { getSessionUserId } from "../../../../lib/get-session-user-id";
import { loadLiveLayerPins } from "../../../../lib/globe-live-layers";
import { logApplication } from "../../../../lib/logger";

export const dynamic = "force-dynamic";

/**
 * The Globe's live hazard points (flooding locations and shelters),
 * fetched by the page *after* it is already on screen. They used to be
 * fetched one after another while the server rendered the page, so the
 * Globe could not open until the slowest outside service had answered.
 *
 * Signed-in only, like the Globe page itself. Always an answer the page can
 * use: a layer that is slow or down is reported in `failed` instead of
 * failing the whole request. The browser may keep a good answer for two
 * minutes (the server also keeps one for five), since the sources only
 * change every few minutes.
 */
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  try {
    const { pins, failed } = await loadLiveLayerPins();
    return NextResponse.json(
      { pins, failed },
      { headers: { "Cache-Control": "private, max-age=120" } },
    );
  } catch (err) {
    logApplication.error("globe_live_layers_failed", err);
    return NextResponse.json(
      { pins: [], failed: ["floods", "shelters"] },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
