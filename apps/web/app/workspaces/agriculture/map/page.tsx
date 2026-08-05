import { NasaPowerConnector } from "@world-vitality/data-ingestion";
import {
  SoilMoistureStatusProvider,
  SOIL_MOISTURE_CAPABILITY_ID,
} from "@world-vitality/interpretation-engine";
import { WorkspaceShell } from "../workspace-shell";
import { MapView } from "./MapView";

export const dynamic = "force-dynamic";

const DEMO_FIELD = { id: "demo-field-1", latitude: 7.3775, longitude: 3.947 };

async function getFieldData() {
  const connector = new NasaPowerConnector({
    locations: [DEMO_FIELD],
    parameters: ["GWETROOT"],
    community: "AG",
    lookbackDays: 7,
  });
  const { records } = await connector.ingest({ type: "manual", requestedBy: "map-page" });
  const provider = new SoilMoistureStatusProvider();
  const result = await provider.interpret({ capability: SOIL_MOISTURE_CAPABILITY_ID, records });

  const latest = records
    .filter((r) => r.metric === "GWETROOT")
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];

  return { result, moistureValue: latest?.value };
}

export default async function AgricultureMapPage() {
  const { result, moistureValue } = await getFieldData();

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
          latitude={DEMO_FIELD.latitude}
          longitude={DEMO_FIELD.longitude}
          moistureValue={moistureValue}
        />
      </div>
    </WorkspaceShell>
  );
}
