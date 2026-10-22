import { staffPermissionsFor, type StaffAuditEntry } from "@world-vitality/identity-service";
import { Card, Text } from "@world-vitality/ui-components";
import { logApplication } from "../../../lib/logger";
import { getStaffService, requireStaff } from "../../../lib/staff";
import { formatUtc } from "../../../lib/admin/format";
import { AdminShell } from "../admin-shell";

const PAGE_SIZE = 50;

const ACTION_LABELS: Record<string, string> = {
  "user.lookup": "Looked up an account",
  "sources.check": "Ran data-source checks",
  "audit.view": "Opened the audit log",
};

const cell = {
  padding: "0.5rem 0.75rem",
  borderBottom: "1px solid var(--wv-border)",
  verticalAlign: "top",
  fontSize: "0.875rem",
} as const;

const head = {
  ...cell,
  textAlign: "start",
  color: "var(--wv-text-secondary)",
  fontWeight: 500,
  borderBottom: "2px solid var(--wv-border)",
} as const;

const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,9})?(Z|[+-]\d{2}:\d{2})$/;

/**
 * Only a real timestamp is accepted for paging; anything else means "from
 * the newest". The string is passed on exactly as the database gave it
 * (microseconds included) — round-tripping it through a JavaScript Date
 * would cut it to milliseconds and repeat an entry on the next page.
 */
function parseBefore(value: string | string[] | undefined): string | undefined {
  if (typeof value !== "string" || !TIMESTAMP.test(value)) return undefined;
  return Number.isNaN(Date.parse(value)) ? undefined : value;
}

/**
 * The staff audit log (BUILD_PLAN "v87"): who did what in the console, newest
 * first. Opening it is itself recorded, and it is written *before* the
 * entries are read, so the viewer's own visit appears at the top.
 */
export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ before?: string | string[] }>;
}) {
  const staff = await requireStaff("audit:view");
  const before = parseBefore((await searchParams).before);
  const service = getStaffService();

  let entries: StaffAuditEntry[] | null = null;
  try {
    await service.recordStaffAction({
      actor: { userId: staff.userId, email: staff.email },
      action: "audit.view",
      detail: before ? "Opened an older page of the audit log" : "Opened the audit log",
    });
    entries = await service.listStaffAuditLog({ limit: PAGE_SIZE, before });
  } catch (err) {
    logApplication.error("admin_audit_failed", err, { staffUserId: staff.userId });
  }

  const older =
    entries && entries.length === PAGE_SIZE
      ? `/admin/audit?before=${encodeURIComponent(entries[entries.length - 1]!.createdAt)}`
      : null;

  return (
    <AdminShell current="audit" permissions={staffPermissionsFor(staff.role)}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--wv-space-md)",
          maxWidth: "64rem",
        }}
      >
        <Text variant="pageTitle" as="h1">
          Audit log
        </Text>
        <Text variant="body">
          Every account lookup, data-source check and visit to this page, newest first. Entries
          cannot be edited or deleted. Times are UTC. Searches are recorded by the account they
          found, never by what was typed.
        </Text>

        {entries === null ? (
          <Text variant="body" role="alert">
            The log could not be read. If it could not be written either, nothing is shown.
          </Text>
        ) : entries.length === 0 ? (
          <Card>
            <Text variant="body">Nothing older than this.</Text>
          </Card>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontFamily: "var(--wv-font-sans)",
              }}
            >
              <caption style={{ position: "absolute", left: "-9999px" }}>
                Staff actions, newest first
              </caption>
              <thead>
                <tr>
                  <th scope="col" style={head}>
                    When
                  </th>
                  <th scope="col" style={head}>
                    Who
                  </th>
                  <th scope="col" style={head}>
                    What
                  </th>
                  <th scope="col" style={head}>
                    Account
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id}>
                    <td style={{ ...cell, whiteSpace: "nowrap" }}>{formatUtc(e.createdAt)}</td>
                    <td style={{ ...cell, overflowWrap: "anywhere" }}>{e.staffEmail}</td>
                    <td style={cell}>
                      {ACTION_LABELS[e.action] ?? e.action}
                      {e.detail && (
                        <div style={{ color: "var(--wv-text-secondary)" }}>{e.detail}</div>
                      )}
                    </td>
                    <td style={{ ...cell, overflowWrap: "anywhere" }}>
                      {e.targetUserId ? (
                        <code style={{ fontSize: "0.75rem" }}>{e.targetUserId}</code>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {older && (
          <div>
            <a href={older} style={{ color: "var(--wv-accent)" }}>
              Older entries
            </a>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
