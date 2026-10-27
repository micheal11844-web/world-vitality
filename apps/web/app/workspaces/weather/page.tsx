import { NasaPowerConnector, OpenMeteoConnector } from "@world-vitality/data-ingestion";
import {
  WeatherStatusProvider,
  WEATHER_TEMPERATURE_CAPABILITY_ID,
  WeatherForecastProvider,
  WEATHER_FORECAST_CAPABILITY_ID,
} from "@world-vitality/interpretation-engine";
import { Card, Text, StateDisplay, ConfidenceBadge } from "@world-vitality/ui-components";
import { WorkspaceShell } from "./workspace-shell";
import { logTelemetry } from "../../../lib/logger";
import { LocaleBoundary } from "../../../lib/i18n/locale-boundary";
import { getTranslator } from "../../../lib/i18n/server";
import { resolveWorkspaceLocation, type WorkspaceLocation } from "../../../lib/home-location";
import { LocationNote } from "../location-note";

// Same reasoning as the Agriculture workspace: environmental data must
// be fetched fresh on every request, never baked in at build time.
export const dynamic = "force-dynamic";

// Same demo-location approach as Agriculture (no real user-configured
// saved locations exist yet — PRD Section A.6's "sign-up captures
// locations of interest" isn't built). Reusing the same coordinates as
// the Agriculture demo field for consistency, not because Weather &
// Climate is scoped to farms specifically.
// Fallback only: a user with a home place from onboarding sees that instead
// (`resolveWorkspaceLocation`), and the page says which one it is.
const DEMO_LOCATION = {
  id: "demo-location-1",
  latitude: 7.3775,
  longitude: 3.947,
  label: "Ibadan, Nigeria",
};

async function getTemperatureStatus(location: WorkspaceLocation) {
  const connector = new NasaPowerConnector({
    locations: [location],
    parameters: ["T2M"],
    community: "AG",
    lookbackDays: 7,
  });

  const { records, gaps } = await connector.ingest({
    type: "manual",
    requestedBy: "weather-workspace-home-page",
  });

  const provider = new WeatherStatusProvider();
  const result = await provider.interpret({
    capability: WEATHER_TEMPERATURE_CAPABILITY_ID,
    records,
  });

  return { result, ingestionGaps: gaps };
}

/**
 * Real forecast data (BUILD_PLAN Stage 10, ticket 10.6), from
 * Open-Meteo — the second, genuinely different data provider (see
 * that connector's own doc comment). Kept as a separate fetch/
 * interpret pair from `getTemperatureStatus`, mirroring
 * `WeatherForecastProvider`'s deliberate separation from
 * `WeatherStatusProvider` at the interpretation layer.
 */
async function getForecastTrend(location: WorkspaceLocation) {
  const connector = new OpenMeteoConnector({
    locations: [location],
    forecastDays: 7,
  });

  const { records, gaps } = await connector.ingest({
    type: "manual",
    requestedBy: "weather-workspace-home-page",
  });

  const provider = new WeatherForecastProvider();
  const result = await provider.interpret({
    capability: WEATHER_FORECAST_CAPABILITY_ID,
    records,
  });

  return { result, ingestionGaps: gaps };
}

/**
 * Weather & Climate Workspace Home (BUILD_PLAN Stage 10) — the second
 * workspace, reusing `NasaPowerConnector` unchanged (different
 * `parameters` config only) and following the Agriculture workspace's
 * widget-grid layout pattern exactly.
 *
 * **Honest scope, per widget** (same discipline as Agriculture's own
 * doc comment — not repeating a template, actually re-checking what's
 * real here):
 * - **Status widget**: real — live NASA POWER T2M data, real
 *   classification, real confidence.
 * - **Trend widget**: real, as of Stage 10 ticket 10.6 — live
 *   Open-Meteo forecast data, real lead-time-based confidence gradient
 *   (see `WeatherForecastProvider`). Previously an honest empty state;
 *   this doc comment is updated rather than left stale now that it's
 *   built.
 * - **Alerts, Comparison**: still honest empty states — no
 *   alerts/historical-comparison data model exists (same gap as
 *   Agriculture).
 * - **No Map widget on this page** — the map lives at
 *   `/workspaces/weather/map` (Stage 10 ticket 10.5), same pattern as
 *   Agriculture's separate map route.
 *
 * **Translated** (BUILD_PLAN v91) — the first workspace page to be: the
 * page's own text follows the reader's language. The interpretation
 * itself (the engine's summary, confidence wording and explanation) is
 * generated in English and is not translated yet, so it is marked
 * `lang="en"` and left-to-right rather than passed off as the page's
 * language — the same convention as the Dashboard's live-conditions card.
 *
 * **Not verified against the live APIs from this build environment** —
 * same caveat as Agriculture's page: this sandbox cannot reach
 * power.larc.nasa.gov or api.open-meteo.com, so this is written to
 * handle both outcomes but hasn't been exercised against a real
 * request yet.
 */
