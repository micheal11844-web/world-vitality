import {
  NasaPowerConnector,
  OpenMeteoConnector,
  UsgsStreamflowConnector,
} from "@world-vitality/data-ingestion";
import {
  WindGenerationStatusProvider,
  WIND_GENERATION_STATUS_CAPABILITY_ID,
  WindGenerationOutlookProvider,
  WIND_GENERATION_OUTLOOK_CAPABILITY_ID,
  SolarIrradianceStatusProvider,
  SOLAR_IRRADIANCE_STATUS_CAPABILITY_ID,
  SolarIrradianceOutlookProvider,
  SOLAR_IRRADIANCE_OUTLOOK_CAPABILITY_ID,
  HydroFlowStatusProvider,
  HYDRO_FLOW_STATUS_CAPABILITY_ID,
} from "@world-vitality/interpretation-engine";
import { Card, Text, StateDisplay, ConfidenceBadge } from "@world-vitality/ui-components";
import { WorkspaceShell } from "./workspace-shell";
import { logTelemetry } from "../../../lib/logger";
import { getTranslator } from "../../../lib/i18n/server";
import { resolveWorkspaceLocation, type WorkspaceLocation } from "../../../lib/home-location";
import { LocationNote } from "../location-note";
import { featureLockedFor } from "../../../lib/plan-features";
import { FeatureLockedNote } from "../../plan-notice";
import { DataCredit } from "../../data-credit";

export const dynamic = "force-dynamic";

// Same demo-location approach as every other workspace — see
// Agriculture's home page comment for why (no real user-configured
// saved asset locations exist yet).
// Fallback only: a user with a home place from onboarding sees that instead
// (`resolveWorkspaceLocation`), and the page says which one it is.
const DEMO_LOCATION = {
  id: "demo-location-1",
  latitude: 7.3775,
  longitude: 3.947,
  label: "Ibadan, Nigeria",
};

// Hydro's demo site is deliberately different from every other demo
// location in this workspace (and this app): streamflow is only
// measured at fixed USGS gauge stations, not any point on Earth — see
// `UsgsStreamflowConnector`'s doc comment. This is USGS site 01646500,
// Potomac River at Little Falls Pump Station near Washington, DC — a
// real, long-running, reliably-active gauge, not a placeholder.
const DEMO_GAUGE_STATION = {
  id: "potomac-little-falls",
  siteNumber: "01646500",
  latitude: 38.94974,
  longitude: -77.12786,
};

