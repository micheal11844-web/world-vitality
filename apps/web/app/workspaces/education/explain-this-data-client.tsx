"use client";

import { useState } from "react";
import { Card, Select, Text } from "@world-vitality/ui-components";
import type { ConfidenceLevel } from "@world-vitality/interpretation-engine";
import type { MessageKey } from "@world-vitality/i18n";
import { useI18n } from "../../../lib/i18n/i18n-provider";
import { GRADE_BANDS, simplifyExplanation, type GradeBand } from "./lib/simplify-explanation";

export interface ExplainThisDataClientProps {
  weather: { summary: string; confidence: ConfidenceLevel; unableToAnswer: boolean };
  soilMoisture: { summary: string; confidence: ConfidenceLevel; unableToAnswer: boolean };
}

/**
 * The grade-band selector + simplified-explanation display for the
 * Education workspace's home page. Client-only for the interactive
 * selector; the underlying data was already fetched server-side in
 * `page.tsx` and passed down as props — no client-side data fetching,
 * consistent with the rest of this app.
 */
export function ExplainThisDataClient({ weather, soilMoisture }: ExplainThisDataClientProps) {
  const { t } = useI18n();
  const [gradeBand, setGradeBand] = useState<GradeBand>("6-8");

  return (
    <div>
      {/* A grade picker needs no more room than its longest option. */}
      <div style={{ marginBottom: "var(--wv-space-md)", maxWidth: "20rem" }}>
        <Select
          id="grade-band-select"
          label={t("edu.explainFor")}
          value={gradeBand}
          onChange={(e) => setGradeBand(e.target.value as GradeBand)}
        >
          {GRADE_BANDS.map((g) => (
            <option key={g.value} value={g.value}>
              {t(g.labelKey)}
            </option>
          ))}
        </Select>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))",
          gap: "var(--wv-space-md)",
        }}
      >
        <ExplanationCard
          title="edu.card.temperature"
          topic="weather"
          gradeBand={gradeBand}
          result={weather}
        />
        <ExplanationCard
          title="edu.card.soilMoisture"
          topic="soil-moisture"
          gradeBand={gradeBand}
          result={soilMoisture}
        />
      </div>
    </div>
  );
}

function ExplanationCard({
  title,
  topic,
  gradeBand,
  result,
}: {
  title: MessageKey;
  topic: "weather" | "soil-moisture";
  gradeBand: GradeBand;
  result: { summary: string; confidence: ConfidenceLevel; unableToAnswer: boolean };
}) {
  const { t, locale } = useI18n();
  // The data sentence is the engine's own English wording, left exactly as it
  // is, so on a translated page it is marked as English text.
  const englishOnly = locale === "en" ? {} : ({ lang: "en", dir: "ltr" } as const);

  if (result.unableToAnswer) {
    return (
      <Card>
        <Text variant="sectionTitle" as="p">
          {t(title)}
        </Text>
        <div {...englishOnly}>
          <Text variant="body" style={{ color: "var(--wv-text-secondary)" }}>
            {result.summary}
          </Text>
        </div>
      </Card>
    );
  }

  const explanation = simplifyExplanation(topic, gradeBand, result.summary, result.confidence, t);

  return (
    <Card>
      <Text variant="sectionTitle" as="p" style={{ marginBottom: "var(--wv-space-xs)" }}>
        {t(title)}
      </Text>
      <Text variant="body" style={{ marginBottom: "var(--wv-space-sm)" }}>
        {explanation.intro}
      </Text>
      <div {...englishOnly}>
        <Text variant="body" style={{ fontWeight: 600, marginBottom: "var(--wv-space-xs)" }}>
          {explanation.dataSentence}
        </Text>
      </div>
      <Text
        variant="caption"
        style={{
          display: "block",
          color: "var(--wv-text-secondary)",
          marginBottom: "var(--wv-space-sm)",
        }}
      >
        {explanation.confidencePhrase}
      </Text>
      <Text variant="caption" style={{ display: "block", fontStyle: "italic" }}>
        {t("edu.talkAbout", { prompt: explanation.followUpPrompt })}
      </Text>
    </Card>
  );
}
