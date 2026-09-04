import { NasaPowerConnector } from "@world-vitality/data-ingestion";
import {
  WeatherStatusProvider,
  WEATHER_TEMPERATURE_CAPABILITY_ID,
  SoilMoistureStatusProvider,
  SOIL_MOISTURE_CAPABILITY_ID,
} from "@world-vitality/interpretation-engine";
import type { GovernmentNgosLocation } from "@world-vitality/identity-service";

export interface LocationStatus {
  location: GovernmentNgosLocation;
  weather: Awaited<ReturnType<SoilMoistureStatusProvider["interpret"]>>;
  soilMoisture: Awaited<ReturnType<SoilMoistureStatusProvider["interpret"]>>;
  ingestionGaps: number;
}

/**
 * Fetches and interprets one monitored location's overview (BUILD_PLAN
 * "STAGE — GOVERNMENT & NGOS FOLLOW-UP: MONITORED LOCATIONS"),
 * Government & NGOs' exact analog of `insurance/property-status.ts`'s
 * `getPropertyStatus` — same reasoning applies verbatim, see that
 * file's doc comment for why this is deliberately one
 * `NasaPowerConnector` call per location rather than one batched call
 * for the whole set.
 *
 * Still `WeatherStatusProvider` + `SoilMoistureStatusProvider` only —
 * the same two already-proven capabilities the single-demo-point
 * version of this page always used, extended to run per-location now
 * that there's a real set to run them against. No new AI capability —
 * see `page.tsx`'s own honest-scope notes for why a true multi-domain
 * AI-synthesized narrative remains explicitly not built.
 */
export async function getLocationStatus(location: GovernmentNgosLocation): Promise<LocationStatus> {
  const connector = new NasaPowerConnector({
    locations: [{ id: location.id, latitude: location.latitude, longitude: location.longitude }],
    parameters: ["T2M", "GWETROOT"],
    community: "AG",
    lookbackDays: 7,
  });

  const { records, gaps } = await connector.ingest({
    type: "manual",
    requestedBy: "government-ngos-workspace",
  });

  const weather = await new WeatherStatusProvider().interpret({
    capability: WEATHER_TEMPERATURE_CAPABILITY_ID,
    records,
  });
  const soilMoisture = await new SoilMoistureStatusProvider().interpret({
    capability: SOIL_MOISTURE_CAPABILITY_ID,
    records,
  });

  return { location, weather, soilMoisture, ingestionGaps: gaps.length };
}
