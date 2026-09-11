import { fetchFloodingLocations } from "../../../../lib/usgs-flood-impacts";
import { fetchNearbyShelters } from "../../../../lib/fema-shelters";
import { fetchActiveFireDetections } from "../../../../lib/nasa-firms";
import { WorkspaceShell } from "../workspace-shell";
import { MapView, type HazardMarker } from "./MapView";
import { logSecurity } from "../../../../lib/logger";

export const dynamic = "force-dynamic";

// Same shared demo location this workspace's own home page and the
// Globe both use — see disaster-monitoring/page.tsx's own doc comment
// for why it's U.S.-only (National Weather Service coverage, though
// this page itself only uses the USGS/FEMA/FIRMS sources, not NWS).
const DEMO_LOCATION = { latitude: 34.0522, longitude: -118.2437, stateCode: "CA" };

/**
 * Disaster Monitoring's Map view (BUILD_PLAN "STAGE — DISASTER
 * MONITORING FOLLOW-UP: MULTI-MARKER MAP"), this workspace's own
 * instance of the multi-marker map follow-up already built for
 * Agriculture Fields, Insurance Properties, and Government & NGOs
 * Monitored Locations — but this workspace has no resource-type table
 * of its own to extend (its data is public safety information, not a
 * user-created portfolio). The genuine multi-marker opportunity here
 * is different: reuse the exact same three point-based data sources
 * (Flood Impact Locations, Nearby Designated Shelters, Active Fire
 * Detections) the Globe already plots for this workspace, on this
 * workspace's own 2D map, instead of the one hardcoded LA point with
 * just an alert-severity badge this page showed before.
 *
 * **Deliberately excludes Active Alerts** — same reasoning as the
 * Globe's own doc comment: `NwsAlert` covers a polygonal warning
 * *area*, not a point; the only "location" this app has for one is the
 * single query point used to look it up. Plotting an alert as a point
 * pin would imply a precision the data doesn't have. The old
 * single-point version's "top severity" badge is gone along with it —
 * that information still lives on this workspace's own home page,
 * which is where an area-level summary belongs, not a point map.
 *
 * **Each layer fetched independently with its own try/catch** — one
 * source failing must never take down the other two or the map itself,
 * matching the exact graceful-degradation pattern `page.tsx` (the home
 * page) and `globe/page.tsx` already established for these same three
 * fetchers. Fire detections need the owner's own `NASA_FIRMS_MAP_KEY`;
 * unlike the home page (which shows an explicit "not configured"
 * state) this map silently omits the fire layer if unset, same choice
 * the Globe already made for the identical reason — one pin type among
 * several here, not a whole dedicated section.
 *
 * **No resource-scoped permission filtering** — this workspace has no
 * resource-scoped permission model of its own (see `globe/page.tsx`'s
 * doc comment for the fuller reasoning): its data is public safety
 * information, gated only by requiring a session to view the workspace
 * at all, same as every other page in this workspace.
 */
export default async function DisasterMonitoringMapPage() {
  let floods: Awaited<ReturnType<typeof fetchFloodingLocations>> = [];
  try {
    floods = await fetchFloodingLocations(DEMO_LOCATION.stateCode);
  } catch (err) {
    logSecurity.error("disaster_monitoring_map_floods_fetch_failed", err);
  }

  let shelters: Awaited<ReturnType<typeof fetchNearbyShelters>> = [];
  try {
    shelters = await fetchNearbyShelters(DEMO_LOCATION.latitude, DEMO_LOCATION.longitude);
  } catch (err) {
    logSecurity.error("disaster_monitoring_map_shelters_fetch_failed", err);
  }

  let fires: Awaited<ReturnType<typeof fetchActiveFireDetections>> = [];
  try {
    fires = await fetchActiveFireDetections(DEMO_LOCATION.latitude, DEMO_LOCATION.longitude);
  } catch (err) {
    if (!(err instanceof Error && err.message.includes("NASA_FIRMS_MAP_KEY"))) {
      logSecurity.error("disaster_monitoring_map_fires_fetch_failed", err);
    }
  }

  const markers: HazardMarker[] = [
    ...floods
      .filter((f) => f.latitude !== null && f.longitude !== null)
      .map((f) => ({
        id: `flood-${f.id}`,
        kind: "flood" as const,
        name: f.name,
        latitude: f.latitude as number,
        longitude: f.longitude as number,
        summary: f.description ?? "Currently-flooding location, per USGS's last check.",
      })),
    ...shelters.map((s) => ({
      id: `shelter-${s.id}`,
      kind: "shelter" as const,
      name: s.name,
      latitude: s.latitude,
      longitude: s.longitude,
      summary: s.address ?? "Designated shelter facility (reference location only).",
    })),
    ...fires.map((f, i) => ({
      id: `fire-${i}`,
      kind: "fire" as const,
      name: `Fire detection (${f.confidence} confidence)`,
      latitude: f.latitude,
      longitude: f.longitude,
      summary: `Thermal anomaly, ${f.satellite}, ${f.acquiredDate} (${f.dayNight}). Not a confirmed wildfire.`,
    })),
  ];

  return (
    <WorkspaceShell activeKey="map">
      <div
        style={{
          height: "100%",
          minHeight: "32rem",
          borderRadius: "var(--wv-radius-md)",
          overflow: "hidden",
        }}
      >
        <MapView markers={markers} />
      </div>
    </WorkspaceShell>
  );
}
