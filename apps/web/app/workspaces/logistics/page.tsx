import { NasaPowerConnector, OpenMeteoConnector } from "@world-vitality/data-ingestion";
import {
  LogisticsRouteRiskProvider,
  LOGISTICS_ROUTE_RISK_CAPABILITY_ID,
  LogisticsRouteRiskOutlookProvider,
  LOGISTICS_ROUTE_RISK_OUTLOOK_CAPABILITY_ID,
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

// Same reasoning as every other workspace: environmental data must be
// fetched fresh on every request, never baked in at build time.
export const dynamic = "force-dynamic";

// Same demo-location approach as every other workspace (no real
// user-configured routes exist yet — PRD Section A.5's "sign-up
// captures typical routes/regions of operation" isn't built). This
// evaluates one point, not an actual multi-waypoint route — see this
// page's own doc comment for what that means honestly.
// Fallback only: a user with a home place from onboarding sees that instead
// (`resolveWorkspaceLocation`), and the page says which one it is.
const DEMO_LOCATION = {
  id: "demo-location-1",
  latitude: 7.3775,
  longitude: 3.947,
  label: "Ibadan, Nigeria",
};

async function getRouteRiskStatus(location: WorkspaceLocation) {
  const connector = new NasaPowerConnector({
    locations: [location],
    parameters: ["WS2M"],
    community: "AG",
    lookbackDays: 7,
  });

  const { records, gaps } = await connector.ingest({
    type: "manual",
    requestedBy: "logistics-workspace-home-page",
  });

  const provider = new LogisticsRouteRiskProvider();
  const result = await provider.interpret({
    capability: LOGISTICS_ROUTE_RISK_CAPABILITY_ID,
    records,
  });

  return { result, ingestionGaps: gaps };
}

/**
 * Route Risk's forecast outlook pipeline (BUILD_PLAN "STAGE — LOGISTICS
 * & SHIPPING FOLLOW-UP: ROUTE RISK OUTLOOK"), closing the "no
 * forecast-based outlook yet" gap this page's own doc comment named
 * when the current-conditions-only Route Risk Status widget first
 * shipped. Same `OpenMeteoConnector` wind-speed forecast pipeline
 * Construction's Site Risk Timeline and Renewable Energy's Wind/Solar
 * outlooks already validated, reused unchanged here.
 */
async function getRouteRiskOutlook(location: WorkspaceLocation) {
  const connector = new OpenMeteoConnector({ locations: [location], forecastDays: 7 });
  const { records, gaps } = await connector.ingest({
    type: "manual",
    requestedBy: "logistics-workspace-home-page",
  });
  const provider = new LogisticsRouteRiskOutlookProvider();
  const result = await provider.interpret({
    capability: LOGISTICS_ROUTE_RISK_OUTLOOK_CAPABILITY_ID,
    records,
  });
  return { result, ingestionGaps: gaps };
}

/**
 * Logistics & Shipping Workspace Home (BUILD_PLAN "STAGE — LOGISTICS &
 * SHIPPING WORKSPACE") — the sixth workspace, second of the six
 * previously-unbuilt PRD workspaces (after Public Explorer), reusing
 * `NasaPowerConnector` unchanged (`WS2M` only) and following the same
 * widget-grid layout pattern as every other workspace.
 *
 * **Honest scope, per widget, and for this workspace as a whole —
 * this covers a small fraction of PRD A.5's actual ambition, stated
 * plainly rather than glossed over:**
 * - **Route Risk Status widget**: real — live NASA POWER wind-speed
 *   data, real risk-band classification via
 *   `LogisticsRouteRiskProvider`, real confidence, plus a real
 *   forecast-based **Route Risk Outlook** widget
 *   (`LogisticsRouteRiskOutlookProvider`, same `OpenMeteoConnector`
 *   pipeline every other outlook widget in this app uses). But: single
 *   point, not an actual multi-waypoint route (no route/waypoint data
 *   model exists anywhere in this app yet); wind-only for both widgets
 *   (no storm-track, port-status, or flooding data source exists).
 * - **Alerts, disruption reports, fleet-wide summary**: honest empty
 *   states — no alert/disruption-event/fleet data model exists yet
 *   (same gap every other workspace's first cut already documents).
 * - **No Map widget on this page** — the map lives at
 *   `/workspaces/logistics/map`, same pattern as every other
 *   workspace.
 *
 * **Not verified against the live NASA POWER or Open-Meteo APIs from
 * this build environment** — same caveat as every other workspace's
 * page: this sandbox cannot reach power.larc.nasa.gov or
 * api.open-meteo.com, so both pipelines are written to handle real
 * responses but haven't been exercised against one yet.
 */
export default async function LogisticsWorkspaceHome() {
  logTelemetry.event("workspace_viewed", { workspace: "logistics" });
  const { t, locale } = await getTranslator();
  // The engine's sentences are English; on a translated page they are marked as such.
  const englishOnly = locale === "en" ? {} : ({ lang: "en", dir: "ltr" } as const);
  const caption = { textTransform: "uppercase" } as const;
  const location = await resolveWorkspaceLocation(DEMO_LOCATION);
  const { result, ingestionGaps } = await getRouteRiskStatus(location);
  // The 7-day outlook is a plan feature; when the plan lacks it the forecast
  // is not even requested (see lib/plan-features.ts).
  const outlookLocked = await featureLockedFor("forecastOutlooks");
  const outlook = outlookLocked ? null : await getRouteRiskOutlook(location);

  return (
    <WorkspaceShell activeKey="home" aiInterpretation={result}>
      <Text variant="pageTitle" as="h1" style={{ marginBottom: "var(--wv-space-lg)" }}>
        {t("logistics.title")}
      </Text>
      <LocationNote location={location} t={t} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))",
          gap: "var(--wv-space-md)",
          marginBottom: "var(--wv-space-md)",
        }}
      >
        <Card>
          <Text variant="caption" style={caption}>
            {t("workspace.status")}
          </Text>
          <Text variant="sectionTitle" as="p" style={{ margin: "var(--wv-space-xs) 0" }}>
            {t("nav.routeRisk")}
          </Text>
          {result.unableToAnswer ? (
            <div {...englishOnly}>
              <Text variant="body" style={{ color: "var(--wv-text-secondary)" }}>
                {result.summary}
              </Text>
            </div>
          ) : (
            <>
              <div {...englishOnly}>
                <Text variant="body" style={{ marginBottom: "var(--wv-space-xs)" }}>
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
            {t("workspace.alerts")}
          </Text>
          <StateDisplay status="empty" title={t("workspace.noActiveAlerts")} />
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
            {t("logistics.outlook")}
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
        <Card>
          <Text variant="caption" style={caption}>
            {t("logistics.disruptionReports")}
          </Text>
          <StateDisplay status="empty" title={t("logistics.noDisruptions")} />
        </Card>
      </div>
    </WorkspaceShell>
  );
}
