import Link from "next/link";
import { can } from "@world-vitality/identity-service";
import { Card, Text, StateDisplay, ConfidenceBadge, Button } from "@world-vitality/ui-components";
import { WorkspaceShell } from "./workspace-shell";
import { AddPropertyForm } from "./add-property-form";
import { PropertyManageControls } from "./property-manage-controls";
import { getPropertyStatus } from "./property-status";
import { getWorkspaceMembership } from "../../../lib/get-workspace-membership";
import { getAccountService } from "../../../lib/account";
import { logTelemetry } from "../../../lib/logger";

export const dynamic = "force-dynamic";

const WORKSPACE_ID = "insurance";

/**
 * Insurance Workspace Home — Underwriting Risk Context (BUILD_PLAN
 * "STAGE — INSURANCE WORKSPACE", made real-multi-property by "STAGE —
 * INSURANCE FOLLOW-UP: INSURED PROPERTIES"). Scoped and confirmed with
 * the owner explicitly before the original build, per PRD A.3's
 * near-audit-grade stakes.
 *
 * **The second page in this app that calls `can()` with a real
 * `resourceId`** (Agriculture's Field Overview was the first) — every
 * insured property is filtered through `can(role, "data:view", {
 * resourceId: property.id, scopedResourceIds })` before being shown, so
 * a `scoped_field_user` ("Claims Adjuster" in this workspace)
 * membership with a real `scopedResourceIds` array now genuinely
 * narrows what's visible — closing the exact gap
 * `workspace-shell.tsx`'s own doc comment named ("resource-level
 * scoping... has no populated data to scope to yet"). Every other role
 * continues to see every property, unchanged.
 *
 * **Honest scope, stated plainly — this covers a real but narrow slice
 * of PRD A.3's actual ambition:**
 * - **What this page shows is real**: two already-proven interpretation
 *   capabilities (`WeatherStatusProvider`, `SoilMoistureStatusProvider`)
 *   run per insured property now (not one hardcoded demo address),
 *   shown side by side with individual confidence scores — same
 *   honest-synthesis pattern `government-ngos/page.tsx` established.
 * - **NOT built, deliberately, and this is the important one: no
 *   multi-hazard AI-synthesized "single normalized risk score."** PRD
 *   A.3 names flood, wildfire, storm, and drought risk layers
 *   synthesized into one score as this workspace's core AI value prop.
 *   This codebase has no flood, wildfire, or storm interpretation
 *   capability anywhere, and no historical event archive to evaluate
 *   one against. Fabricating a composite score from capabilities that
 *   don't exist would violate Constitution AI Principle #2 (never
 *   fabricate) and #4 (continuously evaluated against ground truth) —
 *   the exact reasoning the Disaster Monitoring workspace already
 *   applied to decline multi-hazard AI cross-validation.
 * - **Real portfolio now — `insurance_properties`, not one demo
 *   address.** Named "properties," not "claims," deliberately: PRD A.3
 *   says Claims Adjuster is "scoped to relevant claims," but this
 *   codebase has no claims-event data model (claim number, date,
 *   adjuster notes, payout status) — fabricating one would misrepresent
 *   real data. What's real and buildable is the underlying insured
 *   property a claim would always be about; see
 *   `0011_insurance_properties.sql`'s doc comment for the full
 *   reasoning. **Editing and deleting a property are both real now**
 *   (BUILD_PLAN "STAGE — INSURANCE FOLLOW-UP: INSURED PROPERTIES
 *   EDIT/DELETE" closed the gap the original stage explicitly
 *   deferred), gated by the same resource-scoped `can(role,
 *   "data:edit", { resourceId, scopedResourceIds })` check viewing
 *   already uses.
 * - **No claims-verification-against-historical-data tool** — would
 *   need a historical event archive this app doesn't have (Disaster
 *   Monitoring relays only live/current data, by design).
 * - **Institutional permission tiers (Admin/Underwriter/Claims
 *   Adjuster/Analyst)**: real, using the same role-lookup machinery
 *   `government-ngos` introduced — see `workspace-shell.tsx` for the
 *   PRD-name mapping. Same fail-safe-to-viewer_external default until
 *   a real invite/admin UI exists for assigning the *first* membership
 *   (the Team page itself is real, per "STAGE — TEAM/INVITE UI").
 * - **Auditable report export**: real — see `report/page.tsx`. Still
 *   reports on one demo address, not yet extended to the real
 *   portfolio — real, separate follow-up work, not done in this stage.
 * - **Not built**: parametric-trigger API, reinsurance stress-testing,
 *   climate-scenario portfolio modeling, white-labeled policyholder
 *   reports — all explicitly named in the PRD as this workspace's own
 *   *future premium features*, not core scope.
 *
 * **Not verified against the live NASA POWER API from this build
 * environment** — same caveat as every other workspace's page.
 */
