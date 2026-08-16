import { NasaPowerConnector } from "@world-vitality/data-ingestion";
import {
  WeatherStatusProvider,
  WEATHER_TEMPERATURE_CAPABILITY_ID,
} from "@world-vitality/interpretation-engine";
import { WorkspaceShell } from "../workspace-shell";
import { MapView } from "./MapView";

export const dynamic = "force-dynamic";

// Same demo-location coordinates as the Weather & Climate home page and
// Agriculture's demo field — see that page's comment for why (no real
// user-configured saved locations exist yet).
const DEMO_LOCATION = { id: "demo-location-1", latitude: 7.3775, longitude: 3.947 };

async function getTemperatureData() {
  const connector = new NasaPowerConnector({
    locations: [DEMO_LOCATION],
    parameters: ["T2M"],
    community: "AG",
    lookbackDays: 7,
  });
  const { records } = await connector.ingest({ type: "manual", requestedBy: "weather-map-page" });
  const provider = new WeatherStatusProvider();
  const result = await provider.interpret({
    capability: WEATHER_TEMPERATURE_CAPABILITY_ID,
    records,
  });

  const latest = records
    .filter((r) => r.metric === "T2M")
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];

  return { result, temperatureValue: latest?.value };
}

/**
 * Weather & Climate's map page (BUILD_PLAN Stage 10, ticket 10.5 —
 * closes the last open item from Stage 10 besides the forecast
 * capability, 10.6). Structurally identical to Agriculture's map page.
 */
export default async function WeatherMapPage() {
  const { result, temperatureValue } = await getTemperatureData();

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
          temperatureValue={temperatureValue}
        />
      </div>
    </WorkspaceShell>
  );
}
