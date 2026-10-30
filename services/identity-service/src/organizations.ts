import type {
  Field,
  FieldComment,
  GovernmentNgosLocation,
  InsuranceProperty,
  WorkspaceMembership,
  WorkspaceMemberSummary,
} from "./account.js";
import type { Role } from "./roles.js";

/**
 * Organisations (BUILD_PLAN "v93"; migration `0018_organisations.sql`).
 *
 * An organisation is the account that OWNS saved items (fields, insured
 * properties, monitored locations, and the comments on fields) and has
 * members. A person belongs to exactly one. Before this existed, saved
 * items were shared by everyone who had an account, filtered only by a
 * workspace name — see the migration's header for the full story.
 *
 * Two rules the rest of the app relies on:
 *
 *  1. **All saved-item access goes through `OrganizationData`**, a handle
 *     bound to one organisation. `AccountService` has no method that reads
 *     or writes saved items without one, so a call site cannot forget the
 *     organisation filter — it would not compile.
 *
 *  2. **Fail closed.** Anyone whose organisation cannot be established (no
 *     session, a lookup error, a member with no role in this workspace) gets
 *     `emptyOrganizationData()`: reads are empty, writes throw. Showing
 *     nothing is the safe failure; showing someone else's data is not.
 */

export type OrganizationRole = "owner" | "member";

/** The database allows 1–100 characters (`organizations.name`). */
export const MAX_ORGANIZATION_NAME_LENGTH = 100;

/**
 * Tidies a typed organisation name: trims, and turns any run of whitespace
 * (including line breaks and tabs) into one space. Returns `null` when what
 * is left is empty, too long, or contains control characters — the caller
 * shows its own message. Pure, so the screen and the service agree.
 */
export function normaliseOrganizationName(raw: string): string | null {
  if (typeof raw !== "string") return null;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(raw)) return null;
  const name = raw.replace(/\s+/g, " ").trim();
  if (name.length < 1 || name.length > MAX_ORGANIZATION_NAME_LENGTH) return null;
  return name;
}

/** One person in an organisation, for the owner's overview. */
export interface OrganizationPerson {
  userId: string;
  email: string;
  displayName: string | null;
  role: OrganizationRole;
  joinedAt: string | null;
  /**
   * The workspace roles they were given. Empty for the owner, who is
   * `admin_owner` in every workspace without any role rows.
   */
  workspaces: Array<{ workspaceId: string; role: Role }>;
}

/** `renamed`; `invalid_name` (empty, too long, control characters); `not_owner` (changed nothing). */
export type RenameOrganizationResult = "renamed" | "invalid_name" | "not_owner";

export interface OrganizationMembership {
  organizationId: string;
  name: string;
  /** The organisation's owner — whose plan the organisation is on. */
  ownerId: string;
  /** This person's role in the organisation (not their workspace role). */
  role: OrganizationRole;
}

/** What `join_organization` (migration 0018) can answer. */
export type JoinOrganizationResult =
  "joined" | "already" | "seat_limit" | "in_other_organization" | "not_found";

/**
 * A person's access to one workspace, as the whole app sees it.
 *
 *  - **The organisation's owner** is `admin_owner` in every workspace of
 *    their organisation, with no role row needed (and none can lower it).
 *  - **A member** has exactly the role row they were invited with, for the
 *    workspaces they were invited to.
 *  - **A member with no role row for this workspace** — and anyone with no
 *    organisation at all — gets `viewer_external` and NO organisation, so
 *    they see none of the organisation's saved items there.
 *
 * `rows` are the person's `workspace_members` rows; the database guarantees
 * each belongs to the organisation they are in, but a row that names a
 * different organisation is ignored here anyway.
 */
export function resolveWorkspaceMembership(
  organization: OrganizationMembership | null,
  rows: readonly WorkspaceMembership[],
  workspaceId: string,
): WorkspaceMembership {
  if (!organization) {
    return { workspaceId, role: "viewer_external" };
  }
  if (organization.role === "owner") {
    return { workspaceId, role: "admin_owner", organizationId: organization.organizationId };
  }
  const row = rows.find(
    (r) =>
      r.workspaceId === workspaceId &&
      (r.organizationId === undefined || r.organizationId === organization.organizationId),
  );
  if (!row) {
    return { workspaceId, role: "viewer_external" };
  }
  return {
    workspaceId,
    role: row.role as Role,
    ...(row.scopedResourceIds ? { scopedResourceIds: row.scopedResourceIds } : {}),
    organizationId: organization.organizationId,
  };
}

/**
 * Everything one organisation owns, and the people in it. Every method is
 * confined to the organisation this handle was made for — on the write
 * itself (`... and organization_id = <org>`), not in a separate
 * check-then-write — so an id belonging to someone else's organisation is
 * indistinguishable from an id that does not exist.
 *
 * The permission checks (`can(role, ...)`) stay in the callers, exactly as
 * before; this layer only guarantees *whose* data is in play.
 */
export interface OrganizationData {
  /** `null` for the empty (fail-closed) handle. */
  readonly organizationId: string | null;

  /* ---- Agriculture fields ---- */
  listFields(workspaceId: string): Promise<Field[]>;
  createField(field: {
    workspaceId: string;
    name: string;
    latitude: number;
    longitude: number;
    createdBy: string;
  }): Promise<Field>;
  updateField(
    fieldId: string,
    updates: { name?: string; latitude?: number; longitude?: number },
  ): Promise<Field>;
  /** Also removes the id from any member's `scopedResourceIds` in this organisation. */
  deleteField(fieldId: string): Promise<void>;

