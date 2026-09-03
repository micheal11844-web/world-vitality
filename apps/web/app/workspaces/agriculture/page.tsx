import Link from "next/link";
import { can } from "@world-vitality/identity-service";
import { Card, Text, StateDisplay, ConfidenceBadge } from "@world-vitality/ui-components";
import { WorkspaceShell } from "./workspace-shell";
import { AddFieldForm } from "./add-field-form";
import { FieldManageControls } from "./field-manage-controls";
import { FieldComments } from "./field-comments";
import { getFieldStatus } from "./field-status";
import { logTelemetry } from "../../../lib/logger";
import { getWorkspaceMembership } from "../../../lib/get-workspace-membership";
import { getAccountService } from "../../../lib/account";
import { getSessionUserId } from "../../../lib/get-session-user-id";

// Environmental data must be fetched fresh on every request, never
// baked in at build time — a statically prerendered page would show
// the soil-moisture reading from whenever `next build` happened to run,
// forever, which is exactly the kind of stale-data-presented-as-current
// problem Section 11's map timeline labeling exists to prevent.
export const dynamic = "force-dynamic";

/**
 * Agriculture Workspace Home (ticket 6.3; made real-multi-field by
 * BUILD_PLAN "STAGE — AGRICULTURE FIELDS", Part B of the
 * "scoped_field_user resource-scoping + no invite UI" gap-closing
 * work). Uses the shared dashboard widget grammar (Experience Blueprint
 * Section 9).
 *
 * **This is the first page in the whole app that actually calls
 * `can()` with a real `resourceId`** — every field is filtered through
 * `can(role, "data:view", { resourceId: field.id, scopedResourceIds })`
 * before being shown, so a `scoped_field_user` membership with a real
 * `scopedResourceIds` array now genuinely narrows what's visible,
 * closing the *product* gap `roles.ts`'s own module doc comment named
 * (the *mechanism* already existed, untested, since Stage 7). Every
 * other role continues to see every field, unchanged.
 *
 * **Honest scope, per widget** (Section 9 defines 7 widget types):
 * - **Status widget, per field**: real — live NASA POWER data (both
 *   temperature and soil moisture now, not soil moisture alone), real
 *   classification, real confidence, for every field this role/scope
 *   can see.
 * - **Add / edit / delete a field**: all real now (BUILD_PLAN "STAGE —
 *   AGRICULTURE FIELDS FOLLOW-UP: EDIT/DELETE" closed the
 *   previously-flagged gap). Creating is gated by `can(role,
 *   "data:edit")` workspace-wide (no existing resource to scope
 *   against); editing and deleting are gated by the *resource-scoped*
 *   check, `can(role, "data:edit", { resourceId, scopedResourceIds })`
 *   — a `scoped_field_user` holding `data:edit` in general is still
 *   refused for a field outside their configured scope. **Known,
 *   honestly-flagged edge case**: deleting a field doesn't clean up any
 *   membership's `scopedResourceIds` that references it — see
 *   `AccountService.deleteField`'s doc comment.
 * - **Map thumbnail**: still a static placeholder linking to the real
 *   map page, same honest limitation as before — the map page itself
 *   wasn't changed by this stage.
 * - **Trend, Comparison, Alert summary, Recent reports, Team activity**:
 *   still honest `StateDisplay` empty states — no historical-comparison
 *   data model, alerts system, reports system, or team-activity feed
 *   exists yet. Multiple real fields don't change this: fabricating
 *   trend/comparison data would violate the same "never fabricate"
 *   principle regardless of field count.
 * - **Not built, deliberately**: bulk field import — not required for
 *   this stage's or any follow-up's actual goals.
 * - **Field-level commentary/collaboration threads (PRD A.1) — now
 *   real** (BUILD_PLAN "STAGE — AGRICULTURE FIELD COMMENTS"): each
 *   field card has an expandable comment thread, gated by the new
 *   resource-scoped `comments:create` permission (granted to
 *   `admin_owner`/`operational_user`/`scoped_field_user`, not
 *   `viewer_external` — matching PRD A.1's own "Agronomist/Advisor
 *   (read + comment)" vs. "Viewer (read-only)" distinction). Comment
 *   editing/deletion is a real, explicitly-deferred gap, same as
 *   `fields` itself was before its own edit/delete follow-up.
 *
 * **Not verified against the live API from this build environment** —
 * same caveat as `NasaPowerConnector` itself.
 */
