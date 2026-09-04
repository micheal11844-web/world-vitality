import type { SupabaseClient } from "@supabase/supabase-js";
import type { Role } from "./roles.js";

export interface Profile {
  userId: string;
  email: string;
  displayName: string | null;
  createdAt: string;
}

/** A user's role within one specific workspace — roles are workspace-
 *  scoped, not global (see roles.ts). */
export interface WorkspaceMembership {
  workspaceId: string;
  role: Role;
  /**
   * Optional resource-level restriction, consumed by `can()`'s `scope`
   * parameter (see roles.ts). `undefined`/empty means workspace-wide
   * access. Real since BUILD_PLAN "STAGE — AGRICULTURE FIELDS": the
   * Team page's invite-time field picker is a real product surface that
   * writes a populated value here, for Agriculture's `scoped_field_user`
   * memberships specifically. Every other workspace still has no
   * resource type to populate this with, so `undefined` remains the
   * only real value there — the correct default, not a gap.
   */
  scopedResourceIds?: string[];
}

/**
 * The status of a requested data export. Export generation is
 * necessarily asynchronous — per ADR-0002's service separation, identity-
 * service cannot itself reach into `data-ingestion` or `interpretation-
 * engine` to assemble a user's full data footprint; it can only record
 * the request and report status. Actual cross-service export assembly
 * needs its own design (a job that each service contributes to), out of
 * scope for this foundational ticket.
 */
export interface DataExportRequest {
  exportId: string;
  requestedAt: string;
  status: "pending" | "ready" | "failed";
  /** Populated once status is "ready" — a signed, time-limited download URL. */
  downloadUrl?: string;
}

/**
 * A single audit-log entry (Insurance workspace, BUILD_PLAN "STAGE —
 * INSURANCE WORKSPACE"). This app's first audit log — `logger.ts` has
 * flagged "no admin/config mutation surface exists yet to audit" as an
 * honest gap since Stage 7; PRD A.3 (Insurance) is the first workspace
 * that actually requires one ("shared portfolio views... with
 * audit-logged access"). Deliberately narrow: one action per entry,
 * append-only, no generic audit framework — see
 * `supabase/migrations/0004_audit_log.sql` for why this isn't
 * generalized yet.
 */
export interface AuditLogEntry {
  id: string;
  workspaceId: string;
  userId: string;
  action: string;
  resourceDescription?: string;
  createdAt: string;
}

/**
 * One workspace member, joined with their profile for display (BUILD_PLAN
 * "STAGE — TEAM/INVITE UI"). `email`/`displayName` come from `profiles`,
 * not `workspace_members` itself — see `listWorkspaceMembers`'s doc
 * comment for why this is two queries merged in application code rather
 * than a single PostgREST embedded-relationship query.
 */
export interface WorkspaceMemberSummary {
  userId: string;
  email: string;
  displayName: string | null;
  role: Role;
  scopedResourceIds?: string[];
}

/**
 * A real, workspace-scoped resource — Agriculture's (BUILD_PLAN "STAGE
 * — AGRICULTURE FIELDS", PRD A.1's "Field Overview"). See
 * `services/identity-service/supabase/migrations/0006_agriculture_fields.sql`'s
 * doc comment for why this is its own table rather than a generic
 * cross-workspace "resources" concept. As of BUILD_PLAN "STAGE —
 * INSURANCE FOLLOW-UP: INSURED PROPERTIES", Insurance has its own
 * separate real resource type too (`InsuranceProperty`, below) — same
 * reasoning applied to a second, genuinely different domain rather
 * than merged into this one.
 */
export interface Field {
  id: string;
  workspaceId: string;
  name: string;
  latitude: number;
  longitude: number;
  createdBy: string | null;
  createdAt: string;
}

/**
 * A real, workspace-scoped resource for Insurance (BUILD_PLAN "STAGE —
 * INSURANCE FOLLOW-UP: INSURED PROPERTIES"), closing the honest gap
 * `insurance/workspace-shell.tsx`'s own doc comment named: Claims
 * Adjuster's resource-level scoping ("scoped to relevant claims," PRD
 * A.3) had no populated data to scope to. Named "property," not
 * "claim" — see `0011_insurance_properties.sql`'s doc comment for why
 * that's a deliberate scope decision (no claims-event data model
 * exists anywhere in this app; fabricating one would misrepresent real
 * data the same way a fabricated risk score would).
 */
