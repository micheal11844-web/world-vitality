import { NextResponse } from "next/server";
import { thinCameras } from "@world-vitality/hazard-feeds";
import { getSessionUserId } from "../../../../lib/get-session-user-id";
import { loadCameras } from "../../../../lib/camera-feeds";
import { logApplication } from "../../../../lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 20;

/**
 * The public traffic and road-weather cameras the Globe can show as markers:
 * official agency cameras only (California, New South Wales, British
 * Columbia, London, Finland, Singapore). Only the camera list is returned: names,
 * positions and the agency's own picture address. The browser loads a picture
 * from the agency only when the person opens that camera.
 *
 * Thinned (one camera per ~5 km square, at most 600 per agency) so the
 * markers stay readable and the answer stays small. Fires have their own
 * route and always carry their own nearby cameras, thinned or not.
 *
 * Signed-in only, like the Globe. A provider that is down is reported in
 * `failed`; it never fails the whole request.
 */
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  try {
    const { cameras, failed } = await loadCameras();
    return NextResponse.json(
      { cameras: thinCameras(cameras), total: cameras.length, failed },
      { headers: { "Cache-Control": "private, max-age=300" } },
    );
  } catch (err) {
    logApplication.error("globe_cameras_route_failed", err);
    return NextResponse.json(
      { cameras: [], total: 0, failed: ["all"] },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
