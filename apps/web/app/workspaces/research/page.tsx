"use client";

import { useState } from "react";
import {
  Button,
  Card,
  Table,
  Text,
  StateDisplay,
  type TableColumn,
} from "@world-vitality/ui-components";
import type { NormalizedDataRecord } from "@world-vitality/data-schemas";
import { fetchDatasetAction, type DatasetSource } from "../../../lib/research-actions";
import { WorkspaceShell } from "./workspace-shell";

const SOURCE_OPTIONS: Array<{ value: DatasetSource; label: string; description: string }> = [
  {
    value: "nasa-power",
    label: "NASA POWER — Current Conditions",
    description: "Public-domain observational data, no API key required.",
  },
  {
    value: "open-meteo",
    label: "Open-Meteo — 7-Day Forecast",
    description: "Free-tier, non-commercial-use license (see this dataset's own License column).",
  },
];

function toCsv(records: NormalizedDataRecord[]): string {
  const headers = [
    "id",
    "metric",
    "value",
    "unit",
    "timestamp",
    "recordType",
    "source",
    "sourceName",
    "license",
    "retrievedAt",
    "knownLimitations",
  ];
  const rows = records.map((r) =>
    [
      r.id,
      r.metric,
      String(r.value),
      r.unit,
      r.timestamp,
      r.recordType ?? "observed",
      r.provenance.source,
      r.provenance.sourceName,
      r.provenance.license,
      r.provenance.retrievedAt,
      r.provenance.knownLimitations.join("; "),
    ]
      .map((field) => `"${field.replace(/"/g, '""')}"`)
      .join(","),
  );
  return [headers.join(","), ...rows].join("\n");
}