export interface InsuranceProperty {
  id: string;
  workspaceId: string;
  policyNumber: string;
  propertyAddress: string;
  latitude: number;
  longitude: number;
  createdBy: string | null;
  createdAt: string;
}

/**
 * One comment on a field (BUILD_PLAN "STAGE — AGRICULTURE FIELD
 * COMMENTS", PRD A.1's "commentary threads on specific fields").
 * `email`/`displayName` are joined from `profiles`, same reasoning as
 * `WorkspaceMemberSummary` — no FK-based embedded join exists between
 * `field_comments` and `profiles`.
 */
export interface FieldComment {
  id: string;
  fieldId: string;
  userId: string;
  email: string;
  displayName: string | null;
  body: string;
  createdAt: string;
  updatedAt: string | null;
}

/**
 * Account settings basics (BUILD_PLAN ticket 3.3), required to exist
 * before any real user data accumulates per Constitution Section 11
 * (Privacy Principles) and Section 2, Principle 5: "Data export, account
 * deletion, and unsubscription must be as easy as sign-up."
 *
 * No UI is built against this yet — that's Stage 6 (`apps/web`). This is
 * the backend contract Stage 6's settings screen will call.
 */
export interface AccountService {
  getProfile(userId: string): Promise<Profile>;

  updateProfile(userId: string, updates: Partial<Pick<Profile, "displayName">>): Promise<Profile>;

  getWorkspaceMemberships(userId: string): Promise<WorkspaceMembership[]>;

  /**
   * Creates (or updates, if one already exists) a workspace membership
   * row directly — the second real way a `workspace_members` row can
   * come into existence, alongside the invite-accept flow that is this
   * method's one real caller (`app/auth/callback/route.ts`'s `invite`
   * branch). Upserts on `(workspace_id, user_id)` rather than failing on
   * conflict, since a user could in principle click an old invite link
   * twice before it's fully consumed, or an admin could re-invite
   * someone whose membership already exists to change their role.
   */
  createMembership(membership: {
    workspaceId: string;
    userId: string;
    role: Role;
    scopedResourceIds?: string[];
  }): Promise<void>;

  /**
   * Kick off a data export. Must not require more effort from the user
   * than sign-up did (Constitution Section 2, Principle 5) — a single
   * call, no support ticket, no manual approval step.
   */
  requestDataExport(userId: string): Promise<DataExportRequest>;

  getDataExportStatus(exportId: string): Promise<DataExportRequest>;

  /**
   * Permanently delete the account and all associated data. Same "no
   * harder than sign-up" bar applies — implementations must not gate
   * this behind manual review as their default path.
   */
  deleteAccount(userId: string): Promise<void>;

  /**
   * Record one audit-log entry (see `AuditLogEntry`'s doc comment).
   * Callers should treat this as fire-and-forget-but-not-swallowed: a
   * failure here is logged by the caller via `logSecurity`, but must
   * never block the underlying action (e.g. a report a user is
   * genuinely permitted to generate) from completing — an audit trail
   * that can silently prevent legitimate use would be the wrong
   * trade-off. See `apps/web/app/workspaces/insurance/report/page.tsx`
   * for the one real caller today.
   */
  recordAuditEvent(entry: {
    workspaceId: string;
    userId: string;
    action: string;
    resourceDescription?: string;
  }): Promise<AuditLogEntry>;

  /**
   * Lists everyone with a membership in one workspace, joined with their
   * profile for display (BUILD_PLAN "STAGE — TEAM/INVITE UI", closing
   * the "no invite/admin console anywhere" gap flagged since Government
   * & NGOs). Backs the `/workspaces/[workspaceId]/team` page.
   */
  listWorkspaceMembers(workspaceId: string): Promise<WorkspaceMemberSummary[]>;

  /**
   * Removes one member's access to a workspace. Refuses (throws) if the
   * target is that workspace's last remaining `admin_owner` — a real
   * safety rail, not a UI-only convenience check, since this is the
   * first place in this app a membership row can be deleted at all.
   * Without it, a workspace could be left with zero admins and no way
   * back in short of direct SQL (this app's only recourse today for
   * every membership operation before this one).
   */
  removeMember(workspaceId: string, userId: string): Promise<void>;

