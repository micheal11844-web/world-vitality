"use client";

import { Button } from "@world-vitality/ui-components";

/**
 * Agriculture's report export mechanism (BUILD_PLAN "STAGE —
 * AGRICULTURE FOLLOW-UP: REPORT/EXPORT"), identical in approach to
 * `insurance/report/print-button.tsx` and `government-ngos/report/print-button.tsx`:
 * the browser's native Print → Save as PDF, not a new server-side PDF
 * dependency.
 */
export function PrintButton() {
  return <Button onClick={() => window.print()}>Print / Save as PDF</Button>;
}
