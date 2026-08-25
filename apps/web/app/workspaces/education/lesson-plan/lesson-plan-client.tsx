"use client";

import { useState } from "react";
import { Card, Text } from "@world-vitality/ui-components";
import type { ConfidenceLevel } from "@world-vitality/interpretation-engine";
import { GRADE_BANDS, type GradeBand } from "../lib/simplify-explanation";
import { generateLessonPlan, type LessonPlanInput } from "../lib/generate-lesson-plan";
import { LessonPlanDownloadButton } from "./lesson-plan-download-button";

export interface LessonPlanClientProps {
  locationLabel: string;
  generatedAt: string;
  weather: { summary: string; confidence: ConfidenceLevel; unableToAnswer: boolean };
  soilMoisture: { summary: string; confidence: ConfidenceLevel; unableToAnswer: boolean };
}

export function LessonPlanClient(props: LessonPlanClientProps) {
  const [gradeBand, setGradeBand] = useState<GradeBand>("6-8");

  const input: LessonPlanInput = {
    locationLabel: props.locationLabel,
    generatedAt: props.generatedAt,
    weather: props.weather,
    soilMoisture: props.soilMoisture,
  };
  const planText = generateLessonPlan(input, gradeBand);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: "var(--wv-space-sm)",
          marginBottom: "var(--wv-space-md)",
        }}
      >
        <div>
          <Text
            variant="caption"
            style={{ display: "block", marginBottom: "var(--wv-space-xs)" }}
          >
            <label htmlFor="lesson-grade-band-select">Grade level:</label>
          </Text>
          <select
            id="lesson-grade-band-select"
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
        <LessonPlanDownloadButton gradeBand={gradeBand} content={planText} />
      </div>

      <Card>
        <pre
          style={{
            whiteSpace: "pre-wrap",
            fontFamily: "var(--wv-font-sans)",
            fontSize: "0.9375rem",
            margin: 0,
          }}
        >
          {planText}
        </pre>
      </Card>
    </div>
  );
}
