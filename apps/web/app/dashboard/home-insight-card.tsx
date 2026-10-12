import { Card, ConfidenceBadge, Text } from "@world-vitality/ui-components";
import { personaById, type HomePlace } from "@world-vitality/identity-service";
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
 */
export async function HomeInsightCard({
  personaId,
  place,
}: {
  personaId: string | null;
  place: HomePlace;
}) {
  const kind = personaById(personaId)?.insight ?? "temperature";
  try {
    const insight = await getPlaceInsight(kind, place);
    return (
      <Card>
        <Text variant="caption">{insight.title.toUpperCase()}</Text>
        <Text variant="body" style={{ margin: "var(--wv-space-xs) 0" }}>
          {insight.result.summary}
        </Text>
        {!insight.result.unableToAnswer && (
          <ConfidenceBadge level={insight.result.confidence} showDescription />
        )}
        {insight.gapCount > 0 && (
          <Text variant="caption" style={{ display: "block", marginTop: "var(--wv-space-xs)" }}>
            {insight.gapCount} day(s) had no data available.
          </Text>
        )}
      </Card>
    );
  } catch {
    return (
      <Card>
        <Text variant="body" style={{ color: "var(--wv-text-secondary)" }}>
          Couldn’t load live conditions for your place right now. They’ll be back on your next
          visit.
        </Text>
      </Card>
    );
  }
}
