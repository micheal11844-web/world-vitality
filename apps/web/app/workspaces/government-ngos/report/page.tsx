import { can } from "@world-vitality/identity-service";
import { Card, Text, StateDisplay, ConfidenceBadge } from "@world-vitality/ui-components";
import { WorkspaceShell } from "../workspace-shell";
import { getLocationStatus } from "../location-status";
import { getWorkspaceMembership } from "../../../../lib/get-workspace-membership";
import { getAccountService } from "../../../../lib/account";
import { PrintButton } from "./print-button";
import { CsvExportButton, type CsvRow } from "./csv-export-button";

export const dynamic = "force-dynamic";

const WORKSPACE_ID = "government-ngos";

/**
 * Government & NGOs' formal report page (BUILD_PLAN "STAGE —
 * GOVERNMENT & NGOS WORKSPACE", extended to the real location set and
 * given real CSV export by "STAGE — GOVERNMENT & NGOS FOLLOW-UP:
 * REPORT/EXPORT EXTENDED TO REAL LOCATION SET"). **Enforces `can(role,
 * "reports:create")` itself, server-side — not just a hidden link on
 * the home page.** The home page's link only appearing for permitted
 * roles is a UX convenience, not the actual security boundary; a
 * `viewer_external` user navigating here directly is still denied,
 * checked again on this page. Location visibility within the report
 * respects the same resource-scoped `can(role, "data:view", {
 * resourceId, scopedResourceIds })` filter `page.tsx` uses — same
 * defense-in-depth reasoning `insurance/report/page.tsx` and
 * `agriculture/report/page.tsx` both already document for their own
 * equivalent filters.
 *
 * Print-optimized via a scoped `<style>` block (`@media print` hides
 * the app shell chrome, keeps only the report content) — see
 * `print-button.tsx`'s doc comment for why this is the export
 * mechanism rather than a new server-side PDF library — plus a real
 * client-side CSV export (`csv-export-button.tsx`, one row per
 * location per metric) — PRD A.10 names both formats explicitly
 * ("Formal report exports suitable for public/policy/donor
 * documentation"), and CSV was real, previously-missing scope until
 * now, not an invented addition.
 *
 * **No audit-log write, unlike Insurance's report** — a deliberate
 * difference, not an inconsistency: PRD A.3 explicitly requires
 * "audit-logged access" for Insurance specifically; PRD A.10 names
 * exports and reports for this workspace but never that requirement,
 * so this page doesn't fabricate one it was never asked for.
 */
export default async function GovernmentNgosReportPage() {
  const membership = await getWorkspaceMembership(WORKSPACE_ID);

  if (!can(membership.role, "reports:create")) {
    return (
      <WorkspaceShell activeKey="report" role={membership.role}>
        <StateDisplay
          status="error"
          title="Access denied"
          description="This role does not have permission to create reports in this workspace."
        />
      </WorkspaceShell>
    );
  }

  const allLocations = await getAccountService().listLocations(WORKSPACE_ID);
  const visibleLocations = allLocations.filter((location) =>
    can(membership.role, "data:view", {
      resourceId: location.id,
      scopedResourceIds: membership.scopedResourceIds,
    }),
  );
  const statuses = await Promise.all(visibleLocations.map((location) => getLocationStatus(location)));
  const generatedAt = new Date().toISOString();

  const csvRows: CsvRow[] = statuses.flatMap(({ location, weather, soilMoisture }) => [
    {
      label: location.label,
      metric: "weather_temperature",
      summary: weather.summary,
      confidence: weather.confidence,
      unableToAnswer: Boolean(weather.unableToAnswer),
    },
    {
      label: location.label,
      metric: "soil_moisture",
      summary: soilMoisture.summary,
      confidence: soilMoisture.confidence,
      unableToAnswer: Boolean(soilMoisture.unableToAnswer),
    },
  ]);

  return (
    <WorkspaceShell activeKey="report" role={membership.role}>
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
              Jurisdiction Overview Report
            </Text>
            <Text variant="caption" style={{ color: "var(--wv-text-secondary)" }}>
              {visibleLocations.length} location{visibleLocations.length === 1 ? "" : "s"} ·
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
          This report covers every monitored location you can see, not a real jurisdiction boundary
          — not suitable for public, policy, or donor documentation as-is. See World
          Vitality&apos;s data provenance documentation for source details.
        </Text>

        {statuses.length === 0 ? (
          <StateDisplay
            status="empty"
            title="No locations visible"
            description="There are no monitored locations to include in this report."
          />
        ) : (
          statuses.map(({ location, weather, soilMoisture }) => (
            <div key={location.id} style={{ marginBottom: "var(--wv-space-md)" }}>
              <Card>
                <Text variant="sectionTitle" as="h2">
                  {location.label}
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
