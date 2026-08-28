import { can } from "@world-vitality/identity-service";
import { Card, Text, StateDisplay, ConfidenceBadge } from "@world-vitality/ui-components";
import { WorkspaceShell } from "../workspace-shell";
import { getFieldStatus } from "../field-status";
import { getWorkspaceMembership } from "../../../../lib/get-workspace-membership";
import { getAccountService } from "../../../../lib/account";
import { PrintButton } from "./print-button";
import { CsvExportButton, type CsvRow } from "./csv-export-button";

export const dynamic = "force-dynamic";

const WORKSPACE_ID = "agriculture";

/**
 * Agriculture's Field Report — a real, honest current-conditions
 * snapshot export (BUILD_PLAN "STAGE — AGRICULTURE FOLLOW-UP:
 * REPORT/EXPORT"). Closes part of PRD A.1's "Reports" and "Exports"
 * lines, same discipline as every other honestly-scoped report page in
 * this app.
 *
 * **What PRD A.1 actually asks for vs. what this builds:**
 * - PRD A.1: *"Season-end summary report (conditions vs. historical
 *   norms, key events)"* and *"CSV/PDF season reports."* This app has
 *   no historical archive for any field — no prior-season data exists
 *   anywhere in this codebase. Building a "vs. historical norms"
 *   comparison would mean fabricating a baseline, the same
 *   never-fabricate reasoning Insurance and Disaster Monitoring already
 *   applied to their own declined features.
 * - **What this actually is**: a real snapshot of every visible
 *   field's *current* conditions (the exact same numbers `page.tsx`
 *   shows, sourced from the same `getFieldStatus` function — never
 *   independently recomputed, so the two pages can never silently
 *   disagree), exportable as CSV or print/PDF. Not a season summary,
 *   not a historical comparison, not an AI-generated narrative — a
 *   current-state document, stated as such on the page itself.
 * - Gated by `can(role, "reports:create")` — same permission, same
 *   enforcement point (checked on this route directly, not just a
 *   hidden link) as `insurance/report` and `government-ngos/report`.
 *   Field visibility within the report still respects the same
 *   resource-scoped `can(role, "data:view", { resourceId,
 *   scopedResourceIds })` filter `page.tsx` uses — `scoped_field_user`
 *   doesn't currently have `reports:create` at all, so this scoping is
 *   defense-in-depth for a permission combination that doesn't exist
 *   yet, not dead code.
 */
export default async function AgricultureReportPage() {
  const membership = await getWorkspaceMembership(WORKSPACE_ID);

  if (!can(membership.role, "reports:create")) {
    return (
      <WorkspaceShell activeKey="report">
        <StateDisplay
          status="error"
          title="Access denied"
          description="This role does not have permission to create reports in this workspace."
        />
      </WorkspaceShell>
    );
  }

  const allFields = await getAccountService().listFields(WORKSPACE_ID);
  const visibleFields = allFields.filter((field) =>
    can(membership.role, "data:view", {
      resourceId: field.id,
      scopedResourceIds: membership.scopedResourceIds,
    }),
  );
  const statuses = await Promise.all(visibleFields.map((field) => getFieldStatus(field)));
  const generatedAt = new Date().toISOString();

  const csvRows: CsvRow[] = statuses.flatMap(({ field, weather, soilMoisture }) => [
    {
      fieldName: field.name,
      metric: "temperature",
      summary: weather.summary,
      confidence: weather.confidence,
      unableToAnswer: Boolean(weather.unableToAnswer),
    },
    {
      fieldName: field.name,
      metric: "soil_moisture",
      summary: soilMoisture.summary,
      confidence: soilMoisture.confidence,
      unableToAnswer: Boolean(soilMoisture.unableToAnswer),
    },
  ]);

  return (
    <WorkspaceShell activeKey="report">
      <style>{`
        @media print {
          [data-app-shell-chrome] { display: none !important; }
          [data-report-content] { padding: 0 !important; }
        }
      `}</style>
      <div data-report-content style={{ maxWidth: "40rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "var(--wv-space-lg)",
          }}
        >
          <div>
            <Text variant="pageTitle" as="h1">
              Field Report
            </Text>
            <Text variant="caption" style={{ color: "var(--wv-text-secondary)" }}>
              Generated {generatedAt}
            </Text>
          </div>
          <div style={{ display: "flex", gap: "var(--wv-space-sm)" }}>
            <CsvExportButton generatedAt={generatedAt} rows={csvRows} />
            <PrintButton />
          </div>
        </div>

        <Text
          variant="caption"
          style={{
            display: "block",
            marginBottom: "var(--wv-space-lg)",
            color: "var(--wv-text-secondary)",
          }}
        >
          This is a current-conditions snapshot for every field you can see — not a season-end
          summary and not a comparison against historical norms (no prior-season data exists in
          this app). See World Vitality&apos;s data provenance documentation for source details.
        </Text>

        {statuses.length === 0 ? (
          <StateDisplay
            status="empty"
            title="No fields visible"
            description="There are no fields to include in this report."
          />
        ) : (
          statuses.map(({ field, weather, soilMoisture }) => (
            <div key={field.id} style={{ marginBottom: "var(--wv-space-md)" }}>
              <Card>
                <Text variant="sectionTitle" as="h2">
                  {field.name}
                </Text>
                <Text variant="body" style={{ margin: "var(--wv-space-xs) 0" }}>
                  {weather.summary}
                </Text>
                {!weather.unableToAnswer && <ConfidenceBadge level={weather.confidence} />}
                <div style={{ height: "var(--wv-space-xs)" }} />
                <Text variant="body" style={{ margin: "var(--wv-space-xs) 0" }}>
                  {soilMoisture.summary}
                </Text>
                {!soilMoisture.unableToAnswer && (
                  <ConfidenceBadge level={soilMoisture.confidence} />
                )}
              </Card>
            </div>
          ))
        )}
      </div>
    </WorkspaceShell>
  );
}
