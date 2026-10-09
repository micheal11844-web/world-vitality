import {
  WeatherStatusProvider,
  WEATHER_TEMPERATURE_CAPABILITY_ID,
} from "@world-vitality/interpretation-engine";
import { WorkspaceShell } from "../workspace-shell";
import { getReferenceSiteData } from "../../../../lib/reference-sites";
import { MapView } from "./MapView";

export const dynamic = "force-dynamic";

/**
 * Weather & Climate's map page — a multi-marker map over the shared
 * sample reference sites (see `lib/reference-sites.ts`), each colored by
 * its own latest temperature band. The AI panel interprets the primary
 * site (the same one the workspace home uses).
 */
export default async function WeatherMapPage() {
  const { readings, primaryRecords, failedSites } = await getReferenceSiteData(
    ["T2M"],
    "weather-map-page",
  );
  const result = await new WeatherStatusProvider().interpret({
    capability: WEATHER_TEMPERATURE_CAPABILITY_ID,
    records: primaryRecords,
  });

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
        <MapView sites={readings} failedSites={failedSites} />
      </div>
    </WorkspaceShell>
  );
}
