import { NasaPowerConnector } from "@world-vitality/data-ingestion";
import { WorkspaceShell } from "../workspace-shell";
import { MapView } from "./MapView";

export const dynamic = "force-dynamic";

const DEMO_LOCATION = { id: "demo-location-1", latitude: 7.3775, longitude: 3.947 };

async function getRawReadings() {
  const connector = new NasaPowerConnector({
    locations: [DEMO_LOCATION],
    parameters: ["T2M", "WS2M"],
    community: "AG",
    lookbackDays: 7,
  });
  const { records } = await connector.ingest({ type: "manual", requestedBy: "research-map-page" });
  const latestTemp = records
    .filter((r) => r.metric === "T2M")
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
  const latestWind = records
    .filter((r) => r.metric === "WS2M")
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
  return { temperatureValue: latestTemp?.value, windValue: latestWind?.value };
}

/**
 * Research's map page (BUILD_PLAN Stage 14). Unlike every other
 * workspace's map, this one shows the **raw metric values themselves**
 * in the marker popup — no risk band, no color-coded interpretation —
 * per the PRD's "minimally interpreted, maximally transparent" design
 * for this workspace (Section A.9: "Full raw-layer geospatial
 * visualization"). Same base-layer honest scope as every other
 * workspace's map otherwise.
 */
export default async function ResearchMapPage() {
  const { temperatureValue, windValue } = await getRawReadings();

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
          temperatureValue={temperatureValue}
          windValue={windValue}
        />
      </div>
    </WorkspaceShell>
  );
}
