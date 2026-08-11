import { NasaPowerConnector } from "@world-vitality/data-ingestion";
import {
  WeatherStatusProvider,
  WEATHER_TEMPERATURE_CAPABILITY_ID,
} from "@world-vitality/interpretation-engine";
import { Card, Text, StateDisplay, ConfidenceBadge } from "@world-vitality/ui-components";
import { WorkspaceShell } from "./workspace-shell";

// Same reasoning as the Agriculture workspace: environmental data must
// be fetched fresh on every request, never baked in at build time.
export const dynamic = "force-dynamic";

// Same demo-location approach as Agriculture (no real user-configured
// saved locations exist yet — PRD Section A.6's "sign-up captures
// locations of interest" isn't built). Reusing the same coordinates as
// the Agriculture demo field for consistency, not because Weather &
// Climate is scoped to farms specifically.
const DEMO_LOCATION = { id: "demo-location-1", latitude: 7.3775, longitude: 3.947 };

async function getTemperatureStatus() {
  const connector = new NasaPowerConnector({
    locations: [DEMO_LOCATION],
    parameters: ["T2M"],
    community: "AG",
    lookbackDays: 7,
  });

  const { records, gaps } = await connector.ingest({
    type: "manual",
    requestedBy: "weather-workspace-home-page",
  });

  const provider = new WeatherStatusProvider();
  const result = await provider.interpret({
    capability: WEATHER_TEMPERATURE_CAPABILITY_ID,
    records,
  });

  return { result, ingestionGaps: gaps };
}

/**
 * Weather & Climate Workspace Home (BUILD_PLAN Stage 10) — the second
 * workspace, reusing `NasaPowerConnector` unchanged (different
 * `parameters` config only) and following the Agriculture workspace's
 * widget-grid layout pattern exactly.
 *
 * **Honest scope, per widget** (same discipline as Agriculture's own
 * doc comment — not repeating a template, actually re-checking what's
 * real here):
 * - **Status widget**: real — live NASA POWER T2M data, real
 *   classification, real confidence.
 * - **Alerts, Trend, Comparison**: honest empty states — no
 *   alerts/historical-comparison data model exists (same gap as
 *   Agriculture).
 * - **No Map widget/page**: unlike Agriculture, this workspace does not
 *   yet have a map view. The PRD describes one ("Standard weather/
 *   climate overlay layers") but building it wasn't in this pass's
 *   scope — recorded as real, open follow-up work, not silently
 *   dropped.
 * - **No forecast/confidence-gradient**: see `WeatherStatusProvider`'s
 *   doc comment — this is current-conditions only, honestly labeled as
 *   such rather than implying the PRD's full "short/medium/long-range"
 *   vision is done.
 *
 * **Not verified against the live API from this build environment** —
 * same caveat as Agriculture's page: this sandbox cannot reach
 * power.larc.nasa.gov, so this is written to handle both outcomes but
 * hasn't been exercised against a real request yet.
 */
export default async function WeatherWorkspaceHome() {
  const { result, ingestionGaps } = await getTemperatureStatus();

  return (
    <WorkspaceShell activeKey="home" aiInterpretation={result}>
      <Text variant="pageTitle" as="h1" style={{ marginBottom: "var(--wv-space-lg)" }}>
        Current Conditions
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
            Temperature
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
              <ConfidenceBadge level={result.confidence} />
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
          <Text variant="caption">TREND</Text>
          <StateDisplay
            status="empty"
            title="No forecast yet"
            description="This workspace shows current conditions only — a forecast/trend gradient isn't built yet."
          />
        </Card>
        <Card>
          <Text variant="caption">HISTORICAL CONTEXT</Text>
          <StateDisplay status="empty" title="No regional climate benchmark yet" />
        </Card>
      </div>
    </WorkspaceShell>
  );
}