export default async function AgricultureWorkspaceHome() {
  logTelemetry.event("workspace_viewed", { workspace: "agriculture" });

  const membership = await getWorkspaceMembership("agriculture");
  const allFields = await getAccountService().listFields("agriculture");
  const visibleFields = allFields.filter((field) =>
    can(membership.role, "data:view", {
      resourceId: field.id,
      scopedResourceIds: membership.scopedResourceIds,
    }),
  );

  const statuses = await Promise.all(visibleFields.map((field) => getFieldStatus(field)));
  const commentsByField = new Map(
    await Promise.all(
      visibleFields.map(
        async (field) =>
          [field.id, await getAccountService().listFieldComments(field.id)] as const,
      ),
    ),
  );
  const canEdit = can(membership.role, "data:edit");
  const currentUserId = await getSessionUserId();
  const canCreateReports = can(membership.role, "reports:create");
  const headlineInterpretation = statuses[0]?.soilMoisture;

  return (
    <WorkspaceShell activeKey="home" aiInterpretation={headlineInterpretation}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--wv-space-lg)",
        }}
      >
        <Text variant="pageTitle" as="h1">
          Field Overview
        </Text>
      </div>

      {canEdit && <AddFieldForm />}

      {statuses.length === 0 ? (
        <StateDisplay
          status="empty"
          title={allFields.length === 0 ? "No fields yet" : "No fields visible for your role"}
          description={
            allFields.length === 0
              ? "Add a field above to get started."
              : "Your access is scoped to specific fields, and none are currently assigned to you."
          }
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(18rem, 1fr))",
            gap: "var(--wv-space-md)",
            marginBottom: "var(--wv-space-lg)",
          }}
        >
          {statuses.map(({ field, weather, soilMoisture, ingestionGaps }) => (
            <Card key={field.id}>
              <Text variant="sectionTitle" as="p" style={{ marginBottom: "var(--wv-space-sm)" }}>
                {field.name}
              </Text>

              <Text variant="caption">SOIL MOISTURE</Text>
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

              <div style={{ height: "var(--wv-space-sm)" }} />

              <Text variant="caption">TEMPERATURE</Text>
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

              {ingestionGaps > 0 && (
                <Text variant="caption" style={{ display: "block", marginTop: "var(--wv-space-sm)" }}>
                  {ingestionGaps} day(s) had no data available.
                </Text>
              )}

              {can(membership.role, "data:edit", {
                resourceId: field.id,
                scopedResourceIds: membership.scopedResourceIds,
              }) && (
                <FieldManageControls
                  fieldId={field.id}
                  initialName={field.name}
                  initialLatitude={field.latitude}
                  initialLongitude={field.longitude}
                />
              )}

              <FieldComments
                fieldId={field.id}
                initialComments={commentsByField.get(field.id) ?? []}
                canComment={can(membership.role, "comments:create", {
                  resourceId: field.id,
                  scopedResourceIds: membership.scopedResourceIds,
                })}
                currentUserId={currentUserId}
              />
            </Card>
          ))}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))",
          gap: "var(--wv-space-md)",
          marginBottom: "var(--wv-space-md)",
        }}
      >
        <Card>
          <Text variant="caption">ALERTS</Text>
          <StateDisplay status="empty" title="No active alerts" />
        </Card>

        <Link
          href="/workspaces/agriculture/map"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <Card>
            <Text variant="caption">MAP</Text>
            <div
              style={{
                marginTop: "var(--wv-space-sm)",
                height: "6rem",
                borderRadius: "var(--wv-radius-sm)",
                backgroundColor: "var(--wv-color-neutral-100)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text variant="caption">View full map →</Text>
            </div>
          </Card>
        </Link>

        {canCreateReports && (
          <Link
            href="/workspaces/agriculture/report"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <Card>
              <Text variant="caption">FIELD REPORT</Text>
              <Text
                variant="body"
                style={{ color: "var(--wv-text-secondary)", marginTop: "var(--wv-space-sm)" }}
              >
                Current-conditions snapshot for every field you can see, exportable as CSV or
                PDF →
              </Text>
            </Card>
          </Link>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))",
          gap: "var(--wv-space-md)",
        }}
      >
        <Card>
          <Text variant="caption">TREND</Text>
          <StateDisplay
            status="empty"
            title="Not enough history yet"
            description="Trend comparisons need more than one season of data."
          />
        </Card>
        <Card>
          <Text variant="caption">COMPARISON</Text>
          <StateDisplay status="empty" title="No regional benchmark yet" />
        </Card>
      </div>
    </WorkspaceShell>
  );
}