  /**
   * Lists the real resource rows for a workspace (currently only
   * Agriculture's `fields` table has any rows). Returns every field
   * regardless of role/scope — callers filter to what the current
   * user's role/scope actually permits via `can(role, "data:view", {
   * resourceId, scopedResourceIds })`, the same pattern used everywhere
   * else `can()` gates a list.
   */
  listFields(workspaceId: string): Promise<Field[]>;

  /**
   * Creates a real field row. Callers gate this with `can(role,
   * "data:edit")` (workspace-wide — creating a field has no existing
   * resourceId to scope against) before calling.
   */
  createField(field: {
    workspaceId: string;
    name: string;
    latitude: number;
    longitude: number;
    createdBy: string;
  }): Promise<Field>;

  /**
   * Lists the real insured-property rows for a workspace (currently
   * only Insurance's `insurance_properties` table has any rows) —
   * Insurance's analog of `listFields`. Same "returns every row
   * regardless of role/scope, callers filter via `can(role,
   * "data:view", { resourceId, scopedResourceIds })`" pattern.
   */
  listProperties(workspaceId: string): Promise<InsuranceProperty[]>;

  /**
   * Creates a real insured-property row. Callers gate this with
   * `can(role, "data:edit")` (workspace-wide — creating a property has
   * no existing resourceId to scope against), same reasoning as
   * `createField`.
   */
  createProperty(property: {
    workspaceId: string;
    policyNumber: string;
    propertyAddress: string;
    latitude: number;
    longitude: number;
    createdBy: string;
  }): Promise<InsuranceProperty>;

  /**
   * Updates an insured property's fields — Insurance's analog of
   * `updateField`. Callers must gate this with a *resource-scoped*
   * `can(role, "data:edit", { resourceId: propertyId, scopedResourceIds
   * })` check, same reasoning as `updateField`.
   */
  updateProperty(
    propertyId: string,
    updates: {
      policyNumber?: string;
      propertyAddress?: string;
      latitude?: number;
      longitude?: number;
    },
  ): Promise<InsuranceProperty>;

  /**
   * Deletes an insured property. Same resource-scoped gating as
   * `updateProperty`, and the same dangling-`scopedResourceIds`
   * cleanup `deleteField` performs — a `scoped_field_user` membership
   * scoped to a since-deleted property would otherwise carry a
   * reference to nothing, same real edge case closed for Fields.
   */
  deleteProperty(propertyId: string): Promise<void>;

  /**
   * Updates a field's name/coordinates. Callers must gate this with a
   * *resource-scoped* `can(role, "data:edit", { resourceId: fieldId,
   * scopedResourceIds })` check — unlike `createField` (no existing
   * resource to scope against), editing an existing field is exactly
   * the kind of action `roles.ts`'s scoping mechanism was built for: a
   * `scoped_field_user` holding `data:edit` in general must still be
   * refused for a field outside their configured scope.
   */
  updateField(
    fieldId: string,
    updates: { name?: string; latitude?: number; longitude?: number },
  ): Promise<Field>;

  /**
   * Deletes a field. Same resource-scoped `can()` gating requirement as
   * `updateField`. Also cleans up any membership's `scopedResourceIds`
   * that references the deleted field id — closing what was originally
   * a known, flagged gap (a dangling reference in a plain string array,
   * not a foreign key, that could leave a `scoped_field_user` seeing
   * zero fields until their membership was manually updated).
   */
  deleteField(fieldId: string): Promise<void>;

  /**
   * Lists comments on a field, oldest first, joined with each
   * commenter's profile for display — same two-query merge pattern as
   * `listWorkspaceMembers`.
   */
  listFieldComments(fieldId: string): Promise<FieldComment[]>;

  /**
   * Creates a comment on a field. Callers must gate this with a
   * *resource-scoped* `can(role, "comments:create", { resourceId:
   * fieldId, scopedResourceIds })` check — same reasoning as
   * `updateField`/`deleteField`: a `scoped_field_user` holding
   * `comments:create` in general must still be refused for a field
   * outside their configured scope.
   */
  createFieldComment(comment: {
    fieldId: string;
    userId: string;
    body: string;
  }): Promise<FieldComment>;

