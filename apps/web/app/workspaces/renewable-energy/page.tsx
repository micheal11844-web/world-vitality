import { NasaPowerConnector, OpenMeteoConnector } from "@world-vitality/data-ingestion";
import {
  WindGenerationStatusProvider,
  WIND_GENERATION_STATUS_CAPABILITY_ID,
  WindGenerationOutlookProvider,
  WIND_GENERATION_OUTLOOK_CAPABILITY_ID,
  SolarIrradianceStatusProvider,
  SOLAR_IRRADIANCE_STATUS_CAPABILITY_ID,
  SolarIrradianceOutlookProvider,
  SOLAR_IRRADIANCE_OUTLOOK_CAPABILITY_ID,
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

/**
 * Solar irradiance's current-status pipeline (BUILD_PLAN "STAGE —
 * RENEWABLE ENERGY FOLLOW-UP: SOLAR IRRADIANCE"), closing the gap this
 * workspace's own doc comment named since Stage 13. A separate
 * `NasaPowerConnector` call with `community: "RE"` — NASA POWER's own
 * grouping for `ALLSKY_SFC_SW_DWN` — rather than reusing the wind
 * pipeline's `community: "AG"` call.
 */
async function getCurrentSolarStatus() {
  const connector = new NasaPowerConnector({
    locations: [DEMO_LOCATION],
    parameters: ["ALLSKY_SFC_SW_DWN"],
    community: "RE",
    lookbackDays: 7,
  });
  const { records, gaps } = await connector.ingest({
    type: "manual",
    requestedBy: "renewable-energy-workspace-home-page",
  });
  const provider = new SolarIrradianceStatusProvider();
  const result = await provider.interpret({
    capability: SOLAR_IRRADIANCE_STATUS_CAPABILITY_ID,
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
 * Solar's forecast outlook pipeline (BUILD_PLAN "STAGE — RENEWABLE
 * ENERGY FOLLOW-UP: SOLAR OUTLOOK"), closing the "no solar forecast/
 * outlook widget" gap named when solar's current-status-only provider
 * first shipped. Same `OpenMeteoConnector` call as wind's outlook could
 * reuse (both wind and solar forecast fields come from one API
 * request) — but this function issues its own call rather than sharing
 * one, matching this page's existing one-call-per-widget structure
 * rather than introducing a shared-fetch refactor as a side effect of
 * this addition.
 */
async function getSolarOutlook() {
  const connector = new OpenMeteoConnector({ locations: [DEMO_LOCATION], forecastDays: 7 });
  const { records, gaps } = await connector.ingest({
    type: "manual",
    requestedBy: "renewable-energy-workspace-home-page",
  });
  const provider = new SolarIrradianceOutlookProvider();
  const result = await provider.interpret({
    capability: SOLAR_IRRADIANCE_OUTLOOK_CAPABILITY_ID,
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
 *   `WindGenerationStatusProvider`, **and now solar irradiance** via
 *   `SolarIrradianceStatusProvider` (BUILD_PLAN "STAGE — RENEWABLE
 *   ENERGY FOLLOW-UP: SOLAR IRRADIANCE"), closing the gap this
 *   workspace's own doc comment named since Stage 13.
 * - **Solar is irradiance-level only, not generation output or
 *   capacity factor** — see `SolarIrradianceStatusProvider`'s doc
 *   comment for why this codebase can't honestly claim to estimate
 *   real kWh generated for any asset.
 * - **Still no hydro** — needs streamflow/hydrological data this
 *   codebase has no connector for at all, unchanged by this addition.
 * - **No outlook (forecast) for solar** — ~~only wind has a forecast-
 *   based `Generation Outlook` widget~~ **closed** (BUILD_PLAN "STAGE
 *   — RENEWABLE ENERGY FOLLOW-UP: SOLAR OUTLOOK"): `SolarIrradianceOutlookProvider`
 *   mirrors `WindGenerationOutlookProvider`'s exact pattern, consuming
 *   `OpenMeteoConnector`'s solar-irradiance forecast field (added
 *   alongside this provider).
 * - See `WindGenerationStatusProvider`'s doc comment for wind's own
 *   stated gaps (no anomaly/underperformance detection against real
 *   output, generic not asset-specific turbine envelope) — unchanged.
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
  const [
    { result, ingestionGaps },
    { result: outlookResult, ingestionGaps: outlookGaps },
    { result: solarResult, ingestionGaps: solarGaps },
    { result: solarOutlookResult, ingestionGaps: solarOutlookGaps },
  ] = await Promise.all([
    getCurrentGenerationStatus(),
    getGenerationOutlook(),
    getCurrentSolarStatus(),
    getSolarOutlook(),
  ]);

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
          <Text variant="caption">GENERATION OUTLOOK — WIND (NEXT 7 DAYS)</Text>
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
        <Card style={{ gridColumn: "1 / -1" }}>
          <Text variant="caption">GENERATION OUTLOOK — SOLAR (NEXT 7 DAYS)</Text>
          {solarOutlookResult.unableToAnswer ? (
            <Text
              variant="body"
              style={{ color: "var(--wv-text-secondary)", marginTop: "var(--wv-space-xs)" }}
            >
              {solarOutlookResult.summary}
            </Text>
          ) : (
            <>
              <Text variant="body" style={{ margin: "var(--wv-space-xs) 0" }}>
                {solarOutlookResult.summary}
              </Text>
              <ConfidenceBadge level={solarOutlookResult.confidence} showDescription />
              <Text variant="caption" style={{ display: "block", marginTop: "var(--wv-space-sm)" }}>
                {solarOutlookResult.explanation}
              </Text>
            </>
          )}
          {solarOutlookGaps.length > 0 && (
            <Text variant="caption" style={{ display: "block", marginTop: "var(--wv-space-sm)" }}>
              {solarOutlookGaps.length} forecast day(s) had no data available.
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
          <Text variant="caption">CURRENT STATUS — WIND</Text>
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
          <Text variant="caption">CURRENT STATUS — SOLAR</Text>
          {solarResult.unableToAnswer ? (
            <Text
              variant="body"
              style={{ color: "var(--wv-text-secondary)", marginTop: "var(--wv-space-xs)" }}
            >
              {solarResult.summary}
            </Text>
          ) : (
            <>
              <Text variant="body" style={{ margin: "var(--wv-space-xs) 0" }}>
                {solarResult.summary}
              </Text>
              <ConfidenceBadge level={solarResult.confidence} showDescription />
            </>
          )}
          {solarGaps.length > 0 && (
            <Text variant="caption" style={{ display: "block", marginTop: "var(--wv-space-sm)" }}>
              {solarGaps.length} day(s) had no data available.
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