  /* ---- Insurance properties ---- */
  listProperties(workspaceId: string): Promise<InsuranceProperty[]>;
  createProperty(property: {
    workspaceId: string;
    policyNumber: string;
    propertyAddress: string;
    latitude: number;
    longitude: number;
    createdBy: string;
  }): Promise<InsuranceProperty>;
  updateProperty(
    propertyId: string,
    updates: {
      policyNumber?: string;
      propertyAddress?: string;
      latitude?: number;
      longitude?: number;
    },
  ): Promise<InsuranceProperty>;
  deleteProperty(propertyId: string): Promise<void>;

  /* ---- Government & NGOs monitored locations ---- */
  listLocations(workspaceId: string): Promise<GovernmentNgosLocation[]>;
  createLocation(location: {
    workspaceId: string;
    label: string;
    latitude: number;
    longitude: number;
    createdBy: string;
  }): Promise<GovernmentNgosLocation>;
  updateLocation(
    locationId: string,
    updates: { label?: string; latitude?: number; longitude?: number },
  ): Promise<GovernmentNgosLocation>;
  deleteLocation(locationId: string): Promise<void>;

  /** Fields + properties + locations — what the plan's "saved items" limit counts. */
  countSavedItems(): Promise<number>;

  /* ---- Comments on fields (a comment belongs to its field's organisation) ---- */
  /** `[]` if the field is not in this organisation. */
  listFieldComments(fieldId: string): Promise<FieldComment[]>;
  /** Throws if the field is not in this organisation. */
  createFieldComment(comment: {
    fieldId: string;
    userId: string;
    body: string;
  }): Promise<FieldComment>;
  /** Author-only, and only for a field in this organisation. */
  updateFieldComment(
    commentId: string,
    requestingUserId: string,
    body: string,
  ): Promise<FieldComment>;
  deleteFieldComment(commentId: string, requestingUserId: string): Promise<void>;

  /* ---- People ---- */
  /**
   * Everyone with a role in this workspace of this organisation, joined with
   * their profile. The organisation's owner is always listed (as
   * `admin_owner`, `isOrganizationOwner`) even though they have no role row.
   */
  listWorkspaceMembers(workspaceId: string): Promise<WorkspaceMemberSummary[]>;
  /**
   * Gives an existing organisation member a role in a workspace (an invite
   * being accepted, or a role being changed). Fails if the person is not a
   * member of this organisation — the database enforces it.
   */
  addMember(membership: {
    workspaceId: string;
    userId: string;
    role: Role;
    scopedResourceIds?: string[];
  }): Promise<void>;
  /**
   * Removes a person's role in a workspace. Refuses the organisation's owner
   * and the last `admin_owner`. When it was the person's last role they also
   * leave the organisation, which frees their seat.
   */
  removeMember(workspaceId: string, userId: string): Promise<void>;
  /** People in the organisation — what the plan's "seats" limit counts. */
  countMembers(): Promise<number>;
  /**
   * Everyone in the organisation with the workspace roles they hold, owner
   * first. For the owner's overview; callers must only show it to the owner.
   */
  listPeople(): Promise<OrganizationPerson[]>;
  /**
   * Renames the organisation. `actingUserId` must be its owner: the owner
   * condition is part of the write itself (`WHERE id = … AND owner_id = …`),
   * so a caller that got the check wrong still cannot rename someone else's.
   */
  renameOrganization(actingUserId: string, name: string): Promise<RenameOrganizationResult>;
}

/** Thrown by the empty handle's writes: there is no organisation to write into. */
export class NoOrganizationError extends Error {
  constructor(operation: string) {
    super(`No organisation to ${operation} in.`);
    this.name = "NoOrganizationError";
  }
}

/**
 * The fail-closed handle: reads are empty, writes refuse. Used whenever a
 * person's organisation cannot be established.
 */
export function emptyOrganizationData(): OrganizationData {
  const refuse = (operation: string) => () => Promise.reject(new NoOrganizationError(operation));
  return {
    organizationId: null,
    listFields: async () => [],
    createField: refuse("create a field"),
    updateField: refuse("update a field"),
    deleteField: refuse("delete a field"),
    listProperties: async () => [],
    createProperty: refuse("create a property"),
    updateProperty: refuse("update a property"),
    deleteProperty: refuse("delete a property"),
    listLocations: async () => [],
    createLocation: refuse("create a location"),
    updateLocation: refuse("update a location"),
    deleteLocation: refuse("delete a location"),
    countSavedItems: async () => 0,
    listFieldComments: async () => [],
    createFieldComment: refuse("comment"),
    updateFieldComment: refuse("edit a comment"),
    deleteFieldComment: refuse("delete a comment"),
    listWorkspaceMembers: async () => [],
    addMember: refuse("add a member"),
    removeMember: refuse("remove a member"),
    countMembers: async () => 0,
    listPeople: async () => [],
    renameOrganization: refuse("rename the organisation"),
  };
}

/**
 * Thrown when an organisation's owner tries to delete their account while
 * other people are still in it: deleting the owner deletes the organisation
 * and everything saved in it, which would silently take the other members'
 * work with it.
 */
export class OrganizationHasMembersError extends Error {
  readonly otherMembers: number;
  constructor(otherMembers: number) {
    super(
      `Your organisation still has ${otherMembers} other ${otherMembers === 1 ? "member" : "members"}.`,
    );
    this.name = "OrganizationHasMembersError";
    this.otherMembers = otherMembers;
  }
}
