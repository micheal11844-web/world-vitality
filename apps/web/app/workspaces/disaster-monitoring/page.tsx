import { fetchActiveAlerts, type NwsAlert } from "../../../lib/nws-alerts";
import { fetchFloodingLocations, type FloodImpactLocation } from "../../../lib/usgs-flood-impacts";
import {
  fetchNearbyShelters,
  SHELTER_STATUS_CAVEAT,
  type ShelterLocation,
} from "../../../lib/fema-shelters";
import { Card, Text, StateDisplay } from "@world-vitality/ui-components";
import { WorkspaceShell } from "./workspace-shell";
import { logTelemetry, logSecurity } from "../../../lib/logger";

export const dynamic = "force-dynamic";

// U.S.-only demo location, deliberately different from every other
// workspace's shared Nigeria-based demo point — the National Weather
// Service has no coverage outside U.S. jurisdiction, see
// nws-alerts.ts's doc comment. Los Angeles, CA chosen arbitrarily; any
// valid U.S. point works structurally.
const DEMO_LOCATION = {
  latitude: 34.0522,
  longitude: -118.2437,
  label: "Los Angeles, CA",
  stateCode: "CA",
};

const SEVERITY_ORDER: Record<string, number> = {
  Extreme: 0,
  Severe: 1,
  Moderate: 2,
  Minor: 3,
  Unknown: 4,
};

/**
 * Disaster Monitoring Workspace Home — Active Alerts, Flood Impact
 * Locations, and Nearby Designated Shelters (BUILD_PLAN "STAGE —
 * DISASTER MONITORING WORKSPACE" + its follow-up adding flood/shelter
 * data). Scoped and confirmed with the owner explicitly before
 * building each piece, given this workspace's stakes — see
 * `nws-alerts.ts`, `usgs-flood-impacts.ts`, and `fema-shelters.ts`'s
 * doc comments for why each is built the way it is.
 *
 * **Honest scope, stated plainly, not silently glossed over — this is
 * still a small fraction of PRD A.7's actual ambition:**
 * - **Active Alerts**: real — live official NWS alerts, exactly as
 *   issued.
 * - **Flood Impact Locations**: real — live USGS Real-Time Flood
 *   Impact data, currently-flooding infrastructure locations in
 *   {stateCode}. USGS's own provisional-data caveat applies (see
 *   `usgs-flood-impacts.ts`).
 * - **Nearby Designated Shelters**: real — FEMA/Red Cross designated
 *   shelter facility locations within 25 miles, from HIFLD open data.
 *   **Reference locations only, not live open/closed status** — see
 *   the on-page caveat, shown verbatim from FEMA/HIFLD, not softened.
 * - No AI summarization, scoring, or reinterpretation of any of the
 *   above, anywhere — see `workspace-shell.tsx`'s doc comment for why.
 * - **U.S. and territories only** for all three sources.
 * - **Still NOT built, honestly**: fire perimeter/hotspot data (NASA
 *   FIRMS — needs a registered API key the owner is obtaining), live
 *   evacuation-zone status (no unified free real-time API exists for
 *   this — it's issued ad hoc per county/state), multi-hazard AI
 *   cross-validation (deliberately declined, not just unbuilt — see
 *   `workspace-shell.tsx`), agency coordination features,
 *   offline-first emergency mode, SMS/push delivery.
 *
 * **Not verified against any of the three live APIs from this build
 * environment** — same caveat as every other network-dependent code
 * path in this app (this sandbox cannot reach api.weather.gov,
 * api.waterdata.usgs.gov, or maps.nccs.nasa.gov).
 */
