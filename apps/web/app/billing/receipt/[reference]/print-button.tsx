"use client";

import { Button } from "@world-vitality/ui-components";
import { useI18n } from "../../../../lib/i18n/i18n-provider";

/** Opens the browser's print dialog, from which "Save as PDF" is one choice. */
export function PrintButton() {
  const { t } = useI18n();
  return (
    <Button variant="primary" onClick={() => window.print()}>
      {t("billing.receipt.print")}
    </Button>
  );
}
