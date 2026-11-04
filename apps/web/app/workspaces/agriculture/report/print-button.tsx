"use client";

import { Button } from "@world-vitality/ui-components";
import { useI18n } from "../../../../lib/i18n/i18n-provider";

/**
 * Agriculture's report export mechanism (BUILD_PLAN "STAGE —
 * AGRICULTURE FOLLOW-UP: REPORT/EXPORT"), identical in approach to
 * `insurance/report/print-button.tsx` and `government-ngos/report/print-button.tsx`:
 * the browser's native Print → Save as PDF, not a new server-side PDF
 * dependency.
 */
export function PrintButton() {
  const { t } = useI18n();
  return <Button onClick={() => window.print()}>{t("report.print")}</Button>;
}
