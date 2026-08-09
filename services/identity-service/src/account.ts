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
}
