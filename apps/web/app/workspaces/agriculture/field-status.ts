import { NasaPowerConnector } from "@world-vitality/data-ingestion";
import {
  WeatherStatusProvider,
  WEATHER_TEMPERATURE_CAPABILITY_ID,
  SoilMoistureStatusProvider,
  SOIL_MOISTURE_CAPABILITY_ID,
} from "@world-vitality/interpretation-engine";
import type { Field } from "@world-vitality/identity-service";

export interface FieldStatus {
  field: Field;
  weather: Awaited<ReturnType<SoilMoistureStatusProvider["interpret"]>>;
  soilMoisture: Awaited<ReturnType<SoilMoistureStatusProvider["interpret"]>>;
  ingestionGaps: number;
}

/**
 * Fetches and interprets one field's data. Shared by `page.tsx` (Field
 * Overview) and `report/page.tsx` (BUILD_PLAN "STAGE — AGRICULTURE
 * FOLLOW-UP: REPORT/EXPORT") so both show identical numbers for the
 * same field — extracted here rather than duplicated, once a genuine
 * second consumer existed (Engineering Blueprint 4.5).
 *
 * Deliberately one `NasaPowerConnector` call per field, not one batched
 * call for every field at once: `NasaPowerConnector` supports multiple
 * `locations` in a single call, but the resulting `records` array would
 * mix every field's readings together tagged only by metric, not by
 * field — `WeatherStatusProvider`/`SoilMoistureStatusProvider` don't
 * filter by location, so interpreting a mixed-location `records` array
 * would silently blend fields' data together. One call per field costs
 * more network round-trips but is correctness-safe and matches the
 * exact pattern every other single-location workspace page already
 * uses — a real, honest trade-off for a field list expected to stay
 * small, not a premature optimization avoided for its own sake.
 */
export async function getFieldStatus(field: Field): Promise<FieldStatus> {
  const connector = new NasaPowerConnector({
    locations: [{ id: field.id, latitude: field.latitude, longitude: field.longitude }],
    parameters: ["T2M", "GWETROOT"],
    community: "AG",
    lookbackDays: 7,
  });

  const { records, gaps } = await connector.ingest({
    type: "manual",
    requestedBy: "agriculture-workspace",
  });

  const weather = await new WeatherStatusProvider().interpret({
    capability: WEATHER_TEMPERATURE_CAPABILITY_ID,
    records,
  });
  const soilMoisture = await new SoilMoistureStatusProvider().interpret({
    capability: SOIL_MOISTURE_CAPABILITY_ID,
    records,
  });

  return { field, weather, soilMoisture, ingestionGaps: gaps.length };
}
