import { can } from "@world-vitality/identity-service";
import { StateDisplay } from "@world-vitality/ui-components";
import { WorkspaceShell } from "../workspace-shell";
import { getLocationStatus } from "../location-status";
import { getWorkspaceMembership } from "../../../../lib/get-workspace-membership";
import { getAccountService } from "../../../../lib/account";
import { MapView } from "./MapView";

export const dynamic = "force-dynamic";

const WORKSPACE_ID = "government-ngos";

/**
 * Government & NGOs' Map view (BUILD_PLAN "STAGE — GOVERNMENT & NGOS
 * FOLLOW-UP: MULTI-MARKER MAP"), this workspace's own instance of the
 * multi-marker map follow-up already built for Agriculture Fields
 * (v65) and Insurance Properties (v66) — same pattern, applied to the
 * real Monitored Locations set now that it exists.
 *
 * **What changed**: the map now plots every location the current
 * membership can see — same resource-scoped `can(role, "data:view",
 * { resourceId, scopedResourceIds })` filter `page.tsx` and
 * `report/page.tsx` already use — instead of one hardcoded demo point.
 * Each location's soil-moisture status is fetched via the same shared
 * `getLocationStatus` function those two pages already use, so the map
 * can never show a different number for a location than the Home page
 * or Report do.
 *
 * **Real, honest trade-off carried over unchanged from
 * `getLocationStatus`'s own doc comment**: one `NasaPowerConnector`
 * call per location, not one batched call for every location — the
 * same choice `report/page.tsx` and Agriculture's/Insurance's own
 * multi-marker maps already made for the identical reason.
 *
 * **Still not built, honestly** — real scope boundaries kept narrow
 * deliberately, not oversights:
 * - No marker clustering, no draw tools, timeline scrubber,
 *   satellite/terrain layer switching, search, bookmarks, or sharing —
 *   same boundary Agriculture's and Insurance's multi-marker maps
 *   already drew.
 * - Other workspaces' map pages (Construction, Renewable Energy,
 *   Logistics, Weather, Disaster Monitoring, Education, Research)
 *   still show their own single hardcoded demo point — deliberately
 *   not touched in this stage, same one-workspace-at-a-time scoping
 *   as the two prior stages.
 */
export default async function GovernmentNgosMapPage() {
  const membership = await getWorkspaceMembership(WORKSPACE_ID);

  const allLocations = await getAccountService().listLocations(WORKSPACE_ID);
  const visibleLocations = allLocations.filter((location) =>
    can(membership.role, "data:view", {
      resourceId: location.id,
      scopedResourceIds: membership.scopedResourceIds,
    }),
  );
  const statuses = await Promise.all(
    visibleLocations.map((location) => getLocationStatus(location)),
  );

  const markers = statuses.map(({ location, soilMoisture, moistureValue }) => ({
    id: location.id,
    name: location.label,
    latitude: location.latitude,
    longitude: location.longitude,
    moistureValue,
    summary: soilMoisture.summary,
  }));

  return (
    <WorkspaceShell activeKey="map" role={membership.role}>
      {markers.length === 0 ? (
        <StateDisplay
          status="empty"
          title="No locations visible"
          description="There are no monitored locations to show on the map yet. Add a location from the workspace home page."
        />
      ) : (
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
      )}
    </WorkspaceShell>
  );
}
