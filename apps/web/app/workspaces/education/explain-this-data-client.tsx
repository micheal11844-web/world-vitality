"use client";

import { useState } from "react";
import { Card, Text } from "@world-vitality/ui-components";
import type { ConfidenceLevel } from "@world-vitality/interpretation-engine";
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
  const [gradeBand, setGradeBand] = useState<GradeBand>("6-8");

  return (
    <div>
      <div style={{ marginBottom: "var(--wv-space-md)" }}>
        <Text
          variant="caption"
          style={{ display: "block", marginBottom: "var(--wv-space-xs)" }}
        >
          <label htmlFor="grade-band-select">Explain for:</label>
        </Text>
        <select
          id="grade-band-select"
          value={gradeBand}
          onChange={(e) => setGradeBand(e.target.value as GradeBand)}
          style={{
            padding: "var(--wv-space-xs) var(--wv-space-sm)",
            borderRadius: "var(--wv-radius-sm)",
            border: "1px solid var(--wv-border)",
            fontFamily: "var(--wv-font-sans)",
            fontSize: "0.9375rem",
          }}
        >
          {GRADE_BANDS.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))",
          gap: "var(--wv-space-md)",
        }}
      >
        <ExplanationCard
          title="Temperature"
          topic="weather"
          gradeBand={gradeBand}
          result={weather}
        />
        <ExplanationCard
          title="Soil Moisture"
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
  title: string;
  topic: "weather" | "soil-moisture";
  gradeBand: GradeBand;
  result: { summary: string; confidence: ConfidenceLevel; unableToAnswer: boolean };
}) {
  if (result.unableToAnswer) {
    return (
      <Card>
        <Text variant="sectionTitle" as="p">
          {title}
        </Text>
        <Text variant="body" style={{ color: "var(--wv-text-secondary)" }}>
          {result.summary}
        </Text>
      </Card>
    );
  }

  const explanation = simplifyExplanation(topic, gradeBand, result.summary, result.confidence);

  return (
    <Card>
      <Text variant="sectionTitle" as="p" style={{ marginBottom: "var(--wv-space-xs)" }}>
        {title}
      </Text>
      <Text variant="body" style={{ marginBottom: "var(--wv-space-sm)" }}>
        {explanation.intro}
      </Text>
      <Text variant="body" style={{ fontWeight: 600, marginBottom: "var(--wv-space-xs)" }}>
        {explanation.dataSentence}
      </Text>
      <Text
        variant="caption"
        style={{ display: "block", color: "var(--wv-text-secondary)", marginBottom: "var(--wv-space-sm)" }}
      >
        {explanation.confidencePhrase}
      </Text>
      <Text variant="caption" style={{ display: "block", fontStyle: "italic" }}>
        Talk about it: {explanation.followUpPrompt}
      </Text>
    </Card>
  );
}
