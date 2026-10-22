import {
  STAFF_ROLE_LABELS,
  staffCan,
  staffPermissionsFor,
  type PlatformOverview,
} from "@world-vitality/identity-service";
import { sourcesRestrictingCommercialUse } from "@world-vitality/data-ingestion";
import { Card, Text } from "@world-vitality/ui-components";
import { logApplication } from "../../lib/logger";
import { getStaffService, requireStaff } from "../../lib/staff";
import { formatUtc } from "../../lib/admin/format";
import { AdminShell } from "./admin-shell";

const stack = { display: "flex", flexDirection: "column", gap: "var(--wv-space-md)" } as const;

const linkStyle = { color: "var(--wv-accent)" } as const;

function Figure({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--wv-space-xs)" }}>
        <Text variant="display" as="p">
          {value.toLocaleString("en-US")}
        </Text>
        <Text variant="caption">{label}</Text>
      </div>
    </Card>
  );
}

/**
 * Staff console home (BUILD_PLAN "v87"): platform-wide counts only — no
 * names, no emails — so opening it is not an audited access to anyone's
 * data and every staff role may see it.
 */
export default async function AdminOverviewPage() {
  const staff = await requireStaff("overview:view");
  const permissions = staffPermissionsFor(staff.role);

  let overview: PlatformOverview | null = null;
  try {
    overview = await getStaffService().getPlatformOverview();
  } catch (err) {
    logApplication.error("admin_overview_failed", err, { staffUserId: staff.userId });
  }

  const restricted = staffCan(staff.role, "sources:view") ? sourcesRestrictingCommercialUse() : [];

  return (
    <AdminShell current="overview" permissions={permissions}>
      <div style={{ ...stack, maxWidth: "56rem" }}>
        <Text variant="pageTitle" as="h1">
          Admin console
        </Text>
        <Text variant="body">
          Signed in as {staff.email} · {STAFF_ROLE_LABELS[staff.role]}
        </Text>

        {restricted.length > 0 && (
          <Card>
            <div style={stack}>
              <Text variant="sectionTitle" as="h2">
                Before charging for the product
              </Text>
              <Text variant="body">
                {restricted.map((s) => s.name).join(", ")} may not be used commercially on its free
                tier. See{" "}
                <a href="/admin/sources" style={linkStyle}>
                  Data sources
                </a>{" "}
                for what to do before billing starts.
              </Text>
            </div>
          </Card>
        )}

        <section aria-labelledby="platform-heading" style={stack}>
          <Text variant="sectionTitle" as="h2" id="platform-heading">
            The platform right now
          </Text>
          {overview ? (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(11rem, 1fr))",
                  gap: "var(--wv-space-md)",
                }}
              >
                <Figure label="Accounts" value={overview.accounts} />
                <Figure label="New in the last 7 days" value={overview.newLast7Days} />
                <Figure label="New in the last 30 days" value={overview.newLast30Days} />
                <Figure label="Finished or skipped onboarding" value={overview.onboarded} />
                <Figure label="Workspace memberships" value={overview.workspaceMemberships} />
                <Figure label="Active staff" value={overview.activeStaff} />
              </div>
              <Text variant="caption">
                As of {formatUtc(overview.asOf)}. Counts only; no personal details.
              </Text>
            </>
          ) : (
            <Text variant="body" role="alert">
              The counts could not be loaded. The database may be unreachable.
            </Text>
          )}
        </section>

        <Card>
          <div style={stack}>
            <Text variant="sectionTitle" as="h2">
              What you can open
            </Text>
            <ul
              style={{
                fontFamily: "var(--wv-font-sans)",
                margin: 0,
                paddingInlineStart: "1.25rem",
                display: "grid",
                gap: "var(--wv-space-xs)",
              }}
            >
              <li>Overview</li>
              {staffCan(staff.role, "users:lookup") && (
                <li>
                  <a href="/admin/users" style={linkStyle}>
                    User lookup
                  </a>{" "}
                  — one account at a time, by exact email or id. Every lookup is recorded.
                </li>
              )}
              {staffCan(staff.role, "sources:view") && (
                <li>
                  <a href="/admin/sources" style={linkStyle}>
                    Data sources
                  </a>{" "}
                  — licences, and live checks that each source answers.
                </li>
              )}
              {staffCan(staff.role, "audit:view") && (
                <li>
                  <a href="/admin/audit" style={linkStyle}>
                    Audit log
                  </a>{" "}
                  — what staff have done here.
                </li>
              )}
            </ul>
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}
