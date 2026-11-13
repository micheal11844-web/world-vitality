import { parseGlobeFocus } from "@world-vitality/hazard-feeds";
import { logTelemetry } from "../../lib/logger";
import { loadWatchedPlaces } from "../../lib/watched-places";
import { GlobeShell } from "./globe-shell";

export const dynamic = "force-dynamic";

/**
 * "God's Eye" global view — server-side data assembly (BUILD_PLAN
 * "STAGE — GOD'S EYE GLOBE VIEW", extended by "STAGE — GLOBE VIEW:
 * DISASTER MONITORING LAYERS"). Combines every real, point-located
 * resource this app stores for the signed-in person — Agriculture's
 * fields, Insurance's insured properties, and Government & NGOs'
 * monitored locations — into one flat pin list for the Globe to plot.
 *
 * **Permission filtering happens here, per workspace, exactly as it
 * does on each workspace's own home page — this is not optional and
 * not a lighter-weight check because it's "just a visualization."** A
 * `scoped_field_user` ("Claims Adjuster" in Insurance, "Field Staff" in
 * Government & NGOs) who can only see specific resources on their own
 * workspace's home page must see exactly the same restricted set here,
 * never the full unfiltered list — each workspace's own membership
 * (role + `scopedResourceIds`) is fetched independently, since a
 * single signed-in user can hold a completely different role in each
 * workspace. Getting this wrong would be a real permission bypass, not
 * a cosmetic bug — the exact category of gap the repo-wide security
 * audit (BUILD_PLAN v45) was written to catch.
 *
 * **Disaster Monitoring's three live layers (floods, shelters, fire
 * detections) are NOT fetched here any more.** They used to be awaited one
 * after another inside this Server Component, so the page could not open
 * until the slowest outside service (USGS, FEMA/HIFLD, NASA FIRMS) had
 * answered — sometimes many seconds, with nothing on screen. This page now
 * only reads the signed-in person's own, database-backed locations (three
 * quick reads, run side by side), and `GlobeShell` loads the live layers
 * from `/api/globe/live-layers` in the background once the Globe is
 * already visible. Those layers need no per-workspace filtering: that
 * workspace has no resource-scoped permission model (its data is public
 * safety information, gated only by requiring a session), which is also
 * why the route only checks for a session. Active Alerts remain
 * deliberately NOT plotted — NWS alerts cover polygonal warning *areas*,
 * not points, and plotting one as a pin would imply precision the data
 * does not have.
 */
export default async function GlobePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  logTelemetry.event("globe_viewed");
  // A satellite-heat alert links here as `/globe?heat=<lat>,<lon>`: the Globe opens on
  // the detection it is about. Anything that is not two numbers on Earth is ignored.
  const focus = parseGlobeFocus((await searchParams).heat);

  // The person's own saved places, permission-filtered per workspace: see
  // `loadWatchedPlaces` for why that filtering is not optional.
  const pins = await loadWatchedPlaces();

  return <GlobeShell pins={pins} focus={focus} />;
}
