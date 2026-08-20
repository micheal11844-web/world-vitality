import Link from "next/link";
import { NasaPowerConnector } from "@world-vitality/data-ingestion";
import {
  SoilMoistureStatusProvider,
  SOIL_MOISTURE_CAPABILITY_ID,
} from "@world-vitality/interpretation-engine";
import { Card, Text, StateDisplay, ConfidenceBadge } from "@world-vitality/ui-components";
import { WorkspaceShell } from "./workspace-shell";
import { logTelemetry } from "../../../lib/logger";

// Environmental data must be fetched fresh on every request, never
// baked in at build time — a statically prerendered page would show
// the soil-moisture reading from whenever `next build` happened to run,
// forever, which is exactly the kind of stale-data-presented-as-current
// problem Section 11's map timeline labeling exists to prevent.
export const dynamic = "force-dynamic";

// A fixed demo field location — no real user-configured fields exist yet
// (that's a Stage 6+ data-model gap, not built here). Coordinates are a
// real agricultural area (Oyo State, Nigeria) so the request is
// meaningful, not arbitrary.
const DEMO_FIELD = { id: "demo-field-1", latitude: 7.3775, longitude: 3.947 };

async function getSoilMoistureStatus() {
  const connector = new NasaPowerConnector({
    locations: [DEMO_FIELD],
    parameters: ["GWETROOT"],
    community: "AG",
    lookbackDays: 7,
  });

  const { records, gaps } = await connector.ingest({
    type: "manual",
    requestedBy: "workspace-home-page",
  });

  const provider = new SoilMoistureStatusProvider();
  const result = await provider.interpret({
    capability: SOIL_MOISTURE_CAPABILITY_ID,
    records,
  });

  return { result, ingestionGaps: gaps };
}

/**
 * Agriculture Workspace Home (ticket 6.3), using the shared dashboard
 * widget grammar (Experience Blueprint Section 9). This is the first
 * page in the whole build that actually exercises the full pipeline
 * live: `NasaPowerConnector` (Stage 2) → `SoilMoistureStatusProvider`
 * (Stage 4) → `ConfidenceBadge` (Stage 5), all wired together for real,
 * not just unit-tested in isolation.
 *
 * **Honest scope, per widget** (Section 9 defines 7 widget types; this
 * workspace has real data for exactly one):
 * - **Status widget**: real — live NASA POWER data, real classification,
 *   real confidence.
 * - **Map thumbnail**: real link to the Stage 6.4 map view, but the
 *   "thumbnail" itself is a static placeholder, not a live mini-map.
 * - **Trend, Comparison, Alert summary, Recent reports, Team activity**:
 *   honest `StateDisplay` empty states. No historical-comparison data
 *   model, alerts system, reports system, or team-activity feed exists
 *   yet — rendering fabricated chart data here would violate the same
 *   "never fabricate" principle the interpretation layer itself is held
 *   to (Constitution Section 9). An empty state that says so plainly is
 *   more honest than a chart with invented numbers.
 * - Per Section 9's prioritization rule, alerts would render top-row
 *   above status when active — there being no real alert to show is why
 *   this layout doesn't yet need to implement that override logic.
 *
 * **Not verified against the live API from this build environment** —
 * same caveat as `NasaPowerConnector` itself (see its README): the
 * sandbox this was built in cannot reach `power.larc.nasa.gov`. This
 * Server Component is written to handle both outcomes (real data or an
 * `insufficient-data` result if the fetch fails) — see the "no data"
 * case below — but hasn't been exercised against a real request yet.
 */
export default async function AgricultureWorkspaceHome() {
  logTelemetry.event("workspace_viewed", { workspace: "agriculture" });
  const { result, ingestionGaps } = await getSoilMoistureStatus();

  return (
    <WorkspaceShell activeKey="home" aiInterpretation={result}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--wv-space-lg)",
        }}
      >
        <Text variant="pageTitle" as="h1">
          Field Overview
        </Text>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))",
          gap: "var(--wv-space-md)",
          marginBottom: "var(--wv-space-md)",
        }}
      >
        {/* Status widget — real */}
        <Card>
          <Text variant="caption">STATUS</Text>
          <Text variant="sectionTitle" as="p" style={{ margin: "var(--wv-space-xs) 0" }}>
            Soil moisture
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

        {/* Alert summary widget — honest empty state, no alerts system built yet */}
        <Card>
          <Text variant="caption">ALERTS</Text>
          <StateDisplay status="empty" title="No active alerts" />
        </Card>

        {/* Map thumbnail widget — real link, static preview */}
        <Link
          href="/workspaces/agriculture/map"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <Card>
            <Text variant="caption">MAP</Text>
            <div
              style={{
                marginTop: "var(--wv-space-sm)",
                height: "6rem",
                borderRadius: "var(--wv-radius-sm)",
                backgroundColor: "var(--wv-color-neutral-100)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text variant="caption">View full map →</Text>
            </div>
          </Card>
        </Link>
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
            title="Not enough history yet"
            description="Trend comparisons need more than one season of data."
          />
        </Card>
        <Card>
          <Text variant="caption">COMPARISON</Text>
          <StateDisplay status="empty" title="No regional benchmark yet" />
        </Card>
      </div>
    </WorkspaceShell>
  );
}