async function getCurrentGenerationStatus(location: WorkspaceLocation) {
  const connector = new NasaPowerConnector({
    locations: [location],
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
async function getCurrentSolarStatus(location: WorkspaceLocation) {
  const connector = new NasaPowerConnector({
    locations: [location],
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

async function getGenerationOutlook(location: WorkspaceLocation) {
  const connector = new OpenMeteoConnector({ locations: [location], forecastDays: 7 });
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
async function getSolarOutlook(location: WorkspaceLocation) {
  const connector = new OpenMeteoConnector({ locations: [location], forecastDays: 7 });
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
 * Hydro's current-status pipeline (BUILD_PLAN "STAGE — RENEWABLE
 * ENERGY FOLLOW-UP: HYDRO"), closing the last of the PRD's three named
 * asset types. Uses a real US gauge station (`DEMO_GAUGE_STATION`), not
 * `DEMO_LOCATION` — see that constant's own doc comment for why. No
 * outlook counterpart exists for hydro (see `UsgsStreamflowConnector`'s
 * doc comment for why).
 */
async function getCurrentHydroStatus() {
  const connector = new UsgsStreamflowConnector({ stations: [DEMO_GAUGE_STATION] });
  const { records, gaps } = await connector.ingest({
    type: "manual",
    requestedBy: "renewable-energy-workspace-home-page",
  });
  const provider = new HydroFlowStatusProvider();
  const result = await provider.interpret({
    capability: HYDRO_FLOW_STATUS_CAPABILITY_ID,
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
 * - **Still no hydro** — ~~needs streamflow/hydrological data this
 *   codebase has no connector for at all~~ **closed** (BUILD_PLAN
 *   "STAGE — RENEWABLE ENERGY FOLLOW-UP: HYDRO"): `HydroFlowStatusProvider`
 *   consumes real-time discharge from `UsgsStreamflowConnector` (USGS
 *   NWIS, free, no key). **Genuinely different from wind/solar in two
 *   ways, stated honestly**: (1) streamflow is only measured at fixed
 *   US gauge stations, not any point on Earth, so hydro uses its own
 *   dedicated demo site (`DEMO_GAUGE_STATION`, a real Potomac River
 *   gauge), not the shared `DEMO_LOCATION`; (2) no forecast/outlook
 *   exists for hydro — USGS NWIS has no public streamflow forecast API,
 *   so this is current-conditions only, unlike wind and solar which
 *   both now have outlook widgets. Streamflow *level*, not generation
 *   output or capacity factor — same "describe the resource, not the
 *   output" discipline as solar, since this codebase has no turbine/
 *   head/penstock specification for any real hydro asset either.
 *   Renewable Energy now covers all three of PRD A.4's named asset
 *   types (solar, wind, hydro).
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
 * **Not verified against the live NASA POWER, Open-Meteo, or USGS NWIS
 * APIs from this build environment** — same caveat as every other
 * workspace's page: this sandbox cannot reach any of them directly.
 */
export default async function RenewableEnergyWorkspaceHome() {
  logTelemetry.event("workspace_viewed", { workspace: "renewable-energy" });
  const { t, locale } = await getTranslator();
  // The engine's sentences are English; on a translated page they are marked as such.
  const englishOnly = locale === "en" ? {} : ({ lang: "en", dir: "ltr" } as const);
  const caption = { textTransform: "uppercase" } as const;
  const location = await resolveWorkspaceLocation(DEMO_LOCATION);
  // The two 7-day outlooks are a plan feature; when the plan lacks it they are
  // not even requested (see lib/plan-features.ts).
  const outlookLocked = await featureLockedFor("forecastOutlooks");
  const [
    { result, ingestionGaps },
    outlook,
    { result: solarResult, ingestionGaps: solarGaps },
    solarOutlook,
    { result: hydroResult, ingestionGaps: hydroGaps },
  ] = await Promise.all([
    getCurrentGenerationStatus(location),
    outlookLocked ? Promise.resolve(null) : getGenerationOutlook(location),
    getCurrentSolarStatus(location),
    outlookLocked ? Promise.resolve(null) : getSolarOutlook(location),
    getCurrentHydroStatus(),
  ]);

  return (
    <WorkspaceShell activeKey="home" aiInterpretation={outlook ? outlook.result : result}>
      <Text variant="pageTitle" as="h1" style={{ marginBottom: "var(--wv-space-lg)" }}>
        {t("renewable.title")}
      </Text>
      <LocationNote location={location} t={t} note={t("renewable.hydroNote")} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))",
          gap: "var(--wv-space-md)",
          marginBottom: "var(--wv-space-md)",
        }}
      >
        <Card style={{ gridColumn: "1 / -1" }}>
          <Text variant="caption" style={caption}>
            {t("renewable.outlookWind")}
          </Text>
          {outlook === null ? (
            <FeatureLockedNote message={outlookLocked} />
          ) : (
            <>
              {outlook.result.unableToAnswer ? (
                <div {...englishOnly}>
                  <Text
                    variant="body"
                    style={{ color: "var(--wv-text-secondary)", marginTop: "var(--wv-space-xs)" }}
                  >
                    {outlook.result.summary}
                  </Text>
                </div>
              ) : (
                <>
                  <div {...englishOnly}>
                    <Text variant="body" style={{ margin: "var(--wv-space-xs) 0" }}>
                      {outlook.result.summary}
                    </Text>
                  </div>
                  <div {...englishOnly}>
                    <ConfidenceBadge level={outlook.result.confidence} showDescription />
                  </div>
                  <div {...englishOnly}>
                    <Text
                      variant="caption"
                      style={{ display: "block", marginTop: "var(--wv-space-sm)" }}
                    >
                      {outlook.result.explanation}
                    </Text>
                  </div>
                </>
              )}
              {outlook.ingestionGaps.length > 0 && (
                <Text
                  variant="caption"
                  style={{ display: "block", marginTop: "var(--wv-space-sm)" }}
                >
                  {t("workspace.forecastGaps", { count: outlook.ingestionGaps.length })}
                </Text>
              )}
              {!outlook.result.unableToAnswer && <DataCredit kind="weather" />}
            </>
          )}
        </Card>
        <Card style={{ gridColumn: "1 / -1" }}>
          <Text variant="caption" style={caption}>
            {t("renewable.outlookSolar")}
          </Text>
          {solarOutlook === null ? (
            <FeatureLockedNote message={outlookLocked} />
          ) : (
            <>
              {solarOutlook.result.unableToAnswer ? (
                <div {...englishOnly}>
                  <Text
                    variant="body"
                    style={{ color: "var(--wv-text-secondary)", marginTop: "var(--wv-space-xs)" }}
                  >
                    {solarOutlook.result.summary}
                  </Text>
                </div>
              ) : (
                <>
                  <div {...englishOnly}>
                    <Text variant="body" style={{ margin: "var(--wv-space-xs) 0" }}>
                      {solarOutlook.result.summary}
                    </Text>
                  </div>
                  <div {...englishOnly}>
                    <ConfidenceBadge level={solarOutlook.result.confidence} showDescription />
                  </div>
                  <div {...englishOnly}>
                    <Text
                      variant="caption"
                      style={{ display: "block", marginTop: "var(--wv-space-sm)" }}
                    >
                      {solarOutlook.result.explanation}
                    </Text>
                  </div>
                </>
              )}
              {solarOutlook.ingestionGaps.length > 0 && (
                <Text
                  variant="caption"
                  style={{ display: "block", marginTop: "var(--wv-space-sm)" }}
                >
                  {t("workspace.forecastGaps", { count: solarOutlook.ingestionGaps.length })}
                </Text>
              )}
              {!solarOutlook.result.unableToAnswer && <DataCredit kind="weather" />}
            </>
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
          <Text variant="caption" style={caption}>
            {t("renewable.statusWind")}
          </Text>
          {result.unableToAnswer ? (
            <div {...englishOnly}>
              <Text
                variant="body"
                style={{ color: "var(--wv-text-secondary)", marginTop: "var(--wv-space-xs)" }}
              >
                {result.summary}
              </Text>
            </div>
          ) : (
            <>
              <div {...englishOnly}>
                <Text variant="body" style={{ margin: "var(--wv-space-xs) 0" }}>
                  {result.summary}
                </Text>
              </div>
              <div {...englishOnly}>
                <ConfidenceBadge level={result.confidence} showDescription />
              </div>
            </>
          )}
          {ingestionGaps.length > 0 && (
            <Text variant="caption" style={{ display: "block", marginTop: "var(--wv-space-sm)" }}>
              {t("workspace.gaps", { count: ingestionGaps.length })}
            </Text>
          )}
        </Card>
        <Card>
          <Text variant="caption" style={caption}>
            {t("renewable.statusSolar")}
          </Text>
          {solarResult.unableToAnswer ? (
            <div {...englishOnly}>
              <Text
                variant="body"
                style={{ color: "var(--wv-text-secondary)", marginTop: "var(--wv-space-xs)" }}
              >
                {solarResult.summary}
              </Text>
            </div>
          ) : (
            <>
              <div {...englishOnly}>
                <Text variant="body" style={{ margin: "var(--wv-space-xs) 0" }}>
                  {solarResult.summary}
                </Text>
              </div>
              <div {...englishOnly}>
                <ConfidenceBadge level={solarResult.confidence} showDescription />
              </div>
            </>
          )}
          {solarGaps.length > 0 && (
            <Text variant="caption" style={{ display: "block", marginTop: "var(--wv-space-sm)" }}>
              {t("workspace.gaps", { count: solarGaps.length })}
            </Text>
          )}
        </Card>
        <Card>
          <Text variant="caption" style={caption}>
            {t("renewable.statusHydro")}
          </Text>
          {hydroResult.unableToAnswer ? (
            <div {...englishOnly}>
              <Text
                variant="body"
                style={{ color: "var(--wv-text-secondary)", marginTop: "var(--wv-space-xs)" }}
              >
                {hydroResult.summary}
              </Text>
            </div>
          ) : (
            <>
              <div {...englishOnly}>
                <Text variant="body" style={{ margin: "var(--wv-space-xs) 0" }}>
                  {hydroResult.summary}
                </Text>
              </div>
              <div {...englishOnly}>
                <ConfidenceBadge level={hydroResult.confidence} showDescription />
              </div>
            </>
          )}
          {hydroGaps.length > 0 && (
            <Text variant="caption" style={{ display: "block", marginTop: "var(--wv-space-sm)" }}>
              {t("renewable.hydroGaps", { count: hydroGaps.length })}
            </Text>
          )}
        </Card>
        <Card>
          <Text variant="caption" style={caption}>
            {t("workspace.alerts")}
          </Text>
          <StateDisplay status="empty" title={t("workspace.noActiveAlerts")} />
        </Card>
      </div>
    </WorkspaceShell>
  );
}