function downloadCsv(records: NormalizedDataRecord[], filename: string) {
  const csv = toCsv(records);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const columns: TableColumn<NormalizedDataRecord>[] = [
  { key: "metric", header: "Metric", render: (r) => r.metric },
  { key: "value", header: "Value", render: (r) => r.value.toFixed(2), align: "right" },
  { key: "unit", header: "Unit", render: (r) => r.unit },
  { key: "timestamp", header: "Timestamp", render: (r) => r.timestamp.slice(0, 10) },
  { key: "recordType", header: "Type", render: (r) => r.recordType ?? "observed" },
  { key: "source", header: "Source", render: (r) => r.provenance.sourceName },
  { key: "license", header: "License", render: (r) => r.provenance.license },
  {
    key: "limitations",
    header: "Known Limitations",
    render: (r) =>
      r.provenance.knownLimitations.length > 0
        ? r.provenance.knownLimitations.join("; ")
        : "None stated",
  },
];

/**
 * Research Workspace Home — the **Dataset Explorer** (BUILD_PLAN Stage
 * 14, the fifth workspace), the PRD's own named first-run experience
 * for this workspace (Section A.9). Pulls real records straight from
 * `NasaPowerConnector` or `OpenMeteoConnector` via `fetchDatasetAction`
 * — the exact same connectors every other workspace already uses,
 * unmodified — and shows them with **full provenance inline**, per the
 * PRD's "minimally interpreted, maximally transparent" design for this
 * workspace specifically (see `workspace-shell.tsx`'s doc comment for
 * why there's deliberately no AI interpretation layer here, unlike
 * every other workspace).
 *
 * **Honest scope:**
 * - **CSV export is real** (client-side, from whatever's currently
 *   loaded in the table) — the PRD names CSV explicitly among target
 *   export formats. NetCDF-equivalent and GeoTIFF-equivalent exports,
 *   also named in the PRD, are not built — this platform doesn't
 *   ingest any gridded/raster data that would need them; both
 *   connectors already produce flat point-in-time records, for which
 *   CSV is the natural and sufficient format.
 * - **No Dataset Explorer *search/filter across all sources* yet** —
 *   the PRD describes searching and filtering across "all available
 *   underlying data sources with full metadata." This page lets you
 *   pick one of the two connectors this platform has and fetch its
 *   current output; there's no saved-query or cross-source search
 *   capability, since neither exists anywhere in this codebase yet.
 * - **No saved analyses, no citation-block generation, no research-group
 *   collaboration** — all named in the PRD, none built. This ticket is
 *   the Dataset Explorer itself, not the full workspace.
 * - Same single demo location as every other workspace — no real
 *   "capture research affiliation/purpose" sign-up flow exists.
 *
 * **Not verified against the live NASA POWER or Open-Meteo APIs from
 * this build environment** — same caveat as every other workspace.
 */
export default function ResearchWorkspaceHome() {
  const [source, setSource] = useState<DatasetSource>("nasa-power");
  const [metrics, setMetrics] = useState<Array<"T2M" | "WS2M">>(["T2M", "WS2M"]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | undefined>();
  const [records, setRecords] = useState<NormalizedDataRecord[]>([]);
  const [gapCount, setGapCount] = useState(0);

  async function handleFetch() {
    setStatus("loading");
    const result = await fetchDatasetAction({ source, metrics });
    if (result.ok) {
      setRecords(result.records ?? []);
      setGapCount(result.gaps?.length ?? 0);
      setStatus("idle");
    } else {
      setStatus("error");
      setError(result.error);
    }
  }

  function toggleMetric(metric: "T2M" | "WS2M") {
    setMetrics((prev) =>
      prev.includes(metric) ? prev.filter((m) => m !== metric) : [...prev, metric],
    );
  }

  return (
    <WorkspaceShell activeKey="home">
      <Text variant="pageTitle" as="h1" style={{ marginBottom: "var(--wv-space-lg)" }}>
        Dataset Explorer
      </Text>

      <Card style={{ marginBottom: "var(--wv-space-md)" }}>
        <Text variant="caption">DATASET</Text>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--wv-space-sm)",
            margin: "var(--wv-space-sm) 0",
          }}
        >
          {SOURCE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              style={{ display: "flex", alignItems: "flex-start", gap: "var(--wv-space-sm)" }}
            >
              <input
                type="radio"
                name="source"
                aria-label={opt.label}
                checked={source === opt.value}
                onChange={() => setSource(opt.value)}
                style={{ marginTop: "0.25rem" }}
              />
              <span>
                <Text variant="body" style={{ fontWeight: 500 }}>
                  {opt.label}
                </Text>
                <Text
                  variant="caption"
                  style={{ display: "block", color: "var(--wv-text-secondary)" }}
                >
                  {opt.description}
                </Text>
              </span>
            </label>
          ))}
        </div>

        {source === "nasa-power" && (
          <>
            <Text variant="caption">METRICS</Text>
            <div
              style={{ display: "flex", gap: "var(--wv-space-md)", margin: "var(--wv-space-sm) 0" }}
            >
              <label style={{ display: "flex", alignItems: "center", gap: "var(--wv-space-xs)" }}>
                <input
                  type="checkbox"
                  checked={metrics.includes("T2M")}
                  onChange={() => toggleMetric("T2M")}
                />
                Temperature (T2M)
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "var(--wv-space-xs)" }}>
                <input
                  type="checkbox"
                  checked={metrics.includes("WS2M")}
                  onChange={() => toggleMetric("WS2M")}
                />
                Wind Speed (WS2M)
              </label>
            </div>
          </>
        )}

        <Button
          onClick={handleFetch}
          loading={status === "loading"}
          disabled={source === "nasa-power" && metrics.length === 0}
          style={{ marginTop: "var(--wv-space-sm)" }}
        >
          Fetch dataset
        </Button>
        {status === "error" && (
          <Text
            variant="caption"
            style={{ color: "#b3401f", display: "block", marginTop: "var(--wv-space-sm)" }}
          >
            {error}
          </Text>
        )}
      </Card>

      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "var(--wv-space-sm)",
          }}
        >
          <Text variant="caption">
            {records.length > 0
              ? `${records.length} record(s)${gapCount > 0 ? ` — ${gapCount} gap(s) reported` : ""}`
              : "RESULTS"}
          </Text>
          {records.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => downloadCsv(records, `world-vitality-${source}-export.csv`)}
            >
              Download CSV
            </Button>
          )}
        </div>
        {records.length === 0 ? (
          <StateDisplay
            status="empty"
            title="No dataset loaded yet"
            description="Pick a dataset above and click Fetch dataset."
          />
        ) : (
          <Table columns={columns} rows={records} getRowKey={(r) => r.id} compact />
        )}
      </Card>
    </WorkspaceShell>
  );
}
