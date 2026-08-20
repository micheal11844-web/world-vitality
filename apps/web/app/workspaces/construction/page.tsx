import { NasaPowerConnector, OpenMeteoConnector } from "@world-vitality/data-ingestion";
import {
  ConstructionRiskStatusProvider,
  CONSTRUCTION_RISK_CAPABILITY_ID,
  ConstructionSiteRiskTimelineProvider,
  CONSTRUCTION_TIMELINE_CAPABILITY_ID,
} from "@world-vitality/interpretation-engine";
import { Card, Text, StateDisplay, ConfidenceBadge } from "@world-vitality/ui-components";
import { WorkspaceShell } from "./workspace-shell";
import { logTelemetry } from "../../../lib/logger";

// Same reasoning as Agriculture and Weather & Climate: environmental
// data must be fetched fresh on every request, never baked in at build
// time.
export const dynamic = "force-dynamic";

// Same demo-location approach as Agriculture and Weather & Climate (no
// real user-configured saved sites exist yet — PRD Section A.2's
// "sign-up captures site location(s) and project timeline/phase" isn't
// built). Reusing the same coordinates for consistency, not because
// Construction is scoped to this specific site.
const DEMO_LOCATION = { id: "demo-location-1", latitude: 7.3775, longitude: 3.947 };

const ACTIVITY_STATUS_COLOR: Record<string, string> = {
  go: "var(--wv-accent)",
  caution: "#d4652f",
  "no-go": "#b3401f",
};

async function getSiteRiskStatus() {
  const connector = new NasaPowerConnector({
    locations: [DEMO_LOCATION],
    parameters: ["T2M", "WS2M"],
    community: "AG",
    lookbackDays: 7,
  });

  const { records, gaps } = await connector.ingest({
    type: "manual",
    requestedBy: "construction-workspace-home-page",
  });

  const provider = new ConstructionRiskStatusProvider();
  const result = await provider.interpret({
    capability: CONSTRUCTION_RISK_CAPABILITY_ID,
    records,
  });

  return { result, ingestionGaps: gaps };
}

/**
 * Real forecast data (BUILD_PLAN Stage 12 follow-up), from
 * `OpenMeteoConnector` — same second data provider Weather & Climate
 * already validated (Stage 10.6), extended to also fetch daily max
 * wind speed so this provider can assess crane/roofing risk, not just
 * concrete pour, over the forecast window.
 */
async function getSiteRiskTimeline() {
  const connector = new OpenMeteoConnector({
    locations: [DEMO_LOCATION],
    forecastDays: 7,
  });

  const { records, gaps } = await connector.ingest({
    type: "manual",
    requestedBy: "construction-workspace-home-page",
  });

  const provider = new ConstructionSiteRiskTimelineProvider();
  const result = await provider.interpret({
    capability: CONSTRUCTION_TIMELINE_CAPABILITY_ID,
    records,
  });

  return { result, ingestionGaps: gaps };
}

/**
 * Construction Workspace Home (BUILD_PLAN Stage 12) — the third
 * workspace, reusing `NasaPowerConnector` unchanged (`T2M` + `WS2M`
 * parameters, same connector Agriculture and Weather & Climate already
 * use) and following the same widget-grid layout pattern as both.
 *
 * **Honest scope, per widget:**
 * - **Today's activity status widget**: real — live NASA POWER T2M/WS2M
 *   data, real per-activity go/caution/no-go classification via
 *   `ConstructionRiskStatusProvider`, real confidence.
 * - **Site Risk Timeline (forward-looking, multi-day)**: real, as of the
 *   Stage 12 follow-up — live Open-Meteo forecast data (temperature and,
 *   newly, daily max wind speed) via `ConstructionSiteRiskTimelineProvider`,
 *   which reuses the exact same per-activity threshold functions as the
 *   Today's status widget so the two can never silently disagree on what
 *   counts as risky. Real lead-time-based confidence gradient, same
 *   reasoning as Weather & Climate's forecast trend widget.
 * - **Alerts, delay-logging, historical comparison**: still honest empty
 *   states — no alerts/delay-event data model exists yet (same gap as
 *   Agriculture and Weather & Climate's own pages).
 * - **No Map widget on this page** — the map lives at
 *   `/workspaces/construction/map`, same pattern as the other two
 *   workspaces.
 *
 * **Not verified against the live NASA POWER API from this build
 * environment** — same caveat as Agriculture's and Weather & Climate's
 * pages: this sandbox cannot reach power.larc.nasa.gov, so this is
 * written to handle both outcomes but hasn't been exercised against a
 * real request yet.
 */
