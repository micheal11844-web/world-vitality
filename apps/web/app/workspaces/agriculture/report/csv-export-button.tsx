"use client";

import { Button } from "@world-vitality/ui-components";

export interface CsvRow {
  fieldName: string;
  metric: string;
  summary: string;
  confidence: string;
  unableToAnswer: boolean;
}

export interface CsvExportButtonProps {
  generatedAt: string;
  rows: CsvRow[];
}

function toCsv({ generatedAt, rows }: CsvExportButtonProps): string {
  const headers = ["field", "generatedAt", "metric", "summary", "confidence", "unableToAnswer"];
  const csvRows = rows.map((r) =>
    [r.fieldName, generatedAt, r.metric, r.summary, r.confidence, String(r.unableToAnswer)]
      .map((field) => `"${field.replace(/"/g, '""')}"`)
      .join(","),
  );
  return [headers.join(","), ...csvRows].join("\n");
}

/**
 * CSV export for Agriculture's report (BUILD_PLAN "STAGE — AGRICULTURE
 * FOLLOW-UP: REPORT/EXPORT"), closing part of PRD A.1's "CSV/PDF season
 * reports" line. Same `Blob` + `URL.createObjectURL` download pattern
 * `insurance/report/csv-export-button.tsx` already established —
 * adapted here for multiple fields (one row per field per metric)
 * rather than Insurance's fixed two-row single-location shape, since
 * Agriculture is genuinely multi-field.
 */
export function CsvExportButton(props: CsvExportButtonProps) {
  function handleClick() {
    const csv = toCsv(props);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `agriculture-field-report-${props.generatedAt.slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="secondary" onClick={handleClick}>
      Download CSV
    </Button>
  );
}
