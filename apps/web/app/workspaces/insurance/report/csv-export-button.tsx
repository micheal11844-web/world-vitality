"use client";

import { Button } from "@world-vitality/ui-components";

export interface CsvRow {
  policyNumber: string;
  propertyAddress: string;
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
  const headers = [
    "policyNumber",
    "propertyAddress",
    "generatedAt",
    "metric",
    "summary",
    "confidence",
    "unableToAnswer",
  ];
  const csvRows = rows.map((r) =>
    [r.policyNumber, r.propertyAddress, generatedAt, r.metric, r.summary, r.confidence, String(r.unableToAnswer)]
      .map((field) => `"${field.replace(/"/g, '""')}"`)
      .join(","),
  );
  return [headers.join(","), ...csvRows].join("\n");
}

/**
 * CSV export for the Insurance report (BUILD_PLAN "STAGE — INSURANCE
 * FOLLOW-UP: REPORT/EXPORT EXTENDED TO REAL PORTFOLIO"). Adapted from
 * this file's original fixed two-row single-location shape to one row
 * per property per metric, the same generalization
 * `agriculture/report/csv-export-button.tsx` already made for its own
 * multi-field portfolio — same `Blob` + `URL.createObjectURL` download
 * pattern throughout this app's CSV exports.
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
