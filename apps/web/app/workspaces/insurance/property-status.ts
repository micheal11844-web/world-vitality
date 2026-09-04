import { NasaPowerConnector } from "@world-vitality/data-ingestion";
import {
  WeatherStatusProvider,
  WEATHER_TEMPERATURE_CAPABILITY_ID,
  SoilMoistureStatusProvider,
  SOIL_MOISTURE_CAPABILITY_ID,
} from "@world-vitality/interpretation-engine";
import type { InsuranceProperty } from "@world-vitality/identity-service";

export interface PropertyStatus {
  property: InsuranceProperty;
  weather: Awaited<ReturnType<SoilMoistureStatusProvider["interpret"]>>;
  soilMoisture: Awaited<ReturnType<SoilMoistureStatusProvider["interpret"]>>;
  ingestionGaps: number;
}

/**
 * Fetches and interprets one insured property's risk context (BUILD_PLAN
 * "STAGE — INSURANCE FOLLOW-UP: INSURED PROPERTIES"), Insurance's exact
 * analog of `agriculture/field-status.ts`'s `getFieldStatus` — same
 * reasoning applies verbatim, see that file's doc comment for why this
 * is deliberately one `NasaPowerConnector` call per property rather than
 * one batched call for the whole portfolio (mixing locations into one
 * `records` array would silently blend properties' readings together,
 * since the interpretation providers don't filter by location).
 *
 * Still `WeatherStatusProvider` + `SoilMoistureStatusProvider` only —
 * the same two already-proven capabilities the single-demo-address
 * version of this page always used, extended to run per-property now
 * that there's a real portfolio to run them against. No new AI
 * capability, no multi-hazard synthesis — see `page.tsx`'s own honest-
 * scope notes for why that's still deliberately not built.
 */
export async function getPropertyStatus(property: InsuranceProperty): Promise<PropertyStatus> {
  const connector = new NasaPowerConnector({
    locations: [{ id: property.id, latitude: property.latitude, longitude: property.longitude }],
    parameters: ["T2M", "GWETROOT"],
    community: "AG",
    lookbackDays: 7,
  });

  const { records, gaps } = await connector.ingest({
    type: "manual",
    requestedBy: "insurance-workspace",
  });

  const weather = await new WeatherStatusProvider().interpret({
    capability: WEATHER_TEMPERATURE_CAPABILITY_ID,
    records,
  });
  const soilMoisture = await new SoilMoistureStatusProvider().interpret({
    capability: SOIL_MOISTURE_CAPABILITY_ID,
    records,
  });

  return { property, weather, soilMoisture, ingestionGaps: gaps.length };
}