export default async function WeatherWorkspaceHome() {
  logTelemetry.event("workspace_viewed", { workspace: "weather" });
  const { t, locale } = await getTranslator();
  const englishOnly = locale === "en" ? {} : ({ lang: "en", dir: "ltr" } as const);
  const caption = { textTransform: "uppercase" } as const;
  const location = await resolveWorkspaceLocation(DEMO_LOCATION);
  const [{ result, ingestionGaps }, { result: forecastResult, ingestionGaps: forecastGaps }] =
    await Promise.all([getTemperatureStatus(location), getForecastTrend(location)]);

  return (
    <LocaleBoundary>
      <WorkspaceShell activeKey="home" aiInterpretation={result}>
        <Text variant="pageTitle" as="h1" style={{ marginBottom: "var(--wv-space-lg)" }}>
          {t("weather.currentConditions")}
        </Text>
        <LocationNote location={location} t={t} />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))",
            gap: "var(--wv-space-md)",
            marginBottom: "var(--wv-space-md)",
          }}
        >
          <Card>
            <Text variant="caption" style={caption}>
              {t("weather.status")}
            </Text>
            <Text variant="sectionTitle" as="p" style={{ margin: "var(--wv-space-xs) 0" }}>
              {t("weather.temperature")}
            </Text>
            <div {...englishOnly}>
              {result.unableToAnswer ? (
                <Text variant="body" style={{ color: "var(--wv-text-secondary)" }}>
                  {result.summary}
                </Text>
              ) : (
                <>
                  <Text variant="body" style={{ marginBottom: "var(--wv-space-xs)" }}>
                    {result.summary}
                  </Text>
                  <ConfidenceBadge level={result.confidence} />
                </>
              )}
            </div>
            {ingestionGaps.length > 0 && (
              <Text variant="caption" style={{ display: "block", marginTop: "var(--wv-space-sm)" }}>
                {t("weather.gaps", { count: ingestionGaps.length })}
              </Text>
            )}
          </Card>

          <Card>
            <Text variant="caption" style={caption}>
              {t("weather.alerts")}
            </Text>
            <StateDisplay status="empty" title={t("weather.noActiveAlerts")} />
          </Card>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))",
            gap: "var(--wv-space-md)",
          }}
        >
          <Card>
            <Text variant="caption" style={caption}>
              {t("weather.trend")}
            </Text>
            <Text variant="sectionTitle" as="p" style={{ margin: "var(--wv-space-xs) 0" }}>
              {t("weather.forecast")}
            </Text>
            {forecastResult.unableToAnswer ? (
              <StateDisplay status="empty" title={t("weather.noForecast")} />
            ) : (
              <div {...englishOnly}>
                <Text variant="body" style={{ marginBottom: "var(--wv-space-xs)" }}>
                  {forecastResult.summary}
                </Text>
                <ConfidenceBadge level={forecastResult.confidence} showDescription />
                <Text
                  variant="caption"
                  style={{ display: "block", marginTop: "var(--wv-space-sm)" }}
                >
                  {forecastResult.explanation}
                </Text>
              </div>
            )}
            {forecastGaps.length > 0 && (
              <Text variant="caption" style={{ display: "block", marginTop: "var(--wv-space-sm)" }}>
                {t("weather.forecastGaps", { count: forecastGaps.length })}
              </Text>
            )}
          </Card>
          <Card>
            <Text variant="caption" style={caption}>
              {t("weather.historicalContext")}
            </Text>
            <StateDisplay status="empty" title={t("weather.noBenchmark")} />
          </Card>
        </div>
      </WorkspaceShell>
    </LocaleBoundary>
  );
}
