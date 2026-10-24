"use client";

import { useState } from "react";
import { Card, Select } from "@world-vitality/ui-components";
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
        <Select
          id="lesson-grade-band-select"
          label="Grade level"
          value={gradeBand}
          onChange={(e) => setGradeBand(e.target.value as GradeBand)}
        >
          {GRADE_BANDS.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </Select>
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