  /**
   * Edits a comment's body (BUILD_PLAN "STAGE — AGRICULTURE FIELD
   * COMMENTS FOLLOW-UP: EDIT/DELETE"), closing the gap
   * `0007_field_comments.sql`'s own doc comment named explicitly. Only
   * the comment's original author may edit it — enforced by a `WHERE
   * id = commentId AND user_id = requestingUserId` clause on the write
   * itself (see the Supabase implementation), not a separate
   * fetch-then-compare step, so there is no window between checking
   * and writing. Callers must also independently hold a resource-scoped
   * `can(role, "comments:create", { resourceId: fieldId,
   * scopedResourceIds })` — same two-layer check `createFieldComment`
   * already requires (a `scoped_field_user` who lost that field from
   * their scope, or a demoted user, is still refused even for their own
   * prior comment). Throws if no row matches the id+author pair, so
   * "comment doesn't exist" and "you're not the author" are
   * deliberately indistinguishable to the caller — same reasoning
   * `removeMember`'s last-`admin_owner` refusal uses: don't leak which
   * failure occurred.
   */
  updateFieldComment(commentId: string, requestingUserId: string, body: string): Promise<FieldComment>;

  /**
   * Deletes a comment. Same author-only enforcement and error-shape
   * reasoning as `updateFieldComment`. No admin/moderator override
   * exists — PRD A.1 names "commentary threads," not moderation; adding
   * an override would be scope this stage was never asked to build,
   * not an oversight.
   */
  deleteFieldComment(commentId: string, requestingUserId: string): Promise<void>;
}

/**
 * `AccountService` implemented against Supabase (Postgres `profiles` and
 * `workspace_members` tables — see `supabase/migrations/0001_identity_foundation.sql`).
 *
 * Like `SupabaseAuthService`, this is written directly against Supabase's
 * documented client API, not exercised against a live project yet — no
 * project has been provisioned. `requestDataExport` here only records the
 * request and returns `pending`; it does not yet assemble real export
 * data from other services (see `DataExportRequest`'s doc comment).
 */
export class SupabaseAccountService implements AccountService {
  constructor(private readonly client: SupabaseClient) {}

  async getProfile(userId: string): Promise<Profile> {
    const { data, error } = await this.client
      .from("profiles")
      .select("user_id, email, display_name, created_at")
      .eq("user_id", userId)
      .single();
    if (error || !data) {
      throw new Error(`Failed to load profile for ${userId}: ${error?.message ?? "not found"}`);
    }
    return {
      userId: data.user_id,
      email: data.email,
      displayName: data.display_name,
      createdAt: data.created_at,
    };
  }

  async updateProfile(
    userId: string,
    updates: Partial<Pick<Profile, "displayName">>,
  ): Promise<Profile> {
    const { error } = await this.client
      .from("profiles")
      .update({ display_name: updates.displayName })
      .eq("user_id", userId);
    if (error) {
      throw new Error(`Failed to update profile for ${userId}: ${error.message}`);
    }
    return this.getProfile(userId);
  }

  async getWorkspaceMemberships(userId: string): Promise<WorkspaceMembership[]> {
    const { data, error } = await this.client
      .from("workspace_members")
      .select("workspace_id, role, scoped_resource_ids")
      .eq("user_id", userId);
    if (error) {
      throw new Error(`Failed to load workspace memberships for ${userId}: ${error.message}`);
    }
    return (data ?? []).map((row) => ({
      workspaceId: row.workspace_id,
      role: row.role as Role,
      // Column is nullable; null/absent means "not resource-scoped" —
      // mapped to `undefined`, not `[]`, so it matches can()'s
      // "no scope configured" branch rather than an empty-array edge
      // case with different (accidentally deny-all) semantics.
      scopedResourceIds: row.scoped_resource_ids ?? undefined,
    }));
  }

