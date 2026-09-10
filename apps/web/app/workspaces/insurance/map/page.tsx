import { can } from "@world-vitality/identity-service";
import { StateDisplay } from "@world-vitality/ui-components";
import { WorkspaceShell } from "../workspace-shell";
import { getPropertyStatus } from "../property-status";
import { getWorkspaceMembership } from "../../../../lib/get-workspace-membership";
import { getAccountService } from "../../../../lib/account";
import { MapView } from "./MapView";

export const dynamic = "force-dynamic";

const WORKSPACE_ID = "insurance";

/**
 * Insurance's Map view (BUILD_PLAN "STAGE — INSURANCE FOLLOW-UP:
 * MULTI-MARKER MAP"), Insurance's own instance of the multi-marker map
 * follow-up "STAGE — AGRICULTURE FOLLOW-UP: MULTI-MARKER MAP" already
 * built for Fields — same pattern, applied to the real insured
 * portfolio now that it exists.
 *
 * **What changed**: the map now plots every property the current
 * membership can see — same resource-scoped `can(role, "data:view",
 * { resourceId, scopedResourceIds })` filter `page.tsx` and
 * `report/page.tsx` already use — instead of one hardcoded demo point.
 * Each property's soil-moisture status is fetched via the same shared
 * `getPropertyStatus` function those two pages already use, so the map
 * can never show a different number for a property than the Portfolio
 * Overview or Report do.
 *
 * **Real, honest trade-off carried over unchanged from
 * `getPropertyStatus`'s own doc comment**: one `NasaPowerConnector`
 * call per property, not one batched call for every property — the
 * same choice `report/page.tsx` and Agriculture's own multi-marker map
 * already made for the identical reason.
 *
 * PRD A.3 asks for "address- and region-level hazard layers with
 * historical event overlay" — this is still one live signal per
 * property, no historical overlay, and no hazard-specific layer beyond
 * the soil-moisture band every other workspace's map already uses.
 * Real progress on PRD A.3 (many real points instead of one demo
 * point), not the full hazard-layer vision — same honest boundary this
 * page's own doc comment has drawn since it was first built.
 *
 * **Still not built, honestly** — real scope boundaries kept narrow
 * deliberately, not oversights:
 * - No marker clustering, no draw tools, timeline scrubber,
 *   satellite/terrain layer switching, search, bookmarks, or sharing —
 *   same boundary Agriculture's multi-marker map already drew.
 * - Other workspaces' map pages (Government & NGOs, Construction,
 *   Renewable Energy, Logistics, Weather, Disaster Monitoring,
 *   Education, Research) still show their own single hardcoded demo
 *   point — deliberately not touched in this stage, same reasoning as
 *   Agriculture's own stage.
 */
export default async function InsuranceMapPage() {
  const membership = await getWorkspaceMembership(WORKSPACE_ID);

  const allProperties = await getAccountService().listProperties(WORKSPACE_ID);
  const visibleProperties = allProperties.filter((property) =>
    can(membership.role, "data:view", {
      resourceId: property.id,
      scopedResourceIds: membership.scopedResourceIds,
    }),
  );
  const statuses = await Promise.all(
    visibleProperties.map((property) => getPropertyStatus(property)),
  );

  const markers = statuses.map(({ property, soilMoisture, moistureValue }) => ({
    id: property.id,
    name: property.propertyAddress,
    latitude: property.latitude,
    longitude: property.longitude,
    moistureValue,
    summary: soilMoisture.summary,
  }));

  return (
    <WorkspaceShell activeKey="map" role={membership.role}>
      {markers.length === 0 ? (
        <StateDisplay
          status="empty"
          title="No properties visible"
          description="There are no insured properties to show on the map yet. Add a property from the workspace home page."
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
