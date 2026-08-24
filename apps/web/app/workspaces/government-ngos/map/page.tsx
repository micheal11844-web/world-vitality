import { NasaPowerConnector } from "@world-vitality/data-ingestion";
import {
  SoilMoistureStatusProvider,
  SOIL_MOISTURE_CAPABILITY_ID,
} from "@world-vitality/interpretation-engine";
import { WorkspaceShell } from "../workspace-shell";
import { MapView } from "./MapView";
import { getWorkspaceRole } from "../../../../lib/get-workspace-role";

export const dynamic = "force-dynamic";

const WORKSPACE_ID = "government-ngos";
const DEMO_LOCATION = { id: "demo-jurisdiction-1", latitude: 7.3775, longitude: 3.947 };

async function getCurrentMoisture() {
  const connector = new NasaPowerConnector({
    locations: [DEMO_LOCATION],
    parameters: ["GWETROOT"],
    community: "AG",
    lookbackDays: 7,
  });
  const { records } = await connector.ingest({
    type: "manual",
    requestedBy: "government-ngos-map-page",
  });
  const provider = new SoilMoistureStatusProvider();
  const result = await provider.interpret({ capability: SOIL_MOISTURE_CAPABILITY_ID, records });
  const latest = records
    .filter((r) => r.metric === "GWETROOT")
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
  return { result, moistureValue: latest?.value };
}

/**
 * Government & NGOs' map page (BUILD_PLAN "STAGE — GOVERNMENT & NGOS
 * WORKSPACE"). Structurally identical to every other workspace's map
 * page.
 */
export default async function GovernmentNgosMapPage() {
  const role = await getWorkspaceRole(WORKSPACE_ID);
  const { result, moistureValue } = await getCurrentMoisture();

  return (
    <WorkspaceShell activeKey="map" role={role} aiInterpretation={result}>
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
          moistureValue={moistureValue}
        />
      </div>
    </WorkspaceShell>
  );
}
