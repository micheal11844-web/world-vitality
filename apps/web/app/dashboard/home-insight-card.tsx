import { Card, ConfidenceBadge, Text } from "@world-vitality/ui-components";
import { personaById, type HomePlace } from "@world-vitality/identity-service";
import { getTranslator } from "../../lib/i18n/server";
import { getPlaceInsight } from "../../lib/place-insight";

/**
 * Live conditions for the user's home place, shown at the top of the
 * Dashboard (PRD B.1: "pre-populated, location-aware content — never
 * a generic empty dashboard"). An async Server Component rendered
 * inside `<Suspense>`, so the Dashboard shell paints immediately and
 * this fills in when NASA POWER answers — a slow or failing provider
 * costs one card, never the page.
 *
 * Which interpretation it shows follows the person's onboarding role
 * (soil moisture for a farmer, wind for energy, …) and falls back to
 * plain current temperature.
 *
 * Translation: the card's own sentences (data-gap note, failure notice)
 * follow the reader's language. The interpretation itself — the
 * engine's title, summary and confidence wording — is generated in
 * English and is *not* translated yet, so it is marked `lang="en"` and
 * left-to-right rather than passed off as the page's language.
 */
export async function HomeInsightCard({
  personaId,
  place,
}: {
  personaId: string | null;
  place: HomePlace;
}) {
  const { t, locale } = await getTranslator();
  const kind = personaById(personaId)?.insight ?? "temperature";
  try {
    const insight = await getPlaceInsight(kind, place);
    const englishOnly = locale === "en" ? {} : ({ lang: "en", dir: "ltr" } as const);
    return (
      <Card>
        <div {...englishOnly}>
          <Text variant="caption">{insight.title.toUpperCase()}</Text>
          <Text variant="body" style={{ margin: "var(--wv-space-xs) 0" }}>
            {insight.result.summary}
          </Text>
          {!insight.result.unableToAnswer && (
            <ConfidenceBadge level={insight.result.confidence} showDescription />
          )}
        </div>
        {insight.gapCount > 0 && (
          <Text variant="caption" style={{ display: "block", marginTop: "var(--wv-space-xs)" }}>
            {t("dashboard.insightGaps", { count: insight.gapCount })}
          </Text>
        )}
      </Card>
    );
  } catch {
    return (
      <Card>
        <Text variant="body" style={{ color: "var(--wv-text-secondary)" }}>
          {t("dashboard.insightFailed")}
        </Text>
      </Card>
    );
  }
}
