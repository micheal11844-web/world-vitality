import { can } from "@world-vitality/identity-service";
import { StateDisplay } from "@world-vitality/ui-components";
import { WorkspaceShell } from "../workspace-shell";
import { getFieldStatus } from "../field-status";
import { getWorkspaceMembership } from "../../../../lib/get-workspace-membership";
import { getAccountService } from "../../../../lib/account";
import { MapView } from "./MapView";

export const dynamic = "force-dynamic";

const WORKSPACE_ID = "agriculture";

/**
 * Agriculture's Map view (BUILD_PLAN "STAGE — AGRICULTURE FOLLOW-UP:
 * MULTI-MARKER MAP"), closing the gap flagged honestly back in the
 * Insurance report/export follow-up ("the map page's single-demo-point
 * limitation isn't unique to Insurance... multi-marker maps don't
 * exist anywhere in this app"). This is that follow-up, started here
 * because Agriculture Fields is this app's original, most-exercised
 * resource type.
 *
 * **What changed**: the map now plots every field the current
 * membership can see — same resource-scoped `can(role, "data:view",
 * { resourceId, scopedResourceIds })` filter `page.tsx` and
 * `report/page.tsx` already use — instead of one hardcoded demo point.
 * Each field's soil-moisture status is fetched via the same shared
 * `getFieldStatus` function those two pages already use, so the map
 * can never show a different number for a field than the Field
 * Overview or Report do.
 *
 * **Real, honest trade-off carried over unchanged from
 * `getFieldStatus`'s own doc comment**: one `NasaPowerConnector` call
 * per field, not one batched call for every field — correctness-safe
 * for a field list expected to stay small, the same choice
 * `report/page.tsx` already made for the same reason.
 *
 * **Still not built, honestly** — real scope boundaries kept narrow
 * deliberately, not oversights:
 * - No marker clustering. Fine for a field list expected to stay
 *   small; would need real design work (cluster radius, expand-on-
 *   zoom behavior) if a workspace's field count ever grows large
 *   enough for markers to visually overlap.
 * - No draw tools, timeline scrubber, satellite/terrain layer
 *   switching, search, bookmarks, or sharing — Experience Blueprint
 *   Section 11's fuller spec, same boundary `MapView.tsx`'s own doc
 *   comment already drew for the single-marker version.
 * - Other workspaces' map pages (Insurance, Government & NGOs,
 *   Construction, Renewable Energy, Logistics, Weather, Disaster
 *   Monitoring, Education) still show their own single hardcoded demo
 *   point — this stage deliberately does not touch them, so each can
 *   be extended as its own reviewable follow-up rather than one large,
 *   harder-to-review change touching every workspace at once.
 */
export default async function AgricultureMapPage() {
  const membership = await getWorkspaceMembership(WORKSPACE_ID);

  const allFields = await getAccountService().listFields(WORKSPACE_ID);
  const visibleFields = allFields.filter((field) =>
    can(membership.role, "data:view", {
      resourceId: field.id,
      scopedResourceIds: membership.scopedResourceIds,
    }),
  );
  const statuses = await Promise.all(visibleFields.map((field) => getFieldStatus(field)));

  const markers = statuses.map(({ field, soilMoisture, moistureValue }) => ({
    id: field.id,
    name: field.name,
    latitude: field.latitude,
    longitude: field.longitude,
    moistureValue,
    summary: soilMoisture.summary,
  }));

  return (
    <WorkspaceShell activeKey="map">
      {markers.length === 0 ? (
        <StateDisplay
          status="empty"
          title="No fields visible"
          description="There are no fields to show on the map yet. Add a field from the workspace home page."
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
