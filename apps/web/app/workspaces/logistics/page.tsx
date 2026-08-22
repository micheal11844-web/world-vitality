import { NasaPowerConnector } from "@world-vitality/data-ingestion";
import {
  LogisticsRouteRiskProvider,
  LOGISTICS_ROUTE_RISK_CAPABILITY_ID,
} from "@world-vitality/interpretation-engine";
import { Card, Text, StateDisplay, ConfidenceBadge } from "@world-vitality/ui-components";
import { WorkspaceShell } from "./workspace-shell";
import { logTelemetry } from "../../../lib/logger";

// Same reasoning as every other workspace: environmental data must be
// fetched fresh on every request, never baked in at build time.
export const dynamic = "force-dynamic";

// Same demo-location approach as every other workspace (no real
// user-configured routes exist yet — PRD Section A.5's "sign-up
// captures typical routes/regions of operation" isn't built). This
// evaluates one point, not an actual multi-waypoint route — see this
// page's own doc comment for what that means honestly.
const DEMO_LOCATION = { id: "demo-location-1", latitude: 7.3775, longitude: 3.947 };

async function getRouteRiskStatus() {
  const connector = new NasaPowerConnector({
    locations: [DEMO_LOCATION],
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
 *   `LogisticsRouteRiskProvider`, real confidence. But: single point,
 *   not an actual multi-waypoint route (no route/waypoint data model
 *   exists anywhere in this app yet); wind-only (no storm-track,
 *   port-status, or flooding data source exists); current conditions
 *   only, no forecast-based outlook yet (`classifyRouteRisk` is
 *   already exported in anticipation of that follow-up, same pattern
 *   Construction and Renewable Energy both used).
 * - **Alerts, disruption reports, fleet-wide summary**: honest empty
 *   states — no alert/disruption-event/fleet data model exists yet
 *   (same gap every other workspace's first cut already documents).
 * - **No Map widget on this page** — the map lives at
 *   `/workspaces/logistics/map`, same pattern as every other
 *   workspace.
 *
 * **Not verified against the live NASA POWER API from this build
 * environment** — same caveat as every other workspace's page: this
 * sandbox cannot reach power.larc.nasa.gov, so this is written to
 * handle both outcomes but hasn't been exercised against a real
 * request yet.
 */
export default async function LogisticsWorkspaceHome() {
  logTelemetry.event("workspace_viewed", { workspace: "logistics" });
  const { result, ingestionGaps } = await getRouteRiskStatus();

  return (
    <WorkspaceShell activeKey="home" aiInterpretation={result}>
      <Text variant="pageTitle" as="h1" style={{ marginBottom: "var(--wv-space-lg)" }}>
        Route Risk Status
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
          <Text variant="caption">STATUS</Text>
          <Text variant="sectionTitle" as="p" style={{ margin: "var(--wv-space-xs) 0" }}>
            Route Risk
          </Text>
          {result.unableToAnswer ? (
            <Text variant="body" style={{ color: "var(--wv-text-secondary)" }}>
              {result.summary}
            </Text>
          ) : (
            <>
              <Text variant="body" style={{ marginBottom: "var(--wv-space-xs)" }}>
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))",
          gap: "var(--wv-space-md)",
        }}
      >
        <Card>
          <Text variant="caption">ROUTE RISK OUTLOOK</Text>
          <StateDisplay status="empty" title="No forecast outlook yet" />
        </Card>
        <Card>
          <Text variant="caption">DISRUPTION REPORTS</Text>
          <StateDisplay status="empty" title="No disruption history yet" />
        </Card>
      </div>
    </WorkspaceShell>
  );
}
