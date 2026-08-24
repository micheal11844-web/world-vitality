import { NasaPowerConnector } from "@world-vitality/data-ingestion";
import {
  WeatherStatusProvider,
  WEATHER_TEMPERATURE_CAPABILITY_ID,
  SoilMoistureStatusProvider,
  SOIL_MOISTURE_CAPABILITY_ID,
} from "@world-vitality/interpretation-engine";
import { can } from "@world-vitality/identity-service";
import { Card, Text, StateDisplay, ConfidenceBadge } from "@world-vitality/ui-components";
import { WorkspaceShell } from "../workspace-shell";
import { getWorkspaceRole } from "../../../../lib/get-workspace-role";
import { PrintButton } from "./print-button";

export const dynamic = "force-dynamic";

const WORKSPACE_ID = "government-ngos";
const DEMO_LOCATION = {
  id: "demo-jurisdiction-1",
  latitude: 7.3775,
  longitude: 3.947,
  label: "Demo Jurisdiction",
};

async function getReportData() {
  const connector = new NasaPowerConnector({
    locations: [DEMO_LOCATION],
    parameters: ["T2M", "GWETROOT"],
    community: "AG",
    lookbackDays: 7,
  });
  const { records } = await connector.ingest({
    type: "manual",
    requestedBy: "government-ngos-report",
  });

  const weather = await new WeatherStatusProvider().interpret({
    capability: WEATHER_TEMPERATURE_CAPABILITY_ID,
    records,
  });
  const soilMoisture = await new SoilMoistureStatusProvider().interpret({
    capability: SOIL_MOISTURE_CAPABILITY_ID,
    records,
  });

  return { weather, soilMoisture };
}

/**
 * Government & NGOs' formal report page (BUILD_PLAN "STAGE —
 * GOVERNMENT & NGOS WORKSPACE"). **Enforces `can(role, "reports:create")`
 * itself, server-side — not just a hidden link on the home page.** The
 * home page's link only appearing for permitted roles is a UX
 * convenience, not the actual security boundary; a `viewer_external`
 * user navigating here directly is still denied, checked again on this
 * page. This is the same "gate every route that matters, not just the
 * link to it" principle `requireSession()` already established for
 * authentication — applied here to authorization for the first time.
 *
 * Print-optimized via a scoped `<style>` block (`@media print` hides
 * the app shell chrome, keeps only the report content) — see
 * `print-button.tsx`'s doc comment for why this is the export
 * mechanism rather than a new server-side PDF library.
 */
export default async function GovernmentNgosReportPage() {
  const role = await getWorkspaceRole(WORKSPACE_ID);

  if (!can(role, "reports:create")) {
    return (
      <WorkspaceShell activeKey="home" role={role}>
        <StateDisplay
          status="error"
          title="Access denied"
          description="This role does not have permission to create reports in this workspace."
        />
      </WorkspaceShell>
    );
  }

  const { weather, soilMoisture } = await getReportData();
  const generatedAt = new Date().toISOString();

  return (
    <WorkspaceShell activeKey="home" role={role}>
      <style>{`
        @media print {
          [data-app-shell-chrome] { display: none !important; }
          [data-report-content] { padding: 0 !important; }
        }
      `}</style>
      <div data-report-content style={{ maxWidth: "40rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "var(--wv-space-lg)",
          }}
        >
          <div>
            <Text variant="pageTitle" as="h1">
              Jurisdiction Overview Report
            </Text>
            <Text variant="caption" style={{ color: "var(--wv-text-secondary)" }}>
              {DEMO_LOCATION.label} · Generated {generatedAt}
            </Text>
          </div>
          <PrintButton />
        </div>

        <Text
          variant="caption"
          style={{
            display: "block",
            marginBottom: "var(--wv-space-lg)",
            color: "var(--wv-text-secondary)",
          }}
        >
          This report is derived from a single demo location, not a real jurisdiction boundary — not
          suitable for public, policy, or donor documentation as-is. See World Vitality&apos;s data
          provenance documentation for source details.
        </Text>

        <Card>
          <Text variant="sectionTitle" as="h2">
            Climate — Weather Status
          </Text>
          <Text variant="body" style={{ margin: "var(--wv-space-xs) 0" }}>
            {weather.summary}
          </Text>
          {!weather.unableToAnswer && (
            <ConfidenceBadge level={weather.confidence} showDescription />
          )}
        </Card>

        <div style={{ height: "var(--wv-space-md)" }} />

        <Card>
          <Text variant="sectionTitle" as="h2">
            Agriculture — Soil Moisture Status
          </Text>
          <Text variant="body" style={{ margin: "var(--wv-space-xs) 0" }}>
            {soilMoisture.summary}
          </Text>
          {!soilMoisture.unableToAnswer && (
            <ConfidenceBadge level={soilMoisture.confidence} showDescription />
          )}
        </Card>
      </div>
    </WorkspaceShell>
  );
}
