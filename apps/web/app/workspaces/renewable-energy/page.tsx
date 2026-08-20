import { NasaPowerConnector, OpenMeteoConnector } from "@world-vitality/data-ingestion";
import {
  WindGenerationStatusProvider,
  WIND_GENERATION_STATUS_CAPABILITY_ID,
  WindGenerationOutlookProvider,
  WIND_GENERATION_OUTLOOK_CAPABILITY_ID,
} from "@world-vitality/interpretation-engine";
import { Card, Text, StateDisplay, ConfidenceBadge } from "@world-vitality/ui-components";
import { WorkspaceShell } from "./workspace-shell";
import { logTelemetry } from "../../../lib/logger";

export const dynamic = "force-dynamic";

// Same demo-location approach as every other workspace — see
// Agriculture's home page comment for why (no real user-configured
// saved asset locations exist yet).
const DEMO_LOCATION = { id: "demo-location-1", latitude: 7.3775, longitude: 3.947 };

async function getCurrentGenerationStatus() {
  const connector = new NasaPowerConnector({
    locations: [DEMO_LOCATION],
    parameters: ["WS2M"],
    community: "AG",
    lookbackDays: 7,
  });
  const { records, gaps } = await connector.ingest({
    type: "manual",
    requestedBy: "renewable-energy-workspace-home-page",
  });
  const provider = new WindGenerationStatusProvider();
  const result = await provider.interpret({
    capability: WIND_GENERATION_STATUS_CAPABILITY_ID,
    records,
  });
  return { result, ingestionGaps: gaps };
}

async function getGenerationOutlook() {
  const connector = new OpenMeteoConnector({ locations: [DEMO_LOCATION], forecastDays: 7 });
  const { records, gaps } = await connector.ingest({
    type: "manual",
    requestedBy: "renewable-energy-workspace-home-page",
  });
  const provider = new WindGenerationOutlookProvider();
  const result = await provider.interpret({
    capability: WIND_GENERATION_OUTLOOK_CAPABILITY_ID,
    records,
  });
  return { result, ingestionGaps: gaps };
}

/**
 * Renewable Energy Workspace Home (BUILD_PLAN Stage 13) — the fourth
 * workspace, and the first one where the primary widget is
 * forecast-based from the start rather than added as a follow-up: the
 * PRD's own first-run experience names the **Asset Generation
 * Outlook** directly (Section A.4), and both the current-conditions
 * and forecast wind pipelines were already validated by Construction
 * (Stage 12 + its follow-up), so there was no reason to hold the
 * forecast widget back to a later ticket this time.
 *
 * **Honest scope, per widget:**
 * - **Generation Outlook (forecast)**: real — live Open-Meteo wind
 *   forecast data, classified via `WindGenerationOutlookProvider`,
 *   real lead-time confidence.
 * - **Current status**: real — live NASA POWER wind data via
 *   `WindGenerationStatusProvider`.
 * - **Wind only** — no solar or hydro assets. See
 *   `WindGenerationStatusProvider`'s doc comment for why, and for the
 *   other stated gaps (no anomaly/underperformance detection against
 *   real output, generic not asset-specific turbine envelope).
 * - **No Portfolio Risk Map, no asset-type selection at sign-up** —
 *   this workspace has one demo asset location, same limitation as
 *   every other workspace's single demo location.
 *
 * **Not verified against the live NASA POWER or Open-Meteo APIs from
 * this build environment** — same caveat as every other workspace's
 * page: this sandbox cannot reach either API directly.
 */
export default async function RenewableEnergyWorkspaceHome() {
  logTelemetry.event("workspace_viewed", { workspace: "renewable-energy" });
  const [{ result, ingestionGaps }, { result: outlookResult, ingestionGaps: outlookGaps }] =
    await Promise.all([getCurrentGenerationStatus(), getGenerationOutlook()]);

  return (
    <WorkspaceShell activeKey="home" aiInterpretation={outlookResult}>
      <Text variant="pageTitle" as="h1" style={{ marginBottom: "var(--wv-space-lg)" }}>
        Asset Generation Outlook
      </Text>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))",
          gap: "var(--wv-space-md)",
          marginBottom: "var(--wv-space-md)",
        }}
      >
        <Card style={{ gridColumn: "1 / -1" }}>
          <Text variant="caption">GENERATION OUTLOOK (NEXT 7 DAYS)</Text>
          {outlookResult.unableToAnswer ? (
            <Text
              variant="body"
              style={{ color: "var(--wv-text-secondary)", marginTop: "var(--wv-space-xs)" }}
            >
              {outlookResult.summary}
            </Text>
          ) : (
            <>
              <Text variant="body" style={{ margin: "var(--wv-space-xs) 0" }}>
                {outlookResult.summary}
              </Text>
              <ConfidenceBadge level={outlookResult.confidence} showDescription />
              <Text variant="caption" style={{ display: "block", marginTop: "var(--wv-space-sm)" }}>
                {outlookResult.explanation}
              </Text>
            </>
          )}
          {outlookGaps.length > 0 && (
            <Text variant="caption" style={{ display: "block", marginTop: "var(--wv-space-sm)" }}>
              {outlookGaps.length} forecast day(s) had no data available.
            </Text>
          )}
        </Card>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))",
          gap: "var(--wv-space-md)",
        }}
      >
        <Card>
          <Text variant="caption">CURRENT STATUS</Text>
          {result.unableToAnswer ? (
            <Text
              variant="body"
              style={{ color: "var(--wv-text-secondary)", marginTop: "var(--wv-space-xs)" }}
            >
              {result.summary}
            </Text>
          ) : (
            <>
              <Text variant="body" style={{ margin: "var(--wv-space-xs) 0" }}>
                {result.summary}
              </Text>
              <ConfidenceBadge level={result.confidence} showDescription />
            </>
          )}
          {ingestionGaps.length > 0 && (
            <Text variant="caption" style={{ display: "block", marginTop: "var(--wv-space-sm)" }}>
              {ingestionGaps.length} day(s) had no data available.
            </Text>
          )}
        </Card>
        <Card>
          <Text variant="caption">ALERTS</Text>
          <StateDisplay status="empty" title="No active alerts" />
        </Card>
      </div>
    </WorkspaceShell>
  );
}
