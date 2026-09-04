import Link from "next/link";
import { can } from "@world-vitality/identity-service";
import { Card, Text, StateDisplay, ConfidenceBadge, Button } from "@world-vitality/ui-components";
import { WorkspaceShell } from "./workspace-shell";
import { AddLocationForm } from "./add-location-form";
import { getLocationStatus } from "./location-status";
import { getWorkspaceMembership } from "../../../lib/get-workspace-membership";
import { getAccountService } from "../../../lib/account";
import { logTelemetry } from "../../../lib/logger";

export const dynamic = "force-dynamic";

const WORKSPACE_ID = "government-ngos";

/**
 * Government & NGOs Workspace Home — Jurisdiction Overview (BUILD_PLAN
 * "STAGE — GOVERNMENT & NGOS WORKSPACE", made real-multi-location by
 * "STAGE — GOVERNMENT & NGOS FOLLOW-UP: MONITORED LOCATIONS"). Scoped
 * and confirmed with the owner explicitly before the original build,
 * per PRD A.10's institutional/public-accountability stakes.
 *
 * **The third page in this app that calls `can()` with a real
 * `resourceId`** (Agriculture's Field Overview and Insurance's
 * Underwriting Risk Context came first) — every monitored location is
 * filtered through `can(role, "data:view", { resourceId: location.id,
 * scopedResourceIds })` before being shown, so a `scoped_field_user`
 * ("Field Staff" in this workspace) membership with a real
 * `scopedResourceIds` array now genuinely narrows what's visible —
 * closing the exact "genuinely incomplete" gap this page's own prior
 * honest-scope note named. Every other role continues to see every
 * location, unchanged.
 *
 * **Honest scope, stated plainly, not silently glossed over — this
 * covers a fraction of PRD A.10's actual ambition:**
 * - **Multi-domain overview**: real — reuses two already-proven,
 *   already-tested interpretation capabilities (`WeatherStatusProvider`,
 *   `SoilMoistureStatusProvider`) per monitored location now (not one
 *   hardcoded demo point), genuinely synthesizing climate and
 *   agriculture signals into one view, but built entirely from
 *   capabilities already live elsewhere — no new AI risk introduced for
 *   this workspace.
 * - **Real jurisdiction boundaries**: still NOT built — this app has no
 *   GIS polygon data anywhere. Named "Monitored Locations," not
 *   "jurisdictions" or "regions," deliberately — a single point isn't
 *   honestly a boundary; see `0012_government_ngos_locations.sql`'s
 *   doc comment for the full reasoning. Real jurisdiction boundaries,
 *   if built later, are a separate, larger GIS feature.
 * - **Institutional permission tiers (Agency Admin/Analyst/Field
 *   Staff/Partner Agency)**: real, and **Field Staff's resource-level
 *   scoping is now genuinely real too** (this stage's actual goal) —
 *   see `get-workspace-role.ts`. Still no membership-assignment UI for
 *   creating the *first* membership beyond direct SQL (the Team page
 *   itself is real, per "STAGE — TEAM/INVITE UI") — every real user
 *   still resolves to the least-privileged `viewer_external` role by
 *   default until a membership row exists.
 * - **Formal report export**: real — see `report/page.tsx`. Still
 *   reports on the one hardcoded demo point, not yet extended to the
 *   real location set — real, separate follow-up work, not done in
 *   this stage (same scope boundary Insurance's own Properties stage
 *   drew for itself before its own report-extension follow-up).
 * - **NOT built, honestly**: cross-agency collaboration features,
 *   custom scenario modeling, donor-specific report templates, and any
 *   AI-generated narrative synthesis of the two domains into prose —
 *   the two capabilities are shown side by side, not blended into a
 *   single AI-written paragraph, to avoid claiming a synthesis
 *   capability beyond what's actually built.
 *
 * **Not verified against the live NASA POWER API from this build
 * environment** — same caveat as every other workspace's page, now
 * applying per-location rather than once.
 */
export default async function GovernmentNgosWorkspaceHome() {
  logTelemetry.event("workspace_viewed", { workspace: WORKSPACE_ID });
  const membership = await getWorkspaceMembership(WORKSPACE_ID);
  const allLocations = await getAccountService().listLocations(WORKSPACE_ID);
  const visibleLocations = allLocations.filter((location) =>
    can(membership.role, "data:view", {
      resourceId: location.id,
      scopedResourceIds: membership.scopedResourceIds,
    }),
  );

  const statuses = await Promise.all(visibleLocations.map((location) => getLocationStatus(location)));
  const canEdit = can(membership.role, "data:edit");
  const canCreateReports = can(membership.role, "reports:create");
  const headlineInterpretation = statuses[0]?.soilMoisture;

  return (
    <WorkspaceShell activeKey="home" role={membership.role} aiInterpretation={headlineInterpretation}>
      <Text variant="pageTitle" as="h1" style={{ marginBottom: "var(--wv-space-xs)" }}>
        Jurisdiction Overview
      </Text>
      <Text
        variant="body"
        style={{ color: "var(--wv-text-secondary)", marginBottom: "var(--wv-space-lg)" }}
      >
        Real monitored locations ({allLocations.length} location{allLocations.length === 1 ? "" : "s"}),
        not real jurisdiction boundaries (see this page&apos;s honest-scope notes).
      </Text>

      {canEdit && <AddLocationForm />}

      {statuses.length === 0 ? (
        <StateDisplay
          status="empty"
          title={allLocations.length === 0 ? "No monitored locations yet" : "No locations visible for your role"}
          description={
            allLocations.length === 0
              ? "Add a monitored location above to get started."
              : "Your access is scoped to specific locations, and none are currently assigned to you."
          }
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))",
            gap: "var(--wv-space-md)",
            marginBottom: "var(--wv-space-lg)",
          }}
        >
          {statuses.map(({ location, weather, soilMoisture, ingestionGaps }) => (
            <Card key={location.id}>
              <Text variant="sectionTitle" as="p" style={{ marginBottom: "var(--wv-space-sm)" }}>
                {location.label}
              </Text>

              <Text variant="caption">CLIMATE</Text>
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

              <Text variant="caption">AGRICULTURE</Text>
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
            </Card>
          ))}
        </div>
      )}

      <Card>
        <Text variant="sectionTitle" as="p">
          Formal Report
        </Text>
        {canCreateReports ? (
          <>
            <Text
              variant="body"
              style={{ color: "var(--wv-text-secondary)", marginBottom: "var(--wv-space-sm)" }}
            >
              Generate a print-ready report of this overview, with sources and timestamps.
            </Text>
            <Link href="/workspaces/government-ngos/report" style={{ textDecoration: "none" }}>
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