export default async function InsuranceWorkspaceHome() {
  logTelemetry.event("workspace_viewed", { workspace: WORKSPACE_ID });
  const membership = await getWorkspaceMembership(WORKSPACE_ID);
  const allProperties = await getAccountService().listProperties(WORKSPACE_ID);
  const visibleProperties = allProperties.filter((property) =>
    can(membership.role, "data:view", {
      resourceId: property.id,
      scopedResourceIds: membership.scopedResourceIds,
    }),
  );

  const statuses = await Promise.all(visibleProperties.map((property) => getPropertyStatus(property)));
  const canEdit = can(membership.role, "data:edit");
  const canCreateReports = can(membership.role, "reports:create");
  const headlineInterpretation = statuses[0]?.soilMoisture;

  return (
    <WorkspaceShell activeKey="home" role={membership.role} aiInterpretation={headlineInterpretation}>
      <Text variant="pageTitle" as="h1" style={{ marginBottom: "var(--wv-space-xs)" }}>
        Underwriting Risk Context
      </Text>
      <Text
        variant="body"
        style={{ color: "var(--wv-text-secondary)", marginBottom: "var(--wv-space-lg)" }}
      >
        Real insured portfolio ({allProperties.length} propert{allProperties.length === 1 ? "y" : "ies"}). Individual
        hazard signals only; no synthesized multi-hazard risk score (see this page&apos;s
        honest-scope notes).
      </Text>

      {canEdit && <AddPropertyForm />}

      {statuses.length === 0 ? (
        <StateDisplay
          status="empty"
          title={allProperties.length === 0 ? "No insured properties yet" : "No properties visible for your role"}
          description={
            allProperties.length === 0
              ? "Add an insured property above to get started."
              : "Your access is scoped to specific properties, and none are currently assigned to you."
          }
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(18rem, 1fr))",
            gap: "var(--wv-space-md)",
            marginBottom: "var(--wv-space-lg)",
          }}
        >
          {statuses.map(({ property, weather, soilMoisture, ingestionGaps }) => (
            <Card key={property.id}>
              <Text variant="sectionTitle" as="p" style={{ marginBottom: "var(--wv-space-xs)" }}>
                {property.policyNumber}
              </Text>
              <Text
                variant="caption"
                style={{ display: "block", color: "var(--wv-text-secondary)", marginBottom: "var(--wv-space-sm)" }}
              >
                {property.propertyAddress}
              </Text>

              <Text variant="caption">TEMPERATURE</Text>
              {weather.unableToAnswer ? (
                <Text variant="body" style={{ color: "var(--wv-text-secondary)" }}>
                  {weather.summary}
                </Text>
              ) : (
                <>
                  <Text variant="body" style={{ margin: "var(--wv-space-xs) 0" }}>
                    {weather.summary}
                  </Text>
                  <ConfidenceBadge level={weather.confidence} />
                </>
              )}

              <div style={{ height: "var(--wv-space-sm)" }} />

              <Text variant="caption">SOIL / DROUGHT-ADJACENT</Text>
              {soilMoisture.unableToAnswer ? (
                <Text variant="body" style={{ color: "var(--wv-text-secondary)" }}>
                  {soilMoisture.summary}
                </Text>
              ) : (
                <>
                  <Text variant="body" style={{ margin: "var(--wv-space-xs) 0" }}>
                    {soilMoisture.summary}
                  </Text>
                  <ConfidenceBadge level={soilMoisture.confidence} />
                </>
              )}

              {ingestionGaps > 0 && (
                <Text variant="caption" style={{ display: "block", marginTop: "var(--wv-space-sm)" }}>
                  {ingestionGaps} day(s) had no data available.
                </Text>
              )}

              {can(membership.role, "data:edit", {
                resourceId: property.id,
                scopedResourceIds: membership.scopedResourceIds,
              }) && (
                <PropertyManageControls
                  propertyId={property.id}
                  initialPolicyNumber={property.policyNumber}
                  initialPropertyAddress={property.propertyAddress}
                  initialLatitude={property.latitude}
                  initialLongitude={property.longitude}
                />
              )}
            </Card>
          ))}
        </div>
      )}

      <Card>
        <Text variant="sectionTitle" as="p">
          Auditable Report
        </Text>
        {canCreateReports ? (
          <>
            <Text
              variant="body"
              style={{ color: "var(--wv-text-secondary)", marginBottom: "var(--wv-space-sm)" }}
            >
              Generate a print-ready underwriting report, with sources, timestamps, and a logged
              audit trail entry.
            </Text>
            <Link href="/workspaces/insurance/report" style={{ textDecoration: "none" }}>
              <Button variant="secondary">Open Report</Button>
            </Link>
          </>
        ) : (
          <StateDisplay
            status="empty"
            title="Report export not available for your role"
            description="This role does not have permission to create reports in this workspace."
          />
        )}
      </Card>
    </WorkspaceShell>
  );
}
