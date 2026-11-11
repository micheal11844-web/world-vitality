import { NextResponse } from "next/server";
import { getSessionUserId } from "../../../../lib/get-session-user-id";
import { FRESH_CAMERA_ID, loadFreshCameraPicture } from "../../../../lib/camera-feeds";
import { logApplication } from "../../../../lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 20;

/**
 * The latest picture address of ONE camera, for agencies that put every new
 * picture at a new address (Singapore): the address in the camera list is out
 * of date within seconds, so the camera panel asks here when a camera is opened,
 * reloaded, and on its own schedule while it stays open. Only the address and
 * the time the picture was taken come back; the picture itself still loads
 * straight from the agency in the viewer's browser.
 *
 * Signed-in only, like the Globe. The id must be of the form `lta-<number>`
 * and is only ever looked up in the agency's own list, never fetched.
 */
export async function GET(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!FRESH_CAMERA_ID.test(id)) {
    return NextResponse.json({ error: "invalid_camera" }, { status: 400 });
  }
  try {
    const picture = await loadFreshCameraPicture(id);
    if (!picture) {
      return NextResponse.json({ error: "unknown_camera" }, { status: 404 });
    }
    return NextResponse.json(picture, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    logApplication.error("globe_camera_picture_failed", err, { id });
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}
