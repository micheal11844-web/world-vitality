"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Button,
  Card,
  Table,
  Text,
  StateDisplay,
  type TableColumn,
} from "@world-vitality/ui-components";
import type { MessageKey } from "@world-vitality/i18n";
import type { NormalizedDataRecord } from "@world-vitality/data-schemas";
import { METRIC_NODES, workspacesUsingMetric } from "@world-vitality/knowledge-graph";
import { fetchDatasetAction, type DatasetSource } from "../../../lib/research-actions";
import { useI18n } from "../../../lib/i18n/i18n-provider";
import { WorkspaceShell } from "./workspace-shell";

const SOURCE_OPTIONS: Array<{ value: DatasetSource; label: MessageKey; description: MessageKey }> =
  [
    {
      value: "nasa-power",
      label: "research.source.nasaPower.label",
      description: "research.source.nasaPower.description",
    },
    {
      value: "open-meteo",
      label: "research.source.openMeteo.label",
      description: "research.source.openMeteo.description",
    },
  ];

/**
 * The data catalog's own metric entries (English, from the knowledge graph)
 * and the translated wording for the ones this page knows. A metric or
 * workspace the catalog adds later falls back to its English label until a
 * key is added here.
 */
const METRIC_TEXT: Record<string, { label: MessageKey; description: MessageKey }> = {
  "metric:T2M": {
    label: "research.metric.T2M.label",
    description: "research.metric.T2M.description",
  },
  "metric:WS2M": {
    label: "research.metric.WS2M.label",
    description: "research.metric.WS2M.description",
  },
  "metric:GWETROOT": {
    label: "research.metric.GWETROOT.label",
    description: "research.metric.GWETROOT.description",
  },
};

const WORKSPACE_NAME: Record<string, MessageKey> = {
  "workspace:agriculture": "workspace.agriculture.name",
  "workspace:weather": "workspace.weather.name",
  "workspace:construction": "workspace.construction.name",
  "workspace:renewable-energy": "workspace.renewable-energy.name",
  "workspace:research": "workspace.research.name",
};

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
 * **Data Relationships panel** (ADR-0004, Phase 1) — shows which
 * workspace(s) each raw metric actually feeds, from
 * `@world-vitality/knowledge-graph`. Deliberately metric → capability →
 * workspace only, not the cross-domain causal reasoning a "knowledge
 * graph" might suggest — see that ADR for the explicit Phase 1/Phase 2
 * split and why Phase 2 isn't built.
 *
 * **Not verified against the live NASA POWER or Open-Meteo APIs from
 * this build environment** — same caveat as every other workspace.
 */