export default async function ConstructionWorkspaceHome() {
  logTelemetry.event("workspace_viewed", { workspace: "construction" });
  const [{ result, ingestionGaps }, { result: timelineResult, ingestionGaps: timelineGaps }] =
    await Promise.all([getSiteRiskStatus(), getSiteRiskTimeline()]);

  return (
    <WorkspaceShell activeKey="home" aiInterpretation={result}>
      <Text variant="pageTitle" as="h1" style={{ marginBottom: "var(--wv-space-lg)" }}>
        Today's Activity Status
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
          <Text variant="caption">SITE RISK STATUS</Text>
          {result.unableToAnswer ? (
            <Text
              variant="body"
              style={{ color: "var(--wv-text-secondary)", marginTop: "var(--wv-space-xs)" }}
            >
              {result.summary}
            </Text>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "var(--wv-space-sm)",
                  margin: "var(--wv-space-sm) 0",
                }}
              >
                {result.summary
                  .split(/(?<=\.)\s*(?=[A-Z])|;\s*/)
                  .map((s) => s.replace(/\.$/, "").trim())
                  .filter((s) => s.includes(":"))
                  .map((entry) => {
                    const [label, status] = entry.split(":").map((p) => p.trim());
                    const color = ACTIVITY_STATUS_COLOR[status ?? ""] ?? "var(--wv-text-primary)";
                    return (
                      <div
                        key={label}
                        style={{
                          border: `1px solid ${color}`,
                          borderRadius: "var(--wv-radius-sm)",
                          padding: "var(--wv-space-xs) var(--wv-space-sm)",
                        }}
                      >
                        <Text variant="body" style={{ fontWeight: 600 }}>
                          {label}
                        </Text>
                        <Text variant="caption" style={{ color, textTransform: "uppercase" }}>
                          {status}
                        </Text>
                      </div>
                    );
                  })}
              </div>
              <ConfidenceBadge level={result.confidence} showDescription />
              <Text variant="caption" style={{ display: "block", marginTop: "var(--wv-space-sm)" }}>
                {result.explanation}
              </Text>
            </>
          )}
          {ingestionGaps.length > 0 && (
            <Text variant="caption" style={{ display: "block", marginTop: "var(--wv-space-sm)" }}>
              {ingestionGaps.length} day(s) had no data available.
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
          <Text variant="caption">SITE RISK TIMELINE</Text>
          {timelineResult.unableToAnswer ? (
            <Text
              variant="body"
              style={{ color: "var(--wv-text-secondary)", marginTop: "var(--wv-space-xs)" }}
            >
              {timelineResult.summary}
            </Text>
          ) : (
            <>
              <Text variant="body" style={{ margin: "var(--wv-space-xs) 0" }}>
                {timelineResult.summary}
              </Text>
              <ConfidenceBadge level={timelineResult.confidence} showDescription />
              <Text variant="caption" style={{ display: "block", marginTop: "var(--wv-space-sm)" }}>
                {timelineResult.explanation}
              </Text>
            </>
          )}
          {timelineGaps.length > 0 && (
            <Text variant="caption" style={{ display: "block", marginTop: "var(--wv-space-sm)" }}>
              {timelineGaps.length} forecast day(s) had no data available.
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