  async createMembership(membership: {
    workspaceId: string;
    userId: string;
    role: Role;
    scopedResourceIds?: string[];
  }): Promise<void> {
    const { error } = await this.client.from("workspace_members").upsert(
      {
        workspace_id: membership.workspaceId,
        user_id: membership.userId,
        role: membership.role,
        scoped_resource_ids: membership.scopedResourceIds ?? null,
      },
      { onConflict: "workspace_id,user_id" },
    );
    if (error) {
      throw new Error(
        `Failed to create membership for ${membership.userId} in ${membership.workspaceId}: ${error.message}`,
      );
    }
  }

  async requestDataExport(userId: string): Promise<DataExportRequest> {
    const { data, error } = await this.client
      .from("data_export_requests")
      .insert({ user_id: userId, status: "pending" })
      .select("id, requested_at, status")
      .single();
    if (error || !data) {
      throw new Error(`Failed to create data export request for ${userId}: ${error?.message}`);
    }
    return { exportId: data.id, requestedAt: data.requested_at, status: data.status };
  }

  async getDataExportStatus(exportId: string): Promise<DataExportRequest> {
    const { data, error } = await this.client
      .from("data_export_requests")
      .select("id, requested_at, status, download_url")
      .eq("id", exportId)
      .single();
    if (error || !data) {
      throw new Error(`Data export request ${exportId} not found`);
    }
    return {
      exportId: data.id,
      requestedAt: data.requested_at,
      status: data.status,
      downloadUrl: data.download_url ?? undefined,
    };
  }

  async deleteAccount(userId: string): Promise<void> {
    // Deletes the auth user directly; `profiles`/`workspace_members` rows
    // cascade via the FK ON DELETE CASCADE defined in the migration, so
    // this one call satisfies "as easy as sign-up" rather than requiring
    // the caller to delete rows across multiple tables itself.
    const { error } = await this.client.auth.admin.deleteUser(userId);
    if (error) {
      throw new Error(`Failed to delete account ${userId}: ${error.message}`);
    }
  }

  async recordAuditEvent(entry: {
    workspaceId: string;
    userId: string;
    action: string;
    resourceDescription?: string;
  }): Promise<AuditLogEntry> {
    const { data, error } = await this.client
      .from("audit_log")
      .insert({
        workspace_id: entry.workspaceId,
        user_id: entry.userId,
        action: entry.action,
        resource_description: entry.resourceDescription ?? null,
      })
      .select("id, workspace_id, user_id, action, resource_description, created_at")
      .single();
    if (error || !data) {
      throw new Error(`Failed to record audit event for ${entry.userId}: ${error?.message}`);
    }
    return {
      id: data.id,
      workspaceId: data.workspace_id,
      userId: data.user_id,
      action: data.action,
      resourceDescription: data.resource_description ?? undefined,
      createdAt: data.created_at,
    };
  }

  /**
   * Two queries merged in application code, not one embedded-relationship
   * PostgREST query: `workspace_members.user_id` and `profiles.user_id`
   * both reference `auth.users(id)` independently, but there is no FK
   * between `workspace_members` and `profiles` directly for PostgREST to
   * infer a join from — so this fetches members, then fetches matching
   * profiles by the resulting user_ids, then merges by hand. A member
   * with no matching profile row (should not happen once `profiles` has
   * a signup trigger, but not verified here) falls back to an empty
   * display name rather than being silently dropped from the list.
   */
  async listWorkspaceMembers(workspaceId: string): Promise<WorkspaceMemberSummary[]> {
    const { data: members, error: membersError } = await this.client
      .from("workspace_members")
      .select("user_id, role, scoped_resource_ids")
      .eq("workspace_id", workspaceId);
    if (membersError) {
      throw new Error(`Failed to load members for ${workspaceId}: ${membersError.message}`);
    }
    if (!members || members.length === 0) {
      return [];
    }

    const userIds = members.map((m) => m.user_id);
    const { data: profiles, error: profilesError } = await this.client
      .from("profiles")
      .select("user_id, email, display_name")
      .in("user_id", userIds);
    if (profilesError) {
      throw new Error(
        `Failed to load profiles for ${workspaceId} members: ${profilesError.message}`,
      );
    }
    const profileById = new Map((profiles ?? []).map((p) => [p.user_id, p]));

    return members.map((m) => {
      const profile = profileById.get(m.user_id);
      return {
        userId: m.user_id,
        email: profile?.email ?? "(no profile found)",
        displayName: profile?.display_name ?? null,
        role: m.role as Role,
        scopedResourceIds: m.scoped_resource_ids ?? undefined,
      };
    });
  }

