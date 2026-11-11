import { NextResponse } from "next/server";
import { buildFireWatch } from "@world-vitality/hazard-feeds";
import { getSessionUserId } from "../../../../lib/get-session-user-id";
import { loadCameras } from "../../../../lib/camera-feeds";
import { isFireKeyMissing, loadWorldFireDetections } from "../../../../lib/global-fires";
import { logApplication } from "../../../../lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * The Globe's worldwide satellite fire layer: one day of NASA FIRMS heat
 * detections folded into map points, each with the public cameras closest to
 * it (within 25 km). These are heat detections, **not** confirmed fires.
 *
 * Signed-in only, like the Globe. A fire layer that is only missing its
 * optional `NASA_FIRMS_MAP_KEY` answers `notConfigured` (not an error). If the
 * cameras cannot be loaded the fires are still returned, flagged with
 * `camerasFailed`, so the page can say that nearby pictures are unavailable
 * instead of implying there are none.
 */
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  try {
    const [detections, cameraResult] = await Promise.allSettled([
      loadWorldFireDetections(),
      loadCameras(),
    ]);
    if (detections.status === "rejected") {
      if (isFireKeyMissing(detections.reason)) {
        return NextResponse.json(
          { fires: [], totalDetections: 0, totalClusters: 0, notConfigured: true },
          { headers: { "Cache-Control": "private, max-age=120" } },
        );
      }
      logApplication.error("globe_fires_failed", detections.reason);
      return NextResponse.json(
        { fires: [], totalDetections: 0, totalClusters: 0, failed: true },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    const cameras = cameraResult.status === "fulfilled" ? cameraResult.value : null;
    const watch = buildFireWatch(detections.value, cameras?.cameras ?? []);
    return NextResponse.json(
      {
        ...watch,
        camerasFailed: cameras === null || cameras.failed.length > 0,
      },
      { headers: { "Cache-Control": "private, max-age=120" } },
    );
  } catch (err) {
    logApplication.error("globe_fires_route_failed", err);
    return NextResponse.json(
      { fires: [], totalDetections: 0, totalClusters: 0, failed: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
