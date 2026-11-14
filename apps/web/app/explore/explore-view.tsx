"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Card,
  Text,
  Button,
  Input,
  ConfidenceBadge,
  StateDisplay,
} from "@world-vitality/ui-components";
import {
  exploreLocationAction,
  exploreResolvedLocationAction,
  type ExploreLocationResult,
} from "../../lib/explore-actions";
import type { GeocodedLocation } from "../../lib/geocode";
import { placeLabel } from "../../lib/explore-link";
import { useI18n } from "../../lib/i18n/i18n-provider";
import { LanguageSwitcher } from "../../lib/i18n/language-switcher";
import { DataCredit } from "../data-credit";
import { ExploreShell } from "./explore-shell";

/**
 * Public Explorer's home page (BUILD_PLAN "STAGE — PUBLIC EXPLORER
 * WORKSPACE") — client component, since the whole point is an
 * interactive search box a fully anonymous visitor drives, with no
 * location known until they submit one. See `explore-actions.ts`'s doc
 * comment for why this is a Server Action rather than a page-level
 * data fetch.
 *
 * **Honest scope, stated plainly, matching every other workspace's own
 * "what's real per widget" doc comment:**
 * - **Search + status result**: real — live NASA POWER data for
 *   whatever place the visitor searches, via the same, already-proven
 *   `WeatherStatusProvider` the Weather & Climate workspace uses.
 * - **Everything else the PRD describes for this workspace is NOT
 *   built yet, deliberately, not silently glossed over**: the "Your
 *   Planet Today" personalized story feed, the delight-oriented global
 *   map, shareable "story card" exports, opt-in alerts for saved
 *   locations, social sharing, and the open-ended AI assistant chat
 *   ("why is it raining so much this year where I live?") are all
 *   still PRD-only. This ships the one real, working piece — arbitrary
 *   free-text location search with a genuine environmental insight,
 *   fully anonymous — not a mocked-up preview of the rest.
 *
 * **Not verified against the live NASA POWER or Open-Meteo Geocoding
 * APIs from this build environment** — same caveat as every other
 * network-dependent code path in this app (this sandbox has no
 * outbound access to power.larc.nasa.gov or geocoding-api.open-meteo.com).
 */
export function ExploreView({ initialLocation }: { initialLocation?: GeocodedLocation | null }) {
  const { t, locale } = useI18n();
  // The engine's sentences are English; mark them so they are read (and laid out) as English.
  const englishOnly = locale === "en" ? {} : ({ lang: "en", dir: "ltr" } as const);
  const [query, setQuery] = useState(initialLocation?.name ?? "");
  const [pending, setPending] = useState(Boolean(initialLocation));
  const [result, setResult] = useState<ExploreLocationResult | null>(null);

  // A Global Search place result arrives as `initialLocation`: explore
  // exactly that place once on mount. The ref keeps React Strict Mode's
  // dev double-invoke from firing the lookup twice.
  const startedInitial = useRef(false);
  useEffect(() => {
    if (!initialLocation || startedInitial.current) return;
    startedInitial.current = true;
    exploreResolvedLocationAction(initialLocation)
      .then(setResult)
      .finally(() => setPending(false));
  }, [initialLocation]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      const next = await exploreLocationAction(query);
      setResult(next);
    } finally {
      setPending(false);
    }
  }

  return (
    <ExploreShell aiInterpretation={result?.ok ? result.interpretation : undefined}>
      {/* Anonymous visitors have no Settings page, so the language picker lives here. */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "var(--wv-space-sm)",
          flexWrap: "wrap",
          marginBottom: "var(--wv-space-xs)",
        }}
      >
        <Text variant="pageTitle" as="h1" style={{ margin: 0 }}>
          {t("explore.title")}
        </Text>
        <LanguageSwitcher compact />
      </div>
      <Text
        variant="body"
        style={{ color: "var(--wv-text-secondary)", marginBottom: "var(--wv-space-lg)" }}
      >
        {t("explore.intro")}
      </Text>

      <form
        onSubmit={handleSubmit}
        // flex-end: the label sits above the field, so the button lines up with
        // the field itself rather than stretching to the label's full height.
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "var(--wv-space-sm)",
          maxWidth: "28rem",
        }}
      >
        <div style={{ flex: 1 }}>
          <Input
            label={t("explore.placeLabel")}
            placeholder={t("explore.placePlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={pending || !query.trim()}>
          {pending ? t("explore.searching") : t("explore.submit")}
        </Button>
      </form>

      <div style={{ marginTop: "var(--wv-space-lg)", maxWidth: "28rem" }}>
        {!result && !pending && (
          <StateDisplay
            status="empty"
            title={t("explore.empty.title")}
            description={t("explore.empty.body")}
          />
        )}

        {result && !result.ok && (
          <Card>
            <Text variant="body" style={{ color: "var(--wv-text-secondary)" }}>
              {result.error}
            </Text>
          </Card>
        )}

        {result && result.ok && result.location && result.interpretation && (
          <Card>
            <Text variant="caption">
              <bdi>{placeLabel(result.location)}</bdi>
            </Text>
            <Text variant="sectionTitle" as="p" style={{ margin: "var(--wv-space-xs) 0" }}>
              {t("weather.currentConditions")}
            </Text>
            <div {...englishOnly}>
              {result.interpretation.unableToAnswer ? (
                <Text variant="body" style={{ color: "var(--wv-text-secondary)" }}>
                  {result.interpretation.summary}
                </Text>
              ) : (
                <>
                  <Text variant="body" style={{ marginBottom: "var(--wv-space-xs)" }}>
                    {result.interpretation.summary}
                  </Text>
                  <ConfidenceBadge level={result.interpretation.confidence} showDescription />
                </>
              )}
            </div>
            {typeof result.ingestionGapCount === "number" && result.ingestionGapCount > 0 && (
              <Text variant="caption" style={{ display: "block", marginTop: "var(--wv-space-sm)" }}>
                {t("workspace.gaps", { count: result.ingestionGapCount })}
              </Text>
            )}
            <DataCredit kind="places" />
          </Card>
        )}
      </div>
    </ExploreShell>
  );
}
