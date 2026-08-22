"use server";

import { NasaPowerConnector } from "@world-vitality/data-ingestion";
import {
  WeatherStatusProvider,
  WEATHER_TEMPERATURE_CAPABILITY_ID,
  type InterpretationResult,
} from "@world-vitality/interpretation-engine";
import { geocodeLocation, type GeocodedLocation } from "./geocode";
import { logTelemetry, logSecurity } from "./logger";

export interface ExploreLocationResult {
  ok: boolean;
  error?: string;
  location?: GeocodedLocation;
  interpretation?: InterpretationResult;
  ingestionGapCount?: number;
}

/**
 * Public Explorer's one real, working capability (BUILD_PLAN "STAGE —
 * PUBLIC EXPLORER WORKSPACE"): resolve any free-text place name to
 * coordinates, then reuse the exact same, already-proven
 * `NasaPowerConnector` + `WeatherStatusProvider` pair the Weather &
 * Climate workspace already uses — same capability, driven by a
 * user-supplied location instead of a hardcoded demo one. Deliberately
 * NOT a new interpretation capability: reusing a real, already-built
 * one for an arbitrary location is exactly what proves the
 * ingestion/interpretation boundary (ADR-0002) actually holds, the
 * same validation `WeatherStatusProvider`'s own doc comment already
 * describes for its second-parameter reuse.
 *
 * This is a Server Action, not a page-level `async function`, because
 * the location is only known once the visitor submits the search form
 * — there's no location to fetch data for at page-render time, unlike
 * every other workspace's demo-location page.
 *
 * No session/auth check here, deliberately — Public Explorer's PRD
 * mission is explicit: "No sign-up required for first exploration."
 * This is the one Server Action in this app intentionally reachable by
 * a fully anonymous visitor.
 */
export async function exploreLocationAction(query: string): Promise<ExploreLocationResult> {
  if (!query || !query.trim()) {
    return { ok: false, error: "Enter a place name to explore." };
  }

  let location: GeocodedLocation | null;
  try {
    location = await geocodeLocation(query);
  } catch (err) {
    logSecurity.error("explore_geocode_failed", err);
    return { ok: false, error: "Couldn't look up that place right now. Please try again." };
  }

  if (!location) {
    return {
      ok: false,
      error: `No place found matching "${query.trim()}". Try a different spelling or a nearby city.`,
    };
  }

  try {
    const connector = new NasaPowerConnector({
      locations: [
        { id: "explore-search", latitude: location.latitude, longitude: location.longitude },
      ],
      parameters: ["T2M"],
      community: "AG",
      lookbackDays: 7,
    });
    const { records, gaps } = await connector.ingest({
      type: "manual",
      requestedBy: "public-explorer-search",
    });

    const provider = new WeatherStatusProvider();
    const interpretation = await provider.interpret({
      capability: WEATHER_TEMPERATURE_CAPABILITY_ID,
      records,
    });

    logTelemetry.event("explore_search_completed", { hasResult: !interpretation.unableToAnswer });

    return {
      ok: true,
      location,
      interpretation,
      ingestionGapCount: gaps.length,
    };
  } catch (err) {
    logSecurity.error("explore_interpretation_failed", err);
    return {
      ok: false,
      error:
        "Found that place, but couldn't fetch its environmental data right now. Please try again shortly.",
    };
  }
}
