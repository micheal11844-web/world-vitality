"use client";

import { useState, type FormEvent } from "react";
import {
  Card,
  Text,
  Button,
  Input,
  ConfidenceBadge,
  StateDisplay,
} from "@world-vitality/ui-components";
import { exploreLocationAction, type ExploreLocationResult } from "../../lib/explore-actions";
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
export function ExploreView() {
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ExploreLocationResult | null>(null);

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
      <Text variant="pageTitle" as="h1" style={{ marginBottom: "var(--wv-space-xs)" }}>
        Explore Your Planet
      </Text>
      <Text
        variant="body"
        style={{ color: "var(--wv-text-secondary)", marginBottom: "var(--wv-space-lg)" }}
      >
        Search any place on Earth for a real, honest snapshot of its current conditions — no account
        needed.
      </Text>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", gap: "var(--wv-space-sm)", maxWidth: "28rem" }}
      >
        <div style={{ flex: 1 }}>
          <Input
            label="Place name"
            placeholder="Try a city, town, or region…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={pending || !query.trim()}>
          {pending ? "Searching…" : "Explore"}
        </Button>
      </form>

      <div style={{ marginTop: "var(--wv-space-lg)", maxWidth: "28rem" }}>
        {!result && !pending && (
          <StateDisplay
            status="empty"
            title="Nowhere explored yet"
            description="Search a place above to see something true about it."
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
              {result.location.name}
              {result.location.country ? `, ${result.location.country}` : ""}
            </Text>
            <Text variant="sectionTitle" as="p" style={{ margin: "var(--wv-space-xs) 0" }}>
              Current Conditions
            </Text>
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
            {typeof result.ingestionGapCount === "number" && result.ingestionGapCount > 0 && (
              <Text variant="caption" style={{ display: "block", marginTop: "var(--wv-space-sm)" }}>
                {result.ingestionGapCount} day(s) had no data available.
              </Text>
            )}
          </Card>
        )}
      </div>
    </ExploreShell>
  );
}
