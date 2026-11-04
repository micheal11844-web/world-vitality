import Link from "next/link";
import { can } from "@world-vitality/identity-service";
import {
  Card,
  Text,
  StateDisplay,
  ConfidenceBadge,
  buttonStyle,
} from "@world-vitality/ui-components";
import { WorkspaceShell } from "./workspace-shell";
import { AddLocationForm } from "./add-location-form";
import { LocationManageControls } from "./location-manage-controls";
import { getLocationStatus } from "./location-status";
import { getWorkspaceMembership } from "../../../lib/get-workspace-membership";
import { getOrganizationData } from "../../../lib/organization-data";
import { logTelemetry } from "../../../lib/logger";
import { getTranslator } from "../../../lib/i18n/server";

export const dynamic = "force-dynamic";

const WORKSPACE_ID = "government-ngos";

/**
 * Government & NGOs Workspace Home — Jurisdiction Overview (BUILD_PLAN
 * "STAGE — GOVERNMENT & NGOS WORKSPACE", made real-multi-location by
 * "STAGE — GOVERNMENT & NGOS FOLLOW-UP: MONITORED LOCATIONS"). Scoped
 * and confirmed with the owner explicitly before the original build,
 * per PRD A.10's institutional/public-accountability stakes.
 *
 * **The third page in this app that calls `can()` with a real
 * `resourceId`** (Agriculture's Field Overview and Insurance's
 * Underwriting Risk Context came first) — every monitored location is
 * filtered through `can(role, "data:view", { resourceId: location.id,
 * scopedResourceIds })` before being shown, so a `scoped_field_user`
 * ("Field Staff" in this workspace) membership with a real
 * `scopedResourceIds` array now genuinely narrows what's visible —
 * closing the exact "genuinely incomplete" gap this page's own prior
 * honest-scope note named. Every other role continues to see every
 * location, unchanged.
 *
 * **Honest scope, stated plainly, not silently glossed over — this
 * covers a fraction of PRD A.10's actual ambition:**
 * - **Multi-domain overview**: real — reuses two already-proven,
 *   already-tested interpretation capabilities (`WeatherStatusProvider`,
 *   `SoilMoistureStatusProvider`) per monitored location now (not one
 *   hardcoded demo point), genuinely synthesizing climate and
 *   agriculture signals into one view, but built entirely from
 *   capabilities already live elsewhere — no new AI risk introduced for
 *   this workspace.
 * - **Real jurisdiction boundaries**: still NOT built — this app has no
 *   GIS polygon data anywhere. Named "Monitored Locations," not
 *   "jurisdictions" or "regions," deliberately — a single point isn't
 *   honestly a boundary; see `0012_government_ngos_locations.sql`'s
 *   doc comment for the full reasoning. Real jurisdiction boundaries,
 *   if built later, are a separate, larger GIS feature.
 * - **Institutional permission tiers (Agency Admin/Analyst/Field
 *   Staff/Partner Agency)**: real, and **Field Staff's resource-level
 *   scoping is now genuinely real too** (this stage's actual goal) —
 *   see `get-workspace-role.ts`. Still no membership-assignment UI for
 *   creating the *first* membership beyond direct SQL (the Team page
 *   itself is real, per "STAGE — TEAM/INVITE UI") — every real user
 *   still resolves to the least-privileged `viewer_external` role by
 *   default until a membership row exists.
 * - **Formal report export**: real — see `report/page.tsx`, extended
 *   to the real location set in "STAGE — GOVERNMENT & NGOS FOLLOW-UP:
 *   REPORT/EXPORT EXTENDED TO REAL LOCATION SET".
 * - **Edit/delete**: real — see `location-manage-controls.tsx`
 *   ("STAGE — GOVERNMENT & NGOS FOLLOW-UP: MONITORED LOCATIONS
 *   EDIT/DELETE"), closing the same deferred gap Fields and Properties
 *   both had after their own initial create+read stages.
 * - **NOT built, honestly**: cross-agency collaboration features,
 *   custom scenario modeling, donor-specific report templates, and any
 *   AI-generated narrative synthesis of the two domains into prose —
 *   the two capabilities are shown side by side, not blended into a
 *   single AI-written paragraph, to avoid claiming a synthesis
 *   capability beyond what's actually built.
 *
 * **Not verified against the live NASA POWER API from this build
 * environment** — same caveat as every other workspace's page, now
 * applying per-location rather than once.
 */
