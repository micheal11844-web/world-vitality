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
   * parameter (see roles.ts). `undefined` (the only value any real
   * membership has today) means workspace-wide access — no product
   * surface yet writes a non-empty value here. See roles.ts's module
   * doc comment for why this exists ahead of anything that populates
   * it: the interface is ready before the resource type it will
   * eventually constrain, per ADR-0003's ordering principle.
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
}
