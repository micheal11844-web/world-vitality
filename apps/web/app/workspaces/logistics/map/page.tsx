import { NasaPowerConnector } from "@world-vitality/data-ingestion";
import {
  LogisticsRouteRiskProvider,
  LOGISTICS_ROUTE_RISK_CAPABILITY_ID,
} from "@world-vitality/interpretation-engine";
import { WorkspaceShell } from "../workspace-shell";
import { MapView } from "./MapView";

export const dynamic = "force-dynamic";

const DEMO_LOCATION = { id: "demo-location-1", latitude: 7.3775, longitude: 3.947 };

async function getCurrentRouteRiskData() {
  const connector = new NasaPowerConnector({
    locations: [DEMO_LOCATION],
    parameters: ["WS2M"],
    community: "AG",
    lookbackDays: 7,
  });
  const { records } = await connector.ingest({
    type: "manual",
    requestedBy: "logistics-map-page",
  });
  const provider = new LogisticsRouteRiskProvider();
  const result = await provider.interpret({
    capability: LOGISTICS_ROUTE_RISK_CAPABILITY_ID,
    records,
  });
  const latest = records
    .filter((r) => r.metric === "WS2M")
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
  return { result, windValue: latest?.value };
}

/**
 * Logistics & Shipping's map page (BUILD_PLAN "STAGE — LOGISTICS &
 * SHIPPING WORKSPACE"). Structurally identical to every other
 * workspace's map page — same "base layers + one data overlay" honest
 * scope. No true multi-waypoint route overlay (the PRD's actual "Route
 * overlays with live storm tracks, port-status indicators, flood-prone
 * corridor flags" vision) exists — this shows the single demo
 * location's current route-risk band only, same honest single-point
 * scope as the home page.
 */
export default async function LogisticsMapPage() {
  const { result, windValue } = await getCurrentRouteRiskData();

  return (
    <WorkspaceShell activeKey="map" aiInterpretation={result}>
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
          windValue={windValue}
        />
      </div>
    </WorkspaceShell>
  );
}
