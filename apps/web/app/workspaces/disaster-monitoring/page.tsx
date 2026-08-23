import { fetchActiveAlerts, type NwsAlert } from "../../../lib/nws-alerts";
import { Card, Text, StateDisplay } from "@world-vitality/ui-components";
import { WorkspaceShell } from "./workspace-shell";
import { logTelemetry, logSecurity } from "../../../lib/logger";

export const dynamic = "force-dynamic";

// U.S.-only demo location, deliberately different from every other
// workspace's shared Nigeria-based demo point — the National Weather
// Service has no coverage outside U.S. jurisdiction, see
// nws-alerts.ts's doc comment. Los Angeles, CA chosen arbitrarily; any
// valid U.S. point works structurally.
const DEMO_LOCATION = { latitude: 34.0522, longitude: -118.2437, label: "Los Angeles, CA" };

const SEVERITY_ORDER: Record<string, number> = {
  Extreme: 0,
  Severe: 1,
  Moderate: 2,
  Minor: 3,
  Unknown: 4,
};

/**
 * Disaster Monitoring Workspace Home — Active Alerts (BUILD_PLAN
 * "STAGE — DISASTER MONITORING WORKSPACE", the third of the six
 * previously-unbuilt PRD workspaces). Scoped and confirmed with the
 * owner explicitly before building, given this workspace's stakes —
 * see this file's own honest-scope section below and
 * `nws-alerts.ts`'s doc comment for why this is built the way it is.
 *
 * **Honest scope, stated plainly, not silently glossed over — this is
 * a small fraction of PRD A.7's actual ambition:**
 * - **Active Alerts list**: real — live official National Weather
 *   Service alerts for the demo location, shown exactly as issued
 *   (headline, severity, urgency, official description and
 *   instruction, effective/expiration window), with clear "Source:
 *   National Weather Service" attribution. No AI summarization,
 *   scoring, or reinterpretation of alert content — see
 *   `workspace-shell.tsx`'s doc comment for why.
 * - **U.S. and territories only** — NWS has no coverage elsewhere.
 * - **NOT built, honestly**: fire perimeter/flood extent map layers,
 *   evacuation-zone status, shelter locations, multi-hazard AI
 *   cross-validation (satellite fire detection, flood gauges), agency
 *   coordination features, offline-first emergency mode, and
 *   SMS/push notification delivery. All PRD-only. This ships the one
 *   real, working piece: relaying an actual government agency's
 *   already-official alerts, unmodified — not a mocked-up preview of
 *   the rest.
 *
 * **Not verified against the live api.weather.gov API from this build
 * environment** — same caveat as every other network-dependent code
 * path in this app (this sandbox cannot reach api.weather.gov).
 */
export default async function DisasterMonitoringWorkspaceHome() {
  logTelemetry.event("workspace_viewed", { workspace: "disaster-monitoring" });

  let alerts: NwsAlert[] = [];
  let fetchFailed = false;
  try {
    alerts = await fetchActiveAlerts(DEMO_LOCATION.latitude, DEMO_LOCATION.longitude);
    alerts.sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4));
  } catch (err) {
    logSecurity.error("disaster_monitoring_alerts_fetch_failed", err);
    fetchFailed = true;
  }

  return (
    <WorkspaceShell activeKey="home">
      <Text variant="pageTitle" as="h1" style={{ marginBottom: "var(--wv-space-xs)" }}>
        Active Alerts
      </Text>
      <Text
        variant="body"
        style={{ color: "var(--wv-text-secondary)", marginBottom: "var(--wv-space-sm)" }}
      >
        {DEMO_LOCATION.label} · Source: National Weather Service (weather.gov) · U.S. and
        territories only
      </Text>
      <Text
        variant="caption"
        style={{
          display: "block",
          marginBottom: "var(--wv-space-lg)",
          color: "var(--wv-text-secondary)",
        }}
      >
        This is not a substitute for official guidance — always follow instructions from local
        authorities.
      </Text>

      {fetchFailed && (
        <Card>
          <StateDisplay
            status="error"
            title="Couldn't reach the National Weather Service"
            description="Alerts couldn't be fetched right now. Please check weather.gov directly for official information."
          />
        </Card>
      )}

      {!fetchFailed && alerts.length === 0 && (
        <Card>
          <StateDisplay
            status="success"
            title="No active alerts"
            description={`No National Weather Service alerts are currently active for ${DEMO_LOCATION.label}.`}
          />
        </Card>
      )}

      {!fetchFailed && alerts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--wv-space-md)" }}>
          {alerts.map((alert) => (
            <Card key={alert.id}>
              <Text variant="caption">
                {alert.severity.toUpperCase()} · {alert.urgency} · {alert.certainty}
              </Text>
              <Text variant="sectionTitle" as="p" style={{ margin: "var(--wv-space-xs) 0" }}>
                {alert.headline || alert.event}
              </Text>
              <Text variant="body" style={{ whiteSpace: "pre-wrap" }}>
                {alert.description}
              </Text>
              {alert.instruction && (
                <Text
                  variant="body"
                  style={{
                    marginTop: "var(--wv-space-sm)",
                    fontWeight: 600,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {alert.instruction}
                </Text>
              )}
              <Text
                variant="caption"
                style={{
                  display: "block",
                  marginTop: "var(--wv-space-sm)",
                  color: "var(--wv-text-secondary)",
                }}
              >
                {alert.areaDesc} · Issued by {alert.senderName} · Effective{" "}
                {new Date(alert.effective).toLocaleString()} · Expires{" "}
                {new Date(alert.expires).toLocaleString()}
              </Text>
            </Card>
          ))}
        </div>
      )}
    </WorkspaceShell>
  );
}
