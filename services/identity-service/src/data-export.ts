import type {
  AccountService,
  Field,
  FieldComment,
  GovernmentNgosLocation,
  InsuranceProperty,
  Profile,
  WorkspaceMembership,
} from "./account.js";

/**
 * Everything World Vitality holds that is *about* or *by* one user, in
 * one JSON document. Constitution Section 2, Principle 5 / Privacy
 * Principles: data export must be "as easy as sign-up" — so this is
 * built synchronously on request and handed straight to the browser as
 * a download, rather than the old `requestDataExport` flow that
 * recorded a "pending" row nothing ever completed.
 *
 * **Scope, stated plainly:**
 * - The user's profile and every workspace membership they hold.
 * - Resources they *created* (fields, insured properties, monitored
 *   locations) — by `createdBy`, regardless of any resource scoping on
 *   their membership today.
 * - Comments they *wrote* on fields.
 * - NOT included: other people's data (other members, their comments),
 *   public environmental readings (not personal data, and re-fetchable),
 *   and audit-log entries (no read method exists on `AccountService`
 *   yet — a real, named gap rather than a silent omission, reflected in
 *   `notIncluded` below so the file itself says so).
 */
export interface UserDataExport {
  exportedAt: string;
  format: "world-vitality-data-export/v1";
  profile: Profile;
  memberships: WorkspaceMembership[];
  createdResources: {
    fields: Field[];
    insuredProperties: InsuranceProperty[];
    monitoredLocations: GovernmentNgosLocation[];
  };
  commentsWritten: FieldComment[];
  notIncluded: string[];
}

const AGRICULTURE = "agriculture";
const INSURANCE = "insurance";
const GOVERNMENT_NGOS = "government-ngos";

/**
 * Assembles the export through the `AccountService` interface only (no
 * Supabase types), so it is unit-testable with a plain fake. Per-
 * workspace listing failures are NOT swallowed: a partial export that
 * silently looked complete would be worse than a clear failure.
 */
export async function buildUserDataExport(
  account: AccountService,
  userId: string,
  now: Date = new Date(),
): Promise<UserDataExport> {
  const [profile, memberships] = await Promise.all([
    account.getProfile(userId),
    account.getWorkspaceMemberships(userId),
  ]);
  const workspaceIds = new Set(memberships.map((m) => m.workspaceId));

  const [allFields, allProperties, allLocations] = await Promise.all([
    workspaceIds.has(AGRICULTURE) ? account.listFields(AGRICULTURE) : Promise.resolve([]),
    workspaceIds.has(INSURANCE) ? account.listProperties(INSURANCE) : Promise.resolve([]),
    workspaceIds.has(GOVERNMENT_NGOS)
      ? account.listLocations(GOVERNMENT_NGOS)
      : Promise.resolve([]),
  ]);

  const fields = allFields.filter((f) => f.createdBy === userId);
  const insuredProperties = allProperties.filter((p) => p.createdBy === userId);
  const monitoredLocations = allLocations.filter((l) => l.createdBy === userId);

  // Comments can sit on a field someone else created, so look across
  // every field in the workspaces the user belongs to, keeping only the
  // user's own.
  const commentLists = await Promise.all(allFields.map((f) => account.listFieldComments(f.id)));
  const commentsWritten = commentLists.flat().filter((c) => c.userId === userId);

  return {
    exportedAt: now.toISOString(),
    format: "world-vitality-data-export/v1",
    profile,
    memberships,
    createdResources: { fields, insuredProperties, monitoredLocations },
    commentsWritten,
    notIncluded: [
      "Other people's data (other members, their comments).",
      "Public environmental readings (not personal data; re-fetchable from their sources).",
      "Audit-log entries about your activity (no read access to the audit log exists yet).",
    ],
  };
}
