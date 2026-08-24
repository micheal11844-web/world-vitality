"use client";

import { Button } from "@world-vitality/ui-components";

/**
 * The "formal report export" mechanism (BUILD_PLAN "STAGE —
 * GOVERNMENT & NGOS WORKSPACE"): the browser's native Print → Save as
 * PDF, not a new server-side PDF-generation library. Deliberately no
 * new dependency — this app has never generated a PDF anywhere, and a
 * print stylesheet plus `window.print()` is a completely standard,
 * zero-risk way to produce a real, genuine PDF export. `report/page.tsx`
 * provides the print-optimized layout (`@media print` rules); this
 * button is the only client-interactive piece needed to trigger it.
 */
export function PrintButton() {
  return <Button onClick={() => window.print()}>Print / Save as PDF</Button>;
}
