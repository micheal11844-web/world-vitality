import { fetchActiveAlerts } from "../../../../lib/nws-alerts";
import { WorkspaceShell } from "../workspace-shell";
import { MapView } from "./MapView";
import { logSecurity } from "../../../../lib/logger";

export const dynamic = "force-dynamic";

const DEMO_LOCATION = { latitude: 34.0522, longitude: -118.2437 };

const SEVERITY_ORDER: Record<string, number> = {
  Extreme: 0,
  Severe: 1,
  Moderate: 2,
  Minor: 3,
  Unknown: 4,
};

/**
 * Disaster Monitoring's map page (BUILD_PLAN "STAGE — DISASTER
 * MONITORING WORKSPACE"). Same "base layers + one data overlay" honest
 * scope as every other workspace's map page — see `MapView.tsx`'s doc
 * comment for what the overlay actually represents here (the highest
 * NWS-assigned severity among active alerts, not an invented risk
 * band or a fire-perimeter/flood-extent layer).
 */
export default async function DisasterMonitoringMapPage() {
  let topSeverity: string | undefined;
  let alertCount = 0;
  try {
    const alerts = await fetchActiveAlerts(DEMO_LOCATION.latitude, DEMO_LOCATION.longitude);
    alertCount = alerts.length;
    const sorted = [...alerts].sort(
      (a, b) => (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4),
    );
    topSeverity = sorted[0]?.severity;
  } catch (err) {
    logSecurity.error("disaster_monitoring_map_alerts_fetch_failed", err);
  }

  return (
    <WorkspaceShell activeKey="map">
      <div
        style={{
          height: "100%",
          minHeight: "32rem",
          borderRadius: "var(--wv-radius-md)",
          overflow: "hidden",
        }}
      >
        <MapView
          latitude={DEMO_LOCATION.latitude}
          longitude={DEMO_LOCATION.longitude}
          topSeverity={topSeverity}
          alertCount={alertCount}
        />
      </div>
    </WorkspaceShell>
  );
}