export default async function GovernmentNgosWorkspaceHome() {
  logTelemetry.event("workspace_viewed", { workspace: WORKSPACE_ID });
  const { t, locale } = await getTranslator();
  // The engine's sentences are English; on a translated page they are marked as such.
  const englishOnly = locale === "en" ? {} : ({ lang: "en", dir: "ltr" } as const);
  const caption = { textTransform: "uppercase" } as const;
  const membership = await getWorkspaceMembership(WORKSPACE_ID);
  const allLocations = await getOrganizationData(membership).listLocations(WORKSPACE_ID);
  const visibleLocations = allLocations.filter((location) =>
    can(membership.role, "data:view", {
      resourceId: location.id,
      scopedResourceIds: membership.scopedResourceIds,
    }),
  );

  const statuses = await Promise.all(
    visibleLocations.map((location) => getLocationStatus(location)),
  );
  const canEdit = can(membership.role, "data:edit");
  const canCreateReports = can(membership.role, "reports:create");
  const headlineInterpretation = statuses[0]?.soilMoisture;

  return (
    <WorkspaceShell
      activeKey="home"
      role={membership.role}
      aiInterpretation={headlineInterpretation}
    >
      <Text variant="pageTitle" as="h1" style={{ marginBottom: "var(--wv-space-xs)" }}>
        {t("nav.jurisdictionOverview")}
      </Text>
      <Text
        variant="body"
        style={{ color: "var(--wv-text-secondary)", marginBottom: "var(--wv-space-lg)" }}
      >
        {t("gov.home.intro", { count: allLocations.length })}
      </Text>

      {canEdit && <AddLocationForm />}

      {statuses.length === 0 ? (
        <StateDisplay
          status="empty"
          title={
            allLocations.length === 0
              ? t("gov.empty.noLocations")
              : t("gov.empty.noLocationsVisible")
          }
          description={allLocations.length === 0 ? t("gov.empty.addAbove") : t("gov.empty.scoped")}
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))",
            gap: "var(--wv-space-md)",
            marginBottom: "var(--wv-space-lg)",
          }}
        >
          {statuses.map(({ location, weather, soilMoisture, ingestionGaps }) => (
            <Card key={location.id}>
              <Text variant="sectionTitle" as="p" style={{ marginBottom: "var(--wv-space-sm)" }}>
                <bdi>{location.label}</bdi>
              </Text>

              <Text variant="caption" style={caption}>
                {t("gov.climate")}
              </Text>
              <div {...englishOnly}>
                {weather.unableToAnswer ? (
                  <Text variant="body" style={{ color: "var(--wv-text-secondary)" }}>
                    {weather.summary}
                  </Text>
                ) : (
                  <>
                    <Text variant="body" style={{ margin: "var(--wv-space-xs) 0" }}>
                      {weather.summary}
                    </Text>
                    <ConfidenceBadge level={weather.confidence} />
                  </>
                )}
              </div>

              <div style={{ height: "var(--wv-space-sm)" }} />

              <Text variant="caption" style={caption}>
                {t("workspace.agriculture.name")}
              </Text>
              <div {...englishOnly}>
                {soilMoisture.unableToAnswer ? (
                  <Text variant="body" style={{ color: "var(--wv-text-secondary)" }}>
                    {soilMoisture.summary}
                  </Text>
                ) : (
                  <>
                    <Text variant="body" style={{ margin: "var(--wv-space-xs) 0" }}>
                      {soilMoisture.summary}
                    </Text>
                    <ConfidenceBadge level={soilMoisture.confidence} />
                  </>
                )}
              </div>

              {ingestionGaps > 0 && (
                <Text
                  variant="caption"
                  style={{ display: "block", marginTop: "var(--wv-space-sm)" }}
                >
                  {t("workspace.gaps", { count: ingestionGaps })}
                </Text>
              )}

              {can(membership.role, "data:edit", {
                resourceId: location.id,
                scopedResourceIds: membership.scopedResourceIds,
              }) && (
                <LocationManageControls
                  locationId={location.id}
                  initialLabel={location.label}
                  initialLatitude={location.latitude}
                  initialLongitude={location.longitude}
                />
              )}
            </Card>
          ))}
        </div>
      )}

      <Card>
        <Text variant="sectionTitle" as="p">
          {t("nav.formalReport")}
        </Text>
        {canCreateReports ? (
          <>
            <Text
              variant="body"
              style={{ color: "var(--wv-text-secondary)", marginBottom: "var(--wv-space-sm)" }}
            >
              {t("gov.reportCard.body")}
            </Text>
            <Link href="/workspaces/government-ngos/report" style={buttonStyle("secondary")}>
              {t("report.open")}
            </Link>
          </>
        ) : (
          <StateDisplay
            status="empty"
            title={t("report.notAvailable")}
            description={t("report.accessDeniedBody")}
          />
        )}
      </Card>
    </WorkspaceShell>
  );
}
