import { NasaPowerConnector } from "@world-vitality/data-ingestion";
import {
  WeatherStatusProvider,
  WEATHER_TEMPERATURE_CAPABILITY_ID,
  SoilMoistureStatusProvider,
  SOIL_MOISTURE_CAPABILITY_ID,
  WindGenerationStatusProvider,
  WIND_GENERATION_STATUS_CAPABILITY_ID,
  ConstructionRiskStatusProvider,
  CONSTRUCTION_RISK_CAPABILITY_ID,
  type InterpretationResult,
} from "@world-vitality/interpretation-engine";
import type { HomePlace, InsightKind } from "@world-vitality/identity-service";

export interface PlaceInsight {
  /** Short card title, e.g. "Soil moisture". */
  title: string;
  result: InterpretationResult;
  /** Days with no data from the provider. */
  gapCount: number;
}

const TITLES: Record<InsightKind, string> = {
  temperature: "Current conditions",
  "soil-moisture": "Soil moisture",
  wind: "Wind generation",
  "construction-risk": "Site conditions",
};

/**
 * The "real, personalized insight within the first minute" (PRD B.1):
 * one of the interpretations that already exists, run for a person's
 * own place. Every kind reuses the exact connector + provider pair its
 * workspace uses, so onboarding shows the same truth the workspace will
 * — not a separate demo path that could drift from it.
 *
 * Throws on a network/provider failure; callers decide how to word it.
 * Not verified against the live NASA POWER API from the build sandbox
 * (no outbound access) — same caveat as every network-dependent path.
 */
export async function getPlaceInsight(kind: InsightKind, place: HomePlace): Promise<PlaceInsight> {
  const location = { id: "home-place", latitude: place.latitude, longitude: place.longitude };
  const ingest = async (parameters: string[]) => {
    const connector = new NasaPowerConnector({
      locations: [location],
      parameters,
      community: "AG",
      lookbackDays: 7,
    });
    return connector.ingest({ type: "manual", requestedBy: "onboarding-place-insight" });
  };

  switch (kind) {
    case "soil-moisture": {
      const { records, gaps } = await ingest(["GWETROOT"]);
      const result = await new SoilMoistureStatusProvider().interpret({
        capability: SOIL_MOISTURE_CAPABILITY_ID,
        records,
      });
      return { title: TITLES[kind], result, gapCount: gaps.length };
    }
    case "wind": {
      const { records, gaps } = await ingest(["WS2M"]);
      const result = await new WindGenerationStatusProvider().interpret({
        capability: WIND_GENERATION_STATUS_CAPABILITY_ID,
        records,
      });
      return { title: TITLES[kind], result, gapCount: gaps.length };
    }
    case "construction-risk": {
      const { records, gaps } = await ingest(["T2M", "WS2M", "PRECTOTCORR"]);
      const result = await new ConstructionRiskStatusProvider().interpret({
        capability: CONSTRUCTION_RISK_CAPABILITY_ID,
        records,
      });
      return { title: TITLES[kind], result, gapCount: gaps.length };
    }
    case "temperature":
    default: {
      const { records, gaps } = await ingest(["T2M"]);
      const result = await new WeatherStatusProvider().interpret({
        capability: WEATHER_TEMPERATURE_CAPABILITY_ID,
        records,
      });
      return { title: TITLES.temperature, result, gapCount: gaps.length };
    }
  }
}
