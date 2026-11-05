"use client";

import { useState } from "react";
import { Card, Select } from "@world-vitality/ui-components";
import type { ConfidenceLevel } from "@world-vitality/interpretation-engine";
import { useI18n } from "../../../../lib/i18n/i18n-provider";
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
  const { t, locale, date } = useI18n();
  const [gradeBand, setGradeBand] = useState<GradeBand>("6-8");

  // Written out in UTC, with no am/pm, so the server and the browser agree on
  // every character of the plan.
  const generatedAt = `${date(props.generatedAt, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "UTC",
  })} UTC`;

  const input: LessonPlanInput = {
    locationLabel: props.locationLabel,
    generatedAt,
    weather: props.weather,
    soilMoisture: props.soilMoisture,
  };
  const planText = generateLessonPlan(input, gradeBand, t, locale);

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
          label={t("edu.lesson.gradeLevel")}
          value={gradeBand}
          onChange={(e) => setGradeBand(e.target.value as GradeBand)}
        >
          {GRADE_BANDS.map((g) => (
            <option key={g.value} value={g.value}>
              {t(g.labelKey)}
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
