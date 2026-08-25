"use client";

import { Button } from "@world-vitality/ui-components";

/**
 * The "formal report export" mechanism (BUILD_PLAN "STAGE — INSURANCE
 * WORKSPACE"), identical in approach to
 * `government-ngos/report/print-button.tsx`: the browser's native
 * Print → Save as PDF, not a new server-side PDF-generation library.
 * `report/page.tsx` provides the print-optimized layout; this button
 * is the only client-interactive piece needed to trigger it.
 */
export function PrintButton() {
  return <Button onClick={() => window.print()}>Print / Save as PDF</Button>;
}