  async removeMember(workspaceId: string, userId: string): Promise<void> {
    const members = await this.listWorkspaceMembers(workspaceId);
    const target = members.find((m) => m.userId === userId);
    if (!target) {
      // Already gone — deleting a non-existent membership is not an
      // error a caller needs to handle specially.
      return;
    }
    const remainingAdminOwners = members.filter((m) => m.role === "admin_owner");
    if (target.role === "admin_owner" && remainingAdminOwners.length <= 1) {
      throw new Error(
        `Cannot remove ${userId}: they are the last admin_owner in workspace ${workspaceId}.`,
      );
    }

    const { error } = await this.client
      .from("workspace_members")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId);
    if (error) {
      throw new Error(`Failed to remove member ${userId} from ${workspaceId}: ${error.message}`);
    }
  }

  async listFields(workspaceId: string): Promise<Field[]> {
    const { data, error } = await this.client
      .from("fields")
      .select("id, workspace_id, name, latitude, longitude, created_by, created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true });
    if (error) {
      throw new Error(`Failed to load fields for ${workspaceId}: ${error.message}`);
    }
    return (data ?? []).map((row) => ({
      id: row.id,
      workspaceId: row.workspace_id,
      name: row.name,
      latitude: row.latitude,
      longitude: row.longitude,
      createdBy: row.created_by,
      createdAt: row.created_at,
    }));
  }

  async createField(field: {
    workspaceId: string;
    name: string;
    latitude: number;
    longitude: number;
    createdBy: string;
  }): Promise<Field> {
    const { data, error } = await this.client
      .from("fields")
      .insert({
        workspace_id: field.workspaceId,
        name: field.name,
        latitude: field.latitude,
        longitude: field.longitude,
        created_by: field.createdBy,
      })
      .select("id, workspace_id, name, latitude, longitude, created_by, created_at")
      .single();
    if (error || !data) {
      throw new Error(`Failed to create field in ${field.workspaceId}: ${error?.message}`);
    }
    return {
      id: data.id,
      workspaceId: data.workspace_id,
      name: data.name,
      latitude: data.latitude,
      longitude: data.longitude,
      createdBy: data.created_by,
      createdAt: data.created_at,
    };
  }

  async listProperties(workspaceId: string): Promise<InsuranceProperty[]> {
    const { data, error } = await this.client
      .from("insurance_properties")
      .select("id, workspace_id, policy_number, property_address, latitude, longitude, created_by, created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true });
    if (error) {
      throw new Error(`Failed to load insured properties for ${workspaceId}: ${error.message}`);
    }
    return (data ?? []).map((row) => ({
      id: row.id,
      workspaceId: row.workspace_id,
      policyNumber: row.policy_number,
      propertyAddress: row.property_address,
      latitude: row.latitude,
      longitude: row.longitude,
      createdBy: row.created_by,
      createdAt: row.created_at,
    }));
  }

  async createProperty(property: {
    workspaceId: string;
    policyNumber: string;
    propertyAddress: string;
    latitude: number;
    longitude: number;
    createdBy: string;
  }): Promise<InsuranceProperty> {
    const { data, error } = await this.client
      .from("insurance_properties")
      .insert({
        workspace_id: property.workspaceId,
        policy_number: property.policyNumber,
        property_address: property.propertyAddress,
        latitude: property.latitude,
        longitude: property.longitude,
        created_by: property.createdBy,
      })
      .select("id, workspace_id, policy_number, property_address, latitude, longitude, created_by, created_at")
      .single();
    if (error || !data) {
      throw new Error(
        `Failed to create insured property in ${property.workspaceId}: ${error?.message}`,
      );
    }
    return {
      id: data.id,
      workspaceId: data.workspace_id,
      policyNumber: data.policy_number,
      propertyAddress: data.property_address,
      latitude: data.latitude,
      longitude: data.longitude,
      createdBy: data.created_by,
      createdAt: data.created_at,
    };
  }

  async updateProperty(
    propertyId: string,
    updates: {
      policyNumber?: string;
      propertyAddress?: string;
      latitude?: number;
      longitude?: number;
    },
  ): Promise<InsuranceProperty> {
    const patch: Record<string, string | number> = {};
    if (updates.policyNumber !== undefined) patch.policy_number = updates.policyNumber;
    if (updates.propertyAddress !== undefined) patch.property_address = updates.propertyAddress;
    if (updates.latitude !== undefined) patch.latitude = updates.latitude;
    if (updates.longitude !== undefined) patch.longitude = updates.longitude;

    const { data, error } = await this.client
      .from("insurance_properties")
      .update(patch)
      .eq("id", propertyId)
      .select("id, workspace_id, policy_number, property_address, latitude, longitude, created_by, created_at")
      .single();
    if (error || !data) {
      throw new Error(`Failed to update insured property ${propertyId}: ${error?.message}`);
    }
    return {
      id: data.id,
      workspaceId: data.workspace_id,
      policyNumber: data.policy_number,
      propertyAddress: data.property_address,
      latitude: data.latitude,
      longitude: data.longitude,
      createdBy: data.created_by,
      createdAt: data.created_at,
    };
  }

  async deleteProperty(propertyId: string): Promise<void> {
    // Same dangling-scopedResourceIds cleanup as deleteField, applied
    // to insurance_properties instead of fields — see deleteField's
    // own comment for the full reasoning (fetch-then-write rather than
    // a single computed SQL update, since the Supabase JS client's
    // .update() sets literal values, not SQL expressions referencing
    // the existing row).
    const { data: affected, error: fetchError } = await this.client
      .from("workspace_members")
      .select("workspace_id, user_id, scoped_resource_ids")
      .contains("scoped_resource_ids", [propertyId]);
    if (fetchError) {
      throw new Error(
        `Failed to check for memberships scoped to property ${propertyId}: ${fetchError.message}`,
      );
    }
    for (const membership of affected ?? []) {
      const updatedScope = (membership.scoped_resource_ids ?? []).filter(
        (id: string) => id !== propertyId,
      );
      const { error: updateError } = await this.client
        .from("workspace_members")
        .update({ scoped_resource_ids: updatedScope })
        .eq("workspace_id", membership.workspace_id)
        .eq("user_id", membership.user_id);
      if (updateError) {
        throw new Error(
          `Failed to remove dangling reference to property ${propertyId} from membership ${membership.user_id}: ${updateError.message}`,
        );
      }
    }

    const { error } = await this.client.from("insurance_properties").delete().eq("id", propertyId);
    if (error) {
      throw new Error(`Failed to delete insured property ${propertyId}: ${error.message}`);
    }
  }

  async updateField(
    fieldId: string,
    updates: { name?: string; latitude?: number; longitude?: number },
  ): Promise<Field> {
    const patch: Record<string, string | number> = {};
    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.latitude !== undefined) patch.latitude = updates.latitude;
    if (updates.longitude !== undefined) patch.longitude = updates.longitude;

    const { data, error } = await this.client
      .from("fields")
      .update(patch)
      .eq("id", fieldId)
      .select("id, workspace_id, name, latitude, longitude, created_by, created_at")
      .single();
    if (error || !data) {
      throw new Error(`Failed to update field ${fieldId}: ${error?.message}`);
    }
    return {
      id: data.id,
      workspaceId: data.workspace_id,
      name: data.name,
      latitude: data.latitude,
      longitude: data.longitude,
      createdBy: data.created_by,
      createdAt: data.created_at,
    };
  }

  async deleteField(fieldId: string): Promise<void> {
    // Clean up any membership's scopedResourceIds referencing this
    // field BEFORE deleting it — closing a previously-flagged gap
    // (BUILD_PLAN "STAGE — AGRICULTURE FOLLOW-UP: REPORT/EXPORT").
    // Fetch-then-write rather than a single computed SQL update: the
    // Supabase JS client's .update() sets literal values, not SQL
    // expressions referencing the existing row (no array_remove()
    // support without a dedicated RPC function, which felt like more
    // new infra than this small cleanup warranted).
    const { data: affected, error: fetchError } = await this.client
      .from("workspace_members")
      .select("workspace_id, user_id, scoped_resource_ids")
      .contains("scoped_resource_ids", [fieldId]);
    if (fetchError) {
      throw new Error(
        `Failed to check for memberships scoped to field ${fieldId}: ${fetchError.message}`,
      );
    }
    for (const membership of affected ?? []) {
      const updatedScope = (membership.scoped_resource_ids ?? []).filter(
        (id: string) => id !== fieldId,
      );
      const { error: updateError } = await this.client
        .from("workspace_members")
        .update({ scoped_resource_ids: updatedScope })
        .eq("workspace_id", membership.workspace_id)
        .eq("user_id", membership.user_id);
      if (updateError) {
        throw new Error(
          `Failed to remove dangling reference to field ${fieldId} from membership ${membership.user_id}: ${updateError.message}`,
        );
      }
    }

    const { error } = await this.client.from("fields").delete().eq("id", fieldId);
    if (error) {
      throw new Error(`Failed to delete field ${fieldId}: ${error.message}`);
    }
  }

  async listFieldComments(fieldId: string): Promise<FieldComment[]> {
    const { data: comments, error: commentsError } = await this.client
      .from("field_comments")
      .select("id, field_id, user_id, body, created_at, updated_at")
      .eq("field_id", fieldId)
      .order("created_at", { ascending: true });
    if (commentsError) {
      throw new Error(`Failed to load comments for field ${fieldId}: ${commentsError.message}`);
    }
    if (!comments || comments.length === 0) {
      return [];
    }

    const userIds = [...new Set(comments.map((c) => c.user_id))];
    const { data: profiles, error: profilesError } = await this.client
      .from("profiles")
      .select("user_id, email, display_name")
      .in("user_id", userIds);
    if (profilesError) {
      throw new Error(
        `Failed to load profiles for field ${fieldId} comments: ${profilesError.message}`,
      );
    }
    const profileById = new Map((profiles ?? []).map((p) => [p.user_id, p]));

    return comments.map((c) => {
      const profile = profileById.get(c.user_id);
      return {
        id: c.id,
        fieldId: c.field_id,
        userId: c.user_id,
        email: profile?.email ?? "(no profile found)",
        displayName: profile?.display_name ?? null,
        body: c.body,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      };
    });
  }

  async createFieldComment(comment: {
    fieldId: string;
    userId: string;
    body: string;
  }): Promise<FieldComment> {
    const { data, error } = await this.client
      .from("field_comments")
      .insert({ field_id: comment.fieldId, user_id: comment.userId, body: comment.body })
      .select("id, field_id, user_id, body, created_at, updated_at")
      .single();
    if (error || !data) {
      throw new Error(`Failed to create comment on field ${comment.fieldId}: ${error?.message}`);
    }

    const { data: profile } = await this.client
      .from("profiles")
      .select("email, display_name")
      .eq("user_id", comment.userId)
      .maybeSingle();

    return {
      id: data.id,
      fieldId: data.field_id,
      userId: data.user_id,
      email: profile?.email ?? "(no profile found)",
      displayName: profile?.display_name ?? null,
      body: data.body,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async updateFieldComment(
    commentId: string,
    requestingUserId: string,
    body: string,
  ): Promise<FieldComment> {
    const { data, error } = await this.client
      .from("field_comments")
      .update({ body, updated_at: new Date().toISOString() })
      .eq("id", commentId)
      .eq("user_id", requestingUserId)
      .select("id, field_id, user_id, body, created_at, updated_at")
      .single();
    if (error || !data) {
      throw new Error(
        `Failed to update comment ${commentId}: not found, or requester is not the author.`,
      );
    }

    const { data: profile } = await this.client
      .from("profiles")
      .select("email, display_name")
      .eq("user_id", data.user_id)
      .maybeSingle();

    return {
      id: data.id,
      fieldId: data.field_id,
      userId: data.user_id,
      email: profile?.email ?? "(no profile found)",
      displayName: profile?.display_name ?? null,
      body: data.body,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async deleteFieldComment(commentId: string, requestingUserId: string): Promise<void> {
    const { data, error } = await this.client
      .from("field_comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", requestingUserId)
      .select("id")
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to delete comment ${commentId}: ${error.message}`);
    }
    if (!data) {
      throw new Error(`Failed to delete comment ${commentId}: not found, or requester is not the author.`);
    }
  }
}
