import { NasaPowerConnector } from "@world-vitality/data-ingestion";
import {
  WeatherStatusProvider,
  WEATHER_TEMPERATURE_CAPABILITY_ID,
  SoilMoistureStatusProvider,
  SOIL_MOISTURE_CAPABILITY_ID,
} from "@world-vitality/interpretation-engine";
import { can } from "@world-vitality/identity-service";
import { Card, Text, StateDisplay, ConfidenceBadge } from "@world-vitality/ui-components";
import { WorkspaceShell } from "../workspace-shell";
import { getWorkspaceRole } from "../../../../lib/get-workspace-role";
import { getSessionUserId } from "../../../../lib/get-session-user-id";
import { getAccountService } from "../../../../lib/account";
import { logSecurity } from "../../../../lib/logger";
import { PrintButton } from "./print-button";
import { CsvExportButton } from "./csv-export-button";

export const dynamic = "force-dynamic";

const WORKSPACE_ID = "insurance";
const DEMO_LOCATION = {
  id: "demo-insured-location-1",
  latitude: 7.3775,
  longitude: 3.947,
  label: "Demo Insured Location",
};

async function getReportData() {
  const connector = new NasaPowerConnector({
    locations: [DEMO_LOCATION],
    parameters: ["T2M", "GWETROOT"],
    community: "AG",
    lookbackDays: 7,
  });
  const { records } = await connector.ingest({
    type: "manual",
    requestedBy: "insurance-report",
  });

  const weather = await new WeatherStatusProvider().interpret({
    capability: WEATHER_TEMPERATURE_CAPABILITY_ID,
    records,
  });
  const soilMoisture = await new SoilMoistureStatusProvider().interpret({
    capability: SOIL_MOISTURE_CAPABILITY_ID,
    records,
  });

  return { weather, soilMoisture };
}

/**
 * Insurance's formal, auditable report page (BUILD_PLAN "STAGE —
 * INSURANCE WORKSPACE"). Same server-side, route-level enforcement
 * `government-ngos/report/page.tsx` established: `can(role,
 * "reports:create")` is checked here directly, not just via the home
 * page's hidden link.
 *
 * **This is also this app's first real audit-log write.** PRD A.3
 * explicitly requires "audit-logged access" for shared portfolio/report
 * views. Every successful report generation by a permitted, identified
 * user writes one `audit_log` row (`action: "report:generated"`) via
 * `AccountService.recordAuditEvent`. Deliberately fire-and-forget-but-
 * logged: if the audit write itself fails (see `recordAuditEvent`'s doc
 * comment), that failure is logged via `logSecurity` but never blocks
 * the report a genuinely authorized user is entitled to see — an audit
 * trail that can accidentally deny legitimate access would be a worse
 * outcome than one missing log line. If no session userId can be
 * resolved (should not happen past `requireSession()`'s gate, but
 * checked explicitly rather than assumed), the audit write is skipped
 * rather than attempted with a fabricated identity.
 *
 * Print-optimized the same way as Government & NGOs (`@media print`
 * scoped stylesheet, `print-button.tsx`'s `window.print()`), plus a
 * real client-side CSV export (`csv-export-button.tsx`) — PRD A.3 names
 * both formats explicitly.
 */
export default async function InsuranceReportPage() {
  const role = await getWorkspaceRole(WORKSPACE_ID);

  if (!can(role, "reports:create")) {
    return (
      <WorkspaceShell activeKey="home" role={role}>
        <StateDisplay
          status="error"
          title="Access denied"
          description="This role does not have permission to create reports in this workspace."
        />
      </WorkspaceShell>
    );
  }

  const { weather, soilMoisture } = await getReportData();
  const generatedAt = new Date().toISOString();

  const userId = await getSessionUserId();
  if (userId) {
    try {
      await getAccountService().recordAuditEvent({
        workspaceId: WORKSPACE_ID,
        userId,
        action: "report:generated",
        resourceDescription: DEMO_LOCATION.label,
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

  return (
    <WorkspaceShell activeKey="home" role={role}>
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
              {DEMO_LOCATION.label} · Generated {generatedAt}
            </Text>
          </div>
          <div style={{ display: "flex", gap: "var(--wv-space-sm)" }}>
            <CsvExportButton
              location={DEMO_LOCATION.label}
              generatedAt={generatedAt}
              rows={[
                {
                  metric: "weather_temperature",
                  summary: weather.summary,
                  confidence: weather.confidence,
                  unableToAnswer: Boolean(weather.unableToAnswer),
                },
                {
                  metric: "soil_moisture",
                  summary: soilMoisture.summary,
                  confidence: soilMoisture.confidence,
                  unableToAnswer: Boolean(soilMoisture.unableToAnswer),
                },
              ]}
            />
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
          This report is derived from a single demo address, not a real insured portfolio, and
          shows individual hazard signals only — not a synthesized multi-hazard risk score. Not
          suitable for real underwriting, claims, or regulatory documentation as-is. Report access
          is logged to this workspace&apos;s audit trail. See World Vitality&apos;s data
          provenance documentation for source details.
        </Text>

        <Card>
          <Text variant="sectionTitle" as="h2">
            Temperature — Weather Status
          </Text>
          <Text variant="body" style={{ margin: "var(--wv-space-xs) 0" }}>
            {weather.summary}
          </Text>
          {!weather.unableToAnswer && (
            <ConfidenceBadge level={weather.confidence} showDescription />
          )}
        </Card>

        <div style={{ height: "var(--wv-space-md)" }} />

        <Card>
          <Text variant="sectionTitle" as="h2">
            Soil / Drought-Adjacent — Soil Moisture Status
          </Text>
          <Text variant="body" style={{ margin: "var(--wv-space-xs) 0" }}>
            {soilMoisture.summary}
          </Text>
          {!soilMoisture.unableToAnswer && (
            <ConfidenceBadge level={soilMoisture.confidence} showDescription />
          )}
        </Card>
      </div>
    </WorkspaceShell>
  );
}
