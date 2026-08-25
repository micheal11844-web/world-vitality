"use client";

import { Button } from "@world-vitality/ui-components";
import type { GradeBand } from "../lib/simplify-explanation";

export interface LessonPlanDownloadButtonProps {
  gradeBand: GradeBand;
  content: string;
}

/**
 * Downloads the generated sample lesson plan as a plain-text file.
 * Same `Blob` + `URL.createObjectURL` pattern as
 * `insurance/report/csv-export-button.tsx` and
 * `research/dataset-explorer.tsx`'s CSV export — no new download
 * mechanism introduced for this workspace.
 */
export function LessonPlanDownloadButton({ gradeBand, content }: LessonPlanDownloadButtonProps) {
  function handleClick() {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sample-lesson-plan-${gradeBand}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return <Button onClick={handleClick}>Download Lesson Plan</Button>;
}
