import { NasaPowerConnector } from "@world-vitality/data-ingestion";
import {
  WindGenerationStatusProvider,
  WIND_GENERATION_STATUS_CAPABILITY_ID,
} from "@world-vitality/interpretation-engine";
import { WorkspaceShell } from "../workspace-shell";
import { MapView } from "./MapView";

export const dynamic = "force-dynamic";

const DEMO_LOCATION = { id: "demo-location-1", latitude: 7.3775, longitude: 3.947 };

async function getCurrentGenerationData() {
  const connector = new NasaPowerConnector({
    locations: [DEMO_LOCATION],
    parameters: ["WS2M"],
    community: "AG",
    lookbackDays: 7,
  });
  const { records } = await connector.ingest({
    type: "manual",
    requestedBy: "renewable-energy-map-page",
  });
  const provider = new WindGenerationStatusProvider();
  const result = await provider.interpret({
    capability: WIND_GENERATION_STATUS_CAPABILITY_ID,
    records,
  });
  const latest = records
    .filter((r) => r.metric === "WS2M")
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
  return { result, windValue: latest?.value };
}

/**
 * Renewable Energy's map page (BUILD_PLAN Stage 13). Structurally
 * identical to the other three workspaces' map pages — same "base
 * layers + one data overlay" honest scope. No true "regional resource
 * map" (the PRD's multi-year siting/feasibility vision) exists — this
 * shows the single demo asset location's current generation band only.
 */
export default async function RenewableEnergyMapPage() {
  const { result, windValue } = await getCurrentGenerationData();

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
