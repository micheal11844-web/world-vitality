import { can } from "@world-vitality/identity-service";
import { Card, Text, StateDisplay, ConfidenceBadge } from "@world-vitality/ui-components";
import { WorkspaceShell } from "../workspace-shell";
import { getPropertyStatus } from "../property-status";
import { getWorkspaceMembership } from "../../../../lib/get-workspace-membership";
import { getSessionUserId } from "../../../../lib/get-session-user-id";
import { getAccountService } from "../../../../lib/account";
import { logSecurity } from "../../../../lib/logger";
import { PrintButton } from "./print-button";
import { CsvExportButton, type CsvRow } from "./csv-export-button";

export const dynamic = "force-dynamic";

const WORKSPACE_ID = "insurance";

/**
 * Insurance's formal, auditable report page (BUILD_PLAN "STAGE —
 * INSURANCE WORKSPACE", extended to the real portfolio by "STAGE —
 * INSURANCE FOLLOW-UP: REPORT/EXPORT EXTENDED TO REAL PORTFOLIO"). Same
 * server-side, route-level enforcement `government-ngos/report/page.tsx`
 * established: `can(role, "reports:create")` is checked here directly,
 * not just via the home page's hidden link. Property visibility within
 * the report respects the same resource-scoped `can(role, "data:view",
 * { resourceId, scopedResourceIds })` filter `page.tsx` uses — same
 * defense-in-depth reasoning `agriculture/report/page.tsx` already
 * documented for its own equivalent filter.
 *
 * **This is also this app's first real audit-log write.** PRD A.3
 * explicitly requires "audit-logged access" for shared portfolio/report
 * views. Every successful report generation by a permitted, identified
 * user writes one `audit_log` row (`action: "report:generated"`) via
 * `AccountService.recordAuditEvent` — one event per report generation,
 * describing the whole visible portfolio, not one event per property.
 * Deliberately fire-and-forget-but-logged: if the audit write itself
 * fails (see `recordAuditEvent`'s doc comment), that failure is logged
 * via `logSecurity` but never blocks the report a genuinely authorized
 * user is entitled to see — an audit trail that can accidentally deny
 * legitimate access would be a worse outcome than one missing log line.
 * If no session userId can be resolved (should not happen past
 * `requireSession()`'s gate, but checked explicitly rather than
 * assumed), the audit write is skipped rather than attempted with a
 * fabricated identity.
 *
 * Print-optimized the same way as Agriculture's own report
 * (`@media print` scoped stylesheet, `print-button.tsx`'s
 * `window.print()`), plus a real client-side CSV export
 * (`csv-export-button.tsx`, now one row per property per metric,
 * mirroring `agriculture/report/csv-export-button.tsx`'s own
 * generalization from a fixed single-location shape) — PRD A.3 names
 * both formats explicitly.
 */
export default async function InsuranceReportPage() {
  const membership = await getWorkspaceMembership(WORKSPACE_ID);

  if (!can(membership.role, "reports:create")) {
    return (
      <WorkspaceShell activeKey="home" role={membership.role}>
        <StateDisplay
          status="error"
          title="Access denied"
          description="This role does not have permission to create reports in this workspace."
        />
      </WorkspaceShell>
    );
  }

  const allProperties = await getAccountService().listProperties(WORKSPACE_ID);
  const visibleProperties = allProperties.filter((property) =>
    can(membership.role, "data:view", {
      resourceId: property.id,
      scopedResourceIds: membership.scopedResourceIds,
    }),
  );
  const statuses = await Promise.all(visibleProperties.map((property) => getPropertyStatus(property)));
  const generatedAt = new Date().toISOString();

  const userId = await getSessionUserId();
  if (userId) {
    try {
      await getAccountService().recordAuditEvent({
        workspaceId: WORKSPACE_ID,
        userId,
        action: "report:generated",
        resourceDescription: `Portfolio report (${visibleProperties.length} propert${visibleProperties.length === 1 ? "y" : "ies"})`,
      });
    } catch (err) {
      logSecurity.error("audit_event_write_failed", err, {
        workspace: WORKSPACE_ID,
        action: "report:generated",
      });
    }
  } else {
    logSecurity.warn("audit_event_skipped_no_session_user_id", { workspace: WORKSPACE_ID });
  }

  const csvRows: CsvRow[] = statuses.flatMap(({ property, weather, soilMoisture }) => [
    {
      policyNumber: property.policyNumber,
      propertyAddress: property.propertyAddress,
      metric: "weather_temperature",
      summary: weather.summary,
      confidence: weather.confidence,
      unableToAnswer: Boolean(weather.unableToAnswer),
    },
    {
      policyNumber: property.policyNumber,
      propertyAddress: property.propertyAddress,
      metric: "soil_moisture",
      summary: soilMoisture.summary,
      confidence: soilMoisture.confidence,
      unableToAnswer: Boolean(soilMoisture.unableToAnswer),
    },
  ]);

  return (
    <WorkspaceShell activeKey="home" role={membership.role}>
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
              Underwriting Risk Report
            </Text>
            <Text variant="caption" style={{ color: "var(--wv-text-secondary)" }}>
              {visibleProperties.length} propert{visibleProperties.length === 1 ? "y" : "ies"} ·
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
          This report covers every insured property you can see, and shows individual hazard
          signals only — not a synthesized multi-hazard risk score. Not suitable for real
          underwriting, claims, or regulatory documentation as-is. Report access is logged to this
          workspace&apos;s audit trail. See World Vitality&apos;s data provenance documentation for
          source details.
        </Text>

        {statuses.length === 0 ? (
          <StateDisplay
            status="empty"
            title="No properties visible"
            description="There are no insured properties to include in this report."
          />
        ) : (
          statuses.map(({ property, weather, soilMoisture }) => (
            <div key={property.id} style={{ marginBottom: "var(--wv-space-md)" }}>
              <Card>
                <Text variant="sectionTitle" as="h2">
                  {property.policyNumber}
                </Text>
                <Text
                  variant="caption"
                  style={{ display: "block", color: "var(--wv-text-secondary)", marginBottom: "var(--wv-space-xs)" }}
                >
                  {property.propertyAddress}
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