export default async function DisasterMonitoringWorkspaceHome() {
  logTelemetry.event("workspace_viewed", { workspace: "disaster-monitoring" });

  let alerts: NwsAlert[] = [];
  let alertsFailed = false;
  try {
    alerts = await fetchActiveAlerts(DEMO_LOCATION.latitude, DEMO_LOCATION.longitude);
    alerts.sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4));
  } catch (err) {
    logSecurity.error("disaster_monitoring_alerts_fetch_failed", err);
    alertsFailed = true;
  }

  let floods: FloodImpactLocation[] = [];
  let floodsFailed = false;
  try {
    floods = await fetchFloodingLocations(DEMO_LOCATION.stateCode);
  } catch (err) {
    logSecurity.error("disaster_monitoring_floods_fetch_failed", err);
    floodsFailed = true;
  }

  let shelters: ShelterLocation[] = [];
  let sheltersFailed = false;
  try {
    shelters = await fetchNearbyShelters(DEMO_LOCATION.latitude, DEMO_LOCATION.longitude);
  } catch (err) {
    logSecurity.error("disaster_monitoring_shelters_fetch_failed", err);
    sheltersFailed = true;
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

      {alertsFailed && (
        <Card>
          <StateDisplay
            status="error"
            title="Couldn't reach the National Weather Service"
            description="Alerts couldn't be fetched right now. Please check weather.gov directly for official information."
          />
        </Card>
      )}

      {!alertsFailed && alerts.length === 0 && (
        <Card>
          <StateDisplay
            status="success"
            title="No active alerts"
            description={`No National Weather Service alerts are currently active for ${DEMO_LOCATION.label}.`}
          />
        </Card>
      )}

      {!alertsFailed && alerts.length > 0 && (
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

      <Text
        variant="pageTitle"
        as="h2"
        style={{ margin: "var(--wv-space-xl) 0 var(--wv-space-xs)" }}
      >
        Flood Impact Locations
      </Text>
      <Text
        variant="body"
        style={{ color: "var(--wv-text-secondary)", marginBottom: "var(--wv-space-sm)" }}
      >
        {DEMO_LOCATION.stateCode} · Source: USGS Real-Time Flood Impact API
      </Text>
      <Text
        variant="caption"
        style={{
          display: "block",
          marginBottom: "var(--wv-space-lg)",
          color: "var(--wv-text-secondary)",
        }}
      >
        This information is preliminary/provisional and has not received final USGS approval. Not to
        be used for decisions concerning personal or public safety.
      </Text>

      {floodsFailed && (
        <Card>
          <StateDisplay
            status="error"
            title="Couldn't reach the USGS Flood Impact API"
            description="Flood data couldn't be fetched right now. Please check waterdata.usgs.gov directly."
          />
        </Card>
      )}
      {!floodsFailed && floods.length === 0 && (
        <Card>
          <StateDisplay
            status="success"
            title="No flood impact locations currently active"
            description={`No currently-flooding USGS reference locations reported in ${DEMO_LOCATION.stateCode}.`}
          />
        </Card>
      )}
      {!floodsFailed && floods.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--wv-space-sm)" }}>
          {floods.map((location) => (
            <Card key={location.id}>
              <Text variant="sectionTitle" as="p">
                {location.name}
              </Text>
              {location.description && <Text variant="body">{location.description}</Text>}
            </Card>
          ))}
        </div>
      )}

      <Text
        variant="pageTitle"
        as="h2"
        style={{ margin: "var(--wv-space-xl) 0 var(--wv-space-xs)" }}
      >
        Nearby Designated Shelters
      </Text>
      <Text
        variant="body"
        style={{ color: "var(--wv-text-secondary)", marginBottom: "var(--wv-space-sm)" }}
      >
        Within 25 miles of {DEMO_LOCATION.label} · Source: FEMA / American Red Cross (HIFLD)
      </Text>
      <Text
        variant="caption"
        style={{
          display: "block",
          marginBottom: "var(--wv-space-lg)",
          color: "var(--wv-text-secondary)",
          fontWeight: 600,
        }}
      >
        {SHELTER_STATUS_CAVEAT}
      </Text>

      {sheltersFailed && (
        <Card>
          <StateDisplay
            status="error"
            title="Couldn't reach the shelter facilities service"
            description="Shelter data couldn't be fetched right now."
          />
        </Card>
      )}
      {!sheltersFailed && shelters.length === 0 && (
        <Card>
          <StateDisplay status="empty" title="No designated shelters found within range" />
        </Card>
      )}
      {!sheltersFailed && shelters.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--wv-space-sm)" }}>
          {shelters.map((shelter) => (
            <Card key={shelter.id}>
              <Text variant="sectionTitle" as="p">
                {shelter.name}
              </Text>
              {shelter.address && <Text variant="body">{shelter.address}</Text>}
              {shelter.evacuationCapacity !== null && (
                <Text variant="caption">
                  Evacuation capacity (designated): {shelter.evacuationCapacity}
                </Text>
              )}
            </Card>
          ))}
        </div>
      )}
    </WorkspaceShell>
  );
}
