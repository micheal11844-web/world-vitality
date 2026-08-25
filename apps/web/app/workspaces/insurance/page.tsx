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

const WORKSPACE_ID = "insurance";

// Same shared demo location as every other single-point workspace
// (Agriculture, Weather, Construction, Renewable Energy, Government &
// NGOs) — one address, not a real insured portfolio.
const DEMO_LOCATION = {
  id: "demo-insured-location-1",
  latitude: 7.3775,
  longitude: 3.947,
  label: "Demo Insured Location",
};

async function getRiskContext() {
  const connector = new NasaPowerConnector({
    locations: [DEMO_LOCATION],
    parameters: ["T2M", "GWETROOT"],
    community: "AG",
    lookbackDays: 7,
  });
  const { records, gaps } = await connector.ingest({
    type: "manual",
    requestedBy: "insurance-workspace-home-page",
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
 * Insurance Workspace Home — Underwriting Risk Context (BUILD_PLAN
 * "STAGE — INSURANCE WORKSPACE", the fifth of the six previously-
 * unbuilt PRD workspaces, PRD Section A.3). Scoped and confirmed with
 * the owner explicitly before building, per PRD A.3's near-audit-grade
 * stakes and the PRD's own recommendation (Section on cross-workspace
 * gaps) that Insurance sits at the strictest end of the AI
 * confidence/rigor spectrum.
 *
 * **Honest scope, stated plainly — this covers a real but narrow slice
 * of PRD A.3's actual ambition:**
 * - **What this page shows is real**: two already-proven interpretation
 *   capabilities (`WeatherStatusProvider`, `SoilMoistureStatusProvider`)
 *   for one address, shown side by side with individual confidence
 *   scores — the same honest-synthesis pattern
 *   `government-ngos/page.tsx` established, reusing capabilities
 *   already tested and live elsewhere rather than inventing new AI
 *   risk for this workspace.
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
 *   applied to decline multi-hazard AI cross-validation, applied here
 *   for a workspace with even higher real-world stakes (underwriting
 *   and claims decisions with direct financial consequence for
 *   policyholders).
 * - **No portfolio, no multi-address upload, no policy data model** —
 *   this app has no schema for an insurer's book of business anywhere.
 *   One demo address, same limitation as every other narrow-slice
 *   workspace.
 * - **No claims-verification-against-historical-data tool** — would
 *   need a historical event archive this app doesn't have (Disaster
 *   Monitoring relays only live/current data, by design).
 * - **Institutional permission tiers (Admin/Underwriter/Claims
 *   Adjuster/Analyst)**: real, using the same role-lookup machinery
 *   `government-ngos` introduced — see `workspace-shell.tsx` for the
 *   PRD-name mapping. Same fail-safe-to-viewer_external default until
 *   a real invite/admin UI exists.
 * - **Auditable report export**: real — see `report/page.tsx`. Both
 *   the PDF (browser print) and the underlying access are logged to
 *   this app's first real audit trail (`audit_log` table), directly
 *   satisfying PRD A.3's "audit-logged access" requirement rather than
 *   just labeling the export "auditable."
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
  const role = await getWorkspaceRole(WORKSPACE_ID);
  const { weather, soilMoisture, ingestionGaps } = await getRiskContext();
  const canCreateReports = can(role, "reports:create");

  return (
    <WorkspaceShell activeKey="home" role={role}>
      <Text variant="pageTitle" as="h1" style={{ marginBottom: "var(--wv-space-xs)" }}>
        Underwriting Risk Context
      </Text>
      <Text
        variant="body"
        style={{ color: "var(--wv-text-secondary)", marginBottom: "var(--wv-space-lg)" }}
      >
        {DEMO_LOCATION.label} — a single demo address, not a real insured portfolio. Individual
        hazard signals only; no synthesized multi-hazard risk score (see this page&apos;s
        honest-scope notes).
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
          <Text variant="caption">TEMPERATURE</Text>
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
          <Text variant="caption">SOIL / DROUGHT-ADJACENT</Text>
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
