import { NasaPowerConnector } from "@world-vitality/data-ingestion";
import {
  WeatherStatusProvider,
  WEATHER_TEMPERATURE_CAPABILITY_ID,
  SoilMoistureStatusProvider,
  SOIL_MOISTURE_CAPABILITY_ID,
} from "@world-vitality/interpretation-engine";
import { can } from "@world-vitality/identity-service";
import { Card, Text, StateDisplay, ConfidenceBadge, Button } from "@world-vitality/ui-components";
import Link from "next/link";
import { WorkspaceShell } from "./workspace-shell";
import { getWorkspaceRole } from "../../../lib/get-workspace-role";
import { logTelemetry } from "../../../lib/logger";

export const dynamic = "force-dynamic";

const WORKSPACE_ID = "government-ngos";

// Same shared demo location as Agriculture/Weather/Construction/
// Renewable Energy — a single point, not a real jurisdiction boundary.
// See this file's own honest-scope doc comment.
const DEMO_LOCATION = {
  id: "demo-jurisdiction-1",
  latitude: 7.3775,
  longitude: 3.947,
  label: "Demo Jurisdiction",
};

async function getJurisdictionOverview() {
  const connector = new NasaPowerConnector({
    locations: [DEMO_LOCATION],
    parameters: ["T2M", "GWETROOT"],
    community: "AG",
    lookbackDays: 7,
  });
  const { records, gaps } = await connector.ingest({
    type: "manual",
    requestedBy: "government-ngos-workspace-home-page",
  });

  const weather = await new WeatherStatusProvider().interpret({
    capability: WEATHER_TEMPERATURE_CAPABILITY_ID,
    records,
  });
  const soilMoisture = await new SoilMoistureStatusProvider().interpret({
    capability: SOIL_MOISTURE_CAPABILITY_ID,
    records,
  });

  return { weather, soilMoisture, ingestionGaps: gaps };
}

/**
 * Government & NGOs Workspace Home — Jurisdiction Overview (BUILD_PLAN
 * "STAGE — GOVERNMENT & NGOS WORKSPACE", the fourth of the six
 * previously-unbuilt PRD workspaces). Scoped and confirmed with the
 * owner explicitly before building, per PRD A.10's institutional/public-
 * accountability stakes.
 *
 * **Honest scope, stated plainly, not silently glossed over — this
 * covers a fraction of PRD A.10's actual ambition:**
 * - **Multi-domain overview**: real — reuses two already-proven,
 *   already-tested interpretation capabilities (`WeatherStatusProvider`,
 *   `SoilMoistureStatusProvider`) for one point, genuinely synthesizing
 *   climate and agriculture signals into one view, but built entirely
 *   from capabilities already live elsewhere — no new AI risk
 *   introduced for this workspace.
 * - **Real jurisdiction boundaries**: NOT built — this app has no GIS
 *   polygon data anywhere. `DEMO_LOCATION` is a single point, same
 *   honest limitation every "narrow slice" workspace (Logistics,
 *   Disaster Monitoring) already carries.
 * - **Institutional permission tiers (Agency Admin/Analyst/Field
 *   Staff/Partner Agency)**: real, wired for the first time in this
 *   app — see `get-workspace-role.ts`. The report-export link below is
 *   genuinely gated on `can(role, "reports:create")`, not just labeled
 *   as if it were. Honest caveat: no membership-assignment UI exists
 *   anywhere in this app yet (no invite flow, no admin console), so
 *   every real user currently resolves to the least-privileged
 *   `viewer_external` role by default until a membership row is
 *   created directly.
 * - **Formal report export**: real — see `report/page.tsx`, a
 *   print-optimized page (the browser's native Print → Save as PDF,
 *   not a new server-side PDF-generation dependency this app has never
 *   used before).
 * - **NOT built, honestly**: cross-agency collaboration features,
 *   custom scenario modeling, donor-specific report templates, and any
 *   AI-generated narrative synthesis of the two domains into prose —
 *   the two capabilities are shown side by side, not blended into a
 *   single AI-written paragraph, to avoid claiming a synthesis
 *   capability beyond what's actually built.
 *
 * **Not verified against the live NASA POWER API from this build
 * environment** — same caveat as every other workspace's page.
 */
export default async function GovernmentNgosWorkspaceHome() {
  logTelemetry.event("workspace_viewed", { workspace: WORKSPACE_ID });
  const role = await getWorkspaceRole(WORKSPACE_ID);
  const { weather, soilMoisture, ingestionGaps } = await getJurisdictionOverview();
  const canCreateReports = can(role, "reports:create");

  return (
    <WorkspaceShell activeKey="home" role={role}>
      <Text variant="pageTitle" as="h1" style={{ marginBottom: "var(--wv-space-xs)" }}>
        Jurisdiction Overview
      </Text>
      <Text
        variant="body"
        style={{ color: "var(--wv-text-secondary)", marginBottom: "var(--wv-space-lg)" }}
      >
        {DEMO_LOCATION.label} — a single demo point, not a real jurisdiction boundary (see this
        page&apos;s honest-scope notes).
      </Text>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))",
          gap: "var(--wv-space-md)",
          marginBottom: "var(--wv-space-md)",
        }}
      >
        <Card>
          <Text variant="caption">CLIMATE</Text>
          <Text variant="sectionTitle" as="p" style={{ margin: "var(--wv-space-xs) 0" }}>
            Weather Status
          </Text>
          {weather.unableToAnswer ? (
            <Text variant="body" style={{ color: "var(--wv-text-secondary)" }}>
              {weather.summary}
            </Text>
          ) : (
            <>
              <Text variant="body" style={{ marginBottom: "var(--wv-space-xs)" }}>
                {weather.summary}
              </Text>
              <ConfidenceBadge level={weather.confidence} showDescription />
            </>
          )}
        </Card>

        <Card>
          <Text variant="caption">AGRICULTURE</Text>
          <Text variant="sectionTitle" as="p" style={{ margin: "var(--wv-space-xs) 0" }}>
            Soil Moisture Status
          </Text>
          {soilMoisture.unableToAnswer ? (
            <Text variant="body" style={{ color: "var(--wv-text-secondary)" }}>
              {soilMoisture.summary}
            </Text>
          ) : (
            <>
              <Text variant="body" style={{ marginBottom: "var(--wv-space-xs)" }}>
                {soilMoisture.summary}
              </Text>
              <ConfidenceBadge level={soilMoisture.confidence} showDescription />
            </>
          )}
        </Card>
      </div>

      {ingestionGaps.length > 0 && (
        <Text variant="caption" style={{ display: "block", marginBottom: "var(--wv-space-md)" }}>
          {ingestionGaps.length} day(s) had no data available.
        </Text>
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