export function DatasetExplorer() {
  const { t, locale } = useI18n();
  const [source, setSource] = useState<DatasetSource>("nasa-power");
  const [metrics, setMetrics] = useState<Array<"T2M" | "WS2M">>(["T2M", "WS2M"]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | undefined>();
  const [records, setRecords] = useState<NormalizedDataRecord[]>([]);
  const [gapCount, setGapCount] = useState(0);

  // The readings are the researcher's raw numbers, shown with two decimals in
  // the reader's own numerals. The provenance columns are the data sources'
  // own wording (English), so on a translated page they are marked as such;
  // codes, units and dates are isolated so they keep their order in Arabic.
  const columns = useMemo<TableColumn<NormalizedDataRecord>[]>(() => {
    const value = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const english = (text: string): ReactNode =>
      locale === "en" ? (
        text
      ) : (
        <span lang="en" dir="ltr">
          {text}
        </span>
      );
    return [
      { key: "metric", header: t("research.col.metric"), render: (r) => <bdi>{r.metric}</bdi> },
      {
        key: "value",
        header: t("research.col.value"),
        render: (r) => value.format(r.value),
        align: "right",
      },
      { key: "unit", header: t("research.col.unit"), render: (r) => <bdi>{r.unit}</bdi> },
      {
        key: "timestamp",
        header: t("research.col.timestamp"),
        render: (r) => <bdi>{r.timestamp.slice(0, 10)}</bdi>,
      },
      {
        key: "recordType",
        header: t("research.col.type"),
        render: (r) =>
          t(r.recordType === "forecast" ? "research.type.forecast" : "research.type.observed"),
      },
      {
        key: "source",
        header: t("research.col.source"),
        render: (r) => english(r.provenance.sourceName),
      },
      {
        key: "license",
        header: t("research.col.license"),
        render: (r) => english(r.provenance.license),
      },
      {
        key: "limitations",
        header: t("research.col.limitations"),
        render: (r) =>
          r.provenance.knownLimitations.length > 0
            ? english(r.provenance.knownLimitations.join("; "))
            : t("research.noneStated"),
      },
    ];
  }, [t, locale]);

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
        {t("nav.datasetExplorer")}
      </Text>

      <Card style={{ marginBottom: "var(--wv-space-md)" }}>
        <Text variant="caption" style={{ textTransform: "uppercase" }}>
          {t("research.dataset")}
        </Text>
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
                aria-label={t(opt.label)}
                checked={source === opt.value}
                onChange={() => setSource(opt.value)}
                style={{ marginTop: "0.25rem" }}
              />
              <span>
                <Text variant="body" style={{ fontWeight: 500 }}>
                  {t(opt.label)}
                </Text>
                <Text
                  variant="caption"
                  style={{ display: "block", color: "var(--wv-text-secondary)" }}
                >
                  {t(opt.description)}
                </Text>
              </span>
            </label>
          ))}
        </div>

        {source === "nasa-power" && (
          <>
            <Text variant="caption" style={{ textTransform: "uppercase" }}>
              {t("research.metrics")}
            </Text>
            <div
              style={{ display: "flex", gap: "var(--wv-space-md)", margin: "var(--wv-space-sm) 0" }}
            >
              <label style={{ display: "flex", alignItems: "center", gap: "var(--wv-space-xs)" }}>
                <input
                  type="checkbox"
                  checked={metrics.includes("T2M")}
                  onChange={() => toggleMetric("T2M")}
                />
                <Text variant="body">{t("research.metric.T2M.label")}</Text>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "var(--wv-space-xs)" }}>
                <input
                  type="checkbox"
                  checked={metrics.includes("WS2M")}
                  onChange={() => toggleMetric("WS2M")}
                />
                <Text variant="body">{t("research.metric.WS2M.label")}</Text>
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
          {t("research.fetch")}
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
          <Text
            variant="caption"
            style={records.length > 0 ? undefined : { textTransform: "uppercase" }}
          >
            {records.length > 0
              ? gapCount > 0
                ? t("research.recordsAndGaps", {
                    records: t("research.records", { count: records.length }),
                    gaps: t("research.gapsReported", { count: gapCount }),
                  })
                : t("research.records", { count: records.length })
              : t("research.results")}
          </Text>
          {records.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => downloadCsv(records, `world-vitality-${source}-export.csv`)}
            >
              {t("report.downloadCsv")}
            </Button>
          )}
        </div>
        {records.length === 0 ? (
          <StateDisplay
            status="empty"
            title={t("research.empty.title")}
            description={t("research.empty.body")}
          />
        ) : (
          <Table columns={columns} rows={records} getRowKey={(r) => r.id} compact />
        )}
      </Card>

      <Card style={{ marginTop: "var(--wv-space-md)" }}>
        <Text variant="caption" style={{ textTransform: "uppercase" }}>
          {t("research.relationships")}
        </Text>
        <Text
          variant="body"
          style={{ color: "var(--wv-text-secondary)", margin: "var(--wv-space-sm) 0" }}
        >
          {t("research.rel.intro")}
        </Text>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--wv-space-sm)" }}>
          {METRIC_NODES.map((metric) => {
            const workspaces = workspacesUsingMetric(metric.id);
            const text = METRIC_TEXT[metric.id];
            const names = workspaces
              .map((w) => {
                const key = WORKSPACE_NAME[w.id];
                return key ? t(key) : w.label;
              })
              .join(t("common.listSeparator"));
            return (
              <div
                key={metric.id}
                style={{
                  padding: "var(--wv-space-sm)",
                  border: "1px solid var(--wv-border)",
                  borderRadius: "var(--wv-radius-sm)",
                }}
              >
                <Text variant="body" style={{ fontWeight: 500 }}>
                  {text ? t(text.label) : metric.label}
                </Text>
                <Text
                  variant="caption"
                  style={{ display: "block", color: "var(--wv-text-secondary)" }}
                >
                  {text ? t(text.description) : metric.description}
                </Text>
                <Text
                  variant="caption"
                  style={{ display: "block", marginTop: "var(--wv-space-xs)" }}
                >
                  {t(workspaces.length >= 3 ? "research.rel.feedsMany" : "research.rel.feeds", {
                    workspaces: names,
                  })}
                </Text>
              </div>
            );
          })}
        </div>
      </Card>
    </WorkspaceShell>
  );
}
