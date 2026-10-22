"use client";

import { useState, useTransition } from "react";
import { Button, Card, Text } from "@world-vitality/ui-components";
import { checkSourcesAction } from "../../../lib/admin/admin-actions";
import type { CheckActionResult, SourceCheckView } from "../../../lib/admin/admin-types";

export interface SourceRow {
  id: string;
  name: string;
  usedFor: string;
  licence: string;
  commercialUse: "permitted" | "restricted";
  commercialNote: string | null;
  hasProbe: boolean;
  provenanceDoc: string;
  keySetting: { name: string; configured: boolean } | null;
}

const stack = { display: "flex", flexDirection: "column", gap: "var(--wv-space-md)" } as const;

function StatusLine({ row, check }: { row: SourceRow; check: SourceCheckView | undefined }) {
  if (!row.hasProbe) {
    return <Text variant="caption">No live check yet — the app reads this source directly.</Text>;
  }
  if (!check) return <Text variant="caption">Not checked yet.</Text>;
  // Words and a symbol carry the meaning; red is kept for life-safety alerts.
  return check.healthy ? (
    <Text variant="body" style={{ fontWeight: 600, color: "var(--wv-accent)" }}>
      <span aria-hidden="true">✓ </span>Responding ({check.milliseconds} ms)
    </Text>
  ) : (
    <Text variant="body" style={{ fontWeight: 700 }}>
      <span aria-hidden="true">✕ </span>Not responding
      {check.detail ? ` — ${check.detail}` : ""}
    </Text>
  );
}

export function SourcesView({ rows }: { rows: SourceRow[] }) {
  const [outcome, setOutcome] = useState<CheckActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  const checks = new Map<string, SourceCheckView>(
    outcome?.status === "ok" ? outcome.results.map((r) => [r.id, r]) : [],
  );

  function runChecks() {
    startTransition(async () => {
      setOutcome(await checkSourcesAction());
    });
  }

  return (
    <div style={{ ...stack, maxWidth: "56rem" }}>
      <Text variant="pageTitle" as="h1">
        Data sources
      </Text>
      <Text variant="body">
        Where the app’s data comes from, what each source’s licence allows, and whether it is
        answering right now. Running the checks makes a few real requests to the providers and is
        recorded in the audit log.
      </Text>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--wv-space-md)",
          flexWrap: "wrap",
        }}
      >
        <Button onClick={runChecks} loading={pending}>
          Run live checks
        </Button>
        <div aria-live="polite">
          {outcome?.status === "ok" && (
            <Text variant="caption" role="status">
              Checked {outcome.checkedAt.slice(0, 16).replace("T", " ")} UTC
            </Text>
          )}
          {outcome?.status === "error" && (
            <Text variant="body" role="alert">
              {outcome.message}
            </Text>
          )}
          {outcome?.status === "denied" && (
            <Text variant="body" role="alert">
              That is not available to you. Reload the page and sign in again if this looks wrong.
            </Text>
          )}
        </div>
      </div>

      <ul style={{ ...stack, listStyle: "none", margin: 0, padding: 0 }}>
        {rows.map((row) => (
          <li key={row.id}>
            <Card>
              <div style={stack}>
                <Text variant="sectionTitle" as="h2">
                  {row.name}
                </Text>
                <Text variant="body">{row.usedFor}</Text>
                <StatusLine row={row} check={checks.get(row.id)} />
                <dl
                  style={{
                    fontFamily: "var(--wv-font-sans)",
                    margin: 0,
                    display: "grid",
                    gridTemplateColumns: "minmax(8rem, 11rem) 1fr",
                    gap: "var(--wv-space-xs) var(--wv-space-sm)",
                    fontSize: "0.875rem",
                  }}
                >
                  <dt style={{ color: "var(--wv-text-secondary)" }}>Licence</dt>
                  <dd style={{ margin: 0 }}>{row.licence}</dd>
                  <dt style={{ color: "var(--wv-text-secondary)" }}>Commercial use</dt>
                  <dd
                    style={{
                      margin: 0,
                      fontWeight: row.commercialUse === "restricted" ? 700 : 400,
                    }}
                  >
                    {row.commercialUse === "restricted" ? "Restricted" : "Permitted"}
                    {row.commercialNote ? ` — ${row.commercialNote}` : ""}
                  </dd>
                  {row.keySetting && (
                    <>
                      <dt style={{ color: "var(--wv-text-secondary)" }}>Access key</dt>
                      <dd style={{ margin: 0 }}>
                        {row.keySetting.configured ? "Set" : "Missing"} (
                        <code>{row.keySetting.name}</code>)
                      </dd>
                    </>
                  )}
                  <dt style={{ color: "var(--wv-text-secondary)" }}>Details</dt>
                  <dd style={{ margin: 0, overflowWrap: "anywhere" }}>
                    <code>{row.provenanceDoc}</code>
                  </dd>
                </dl>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
