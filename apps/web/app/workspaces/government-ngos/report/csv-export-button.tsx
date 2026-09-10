"use client";

import { Button } from "@world-vitality/ui-components";

export interface CsvRow {
  label: string;
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
  const headers = ["label", "generatedAt", "metric", "summary", "confidence", "unableToAnswer"];
  const csvRows = rows.map((r) =>
    [r.label, generatedAt, r.metric, r.summary, r.confidence, String(r.unableToAnswer)]
      .map((field) => `"${field.replace(/"/g, '""')}"`)
      .join(","),
  );
  return [headers.join(","), ...csvRows].join("\n");
}

/**
 * CSV export for the Government & NGOs report (BUILD_PLAN "STAGE —
 * GOVERNMENT & NGOS FOLLOW-UP: REPORT/EXPORT EXTENDED TO REAL LOCATION
 * SET"). PRD A.10 names this explicitly ("Exports: Formal report
 * exports suitable for public/policy/donor documentation") — real,
 * previously-missing scope, not an invented addition. One row per
 * location per metric, mirroring `insurance/report/csv-export-button.tsx`'s
 * exact multi-resource generalization (itself mirrored from
 * `agriculture/report/csv-export-button.tsx`) — same `Blob` +
 * `URL.createObjectURL` download pattern every CSV export in this app
 * already uses.
 */
export function CsvExportButton(props: CsvExportButtonProps) {
  function handleClick() {
    const csv = toCsv(props);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `government-ngos-report-${props.generatedAt.slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="secondary" onClick={handleClick}>
      Download CSV
    </Button>
  );
}
