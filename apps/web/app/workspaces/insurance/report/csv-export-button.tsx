"use client";

import { Button } from "@world-vitality/ui-components";

export interface CsvRow {
  metric: string;
  summary: string;
  confidence: string;
  unableToAnswer: boolean;
}

export interface CsvExportButtonProps {
  location: string;
  generatedAt: string;
  rows: CsvRow[];
}

function toCsv({ location, generatedAt, rows }: CsvExportButtonProps): string {
  const headers = ["location", "generatedAt", "metric", "summary", "confidence", "unableToAnswer"];
  const csvRows = rows.map((r) =>
    [location, generatedAt, r.metric, r.summary, r.confidence, String(r.unableToAnswer)]
      .map((field) => `"${field.replace(/"/g, '""')}"`)
      .join(","),
  );
  return [headers.join(","), ...csvRows].join("\n");
}

/**
 * CSV export for the Insurance report (BUILD_PLAN "STAGE — INSURANCE
 * WORKSPACE"). PRD A.3 names "Auditable PDF/CSV reports" explicitly —
 * the PDF path is `print-button.tsx`'s browser print; this is the CSV
 * half, client-side only, same `Blob` + `URL.createObjectURL` download
 * pattern `research/dataset-explorer.tsx` already established for this
 * app's other CSV export. Deliberately a small, fixed two-row export
 * (weather + soil moisture) matching exactly what's shown on-page, not
 * a generalized reporting/export framework.
 */
export function CsvExportButton(props: CsvExportButtonProps) {
  function handleClick() {
    const csv = toCsv(props);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `insurance-risk-report-${props.generatedAt.slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="secondary" onClick={handleClick}>
      Download CSV
    </Button>
  );
}
