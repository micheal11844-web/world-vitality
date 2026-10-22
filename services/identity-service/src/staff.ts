import type { SupabaseClient } from "@supabase/supabase-js";
import type { Role } from "./roles.js";

/**
 * Staff access for the internal admin console (BUILD_PLAN "v87").
 *
 * This is deliberately a separate model from `roles.ts`. Those roles are
 * a *customer's* role inside one workspace; these describe a member of the
 * World Vitality team and apply across the whole platform. Nothing here
 * lets a workspace owner become staff or the reverse.
 *
 * Staff are granted and revoked with SQL only (docs/runbooks/admin-console.md)
 * — no function in this file creates or changes a staff row, on purpose.
 */

export type StaffRole = "support" | "operations" | "platform_admin";

export const STAFF_ROLES: readonly StaffRole[] = ["support", "operations", "platform_admin"];

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  support: "Support",
  operations: "Operations",
  platform_admin: "Platform admin",
};

export type StaffPermission = "overview:view" | "users:lookup" | "sources:view" | "audit:view";

/**
 * What each staff role may open. Anything not listed is denied.
 *
 * - Support looks up a user to help them; they do not see data-source
 *   internals or the staff audit log.
 * - Operations watches the data sources; they cannot look anyone up.
 * - Platform admin has all of it, including the record of what staff did.
 *
 * This is this implementation's own reasonable split, not a transcription
 * of a spec (the PRD names an admin console but no staff roles) — review
 * it against how the team actually works before relying on it.
 */
export const STAFF_PERMISSIONS: Record<StaffRole, readonly StaffPermission[]> = {
  support: ["overview:view", "users:lookup"],
  operations: ["overview:view", "sources:view"],
  platform_admin: ["overview:view", "users:lookup", "sources:view", "audit:view"],
};

export function isStaffRole(value: unknown): value is StaffRole {
  return typeof value === "string" && (STAFF_ROLES as readonly string[]).includes(value);
}

/** Deny-by-default: a missing or unknown role can do nothing. */
export function staffCan(role: StaffRole | null | undefined, permission: StaffPermission): boolean {
  if (!isStaffRole(role)) return false;
  return STAFF_PERMISSIONS[role].includes(permission);
}

export function staffPermissionsFor(role: StaffRole | null | undefined): StaffPermission[] {
  return isStaffRole(role) ? [...STAFF_PERMISSIONS[role]] : [];
}

/** The things staff do that are written to `staff_audit_log`. */
export type StaffAction = "user.lookup" | "sources.check" | "audit.view";

/** The signed-in person doing the action. The email is a snapshot kept in the log. */
export interface StaffActor {
  userId: string;
  email: string;
}

export interface StaffMember {
  userId: string;
  role: StaffRole;
  grantedAt: string;
}

export interface StaffAuditEntry {
  id: string;
  staffUserId: string;
  staffEmail: string;
  action: string;
  targetUserId: string | null;
  detail: string | null;
  createdAt: string;
}

/**
 * What Support sees about one account. Kept to what is needed to help
 * someone sign in or find their way around: no home place, no persona, no
 * notification text, no workspace content. Anything added here widens what
 * every support person can read, so add to it deliberately.
 */
export interface SupportUserView {
  userId: string;
  email: string | null;
  displayName: string | null;
  createdAt: string | null;
  emailConfirmed: boolean | null;
  lastSignInAt: string | null;
  onboarded: boolean;
  language: string | null;
  memberships: { workspaceId: string; role: Role; scoped: boolean }[];
}

export type SupportLookupResult =
  | { kind: "invalid"; message: string }
  | { kind: "not_found" }
  | { kind: "found"; user: SupportUserView };

export interface PlatformOverview {
  accounts: number;
  newLast7Days: number;
  newLast30Days: number;
  onboarded: number;
  workspaceMemberships: number;
  activeStaff: number;
  asOf: string;
}

export type SupportQuery =
  | { kind: "email"; email: string }
  | { kind: "userId"; userId: string }
  | { kind: "invalid"; message: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_EMAIL_LENGTH = 254;

/**
 * Turns what was typed into a lookup. Exact matches only — an email
 * address or a user id, nothing partial — so the lookup cannot be used
 * to browse or enumerate the user base.
 */
export function parseSupportQuery(raw: string): SupportQuery {
  const text = raw.trim();
  if (!text) return { kind: "invalid", message: "Enter an email address or a user id." };
  if (UUID.test(text)) return { kind: "userId", userId: text.toLowerCase() };
  if (
    text.length <= MAX_EMAIL_LENGTH &&
    /^[^\s@%*,()\\]+@[^\s@%*,()\\]+\.[^\s@%*,()\\]+$/.test(text)
  ) {
    return { kind: "email", email: text };
  }
  return {
    kind: "invalid",
    message: "That is not a full email address or a user id. Partial matches are not supported.",
  };
}

/**
 * Escapes `%`, `_` and `\` so a value passed to `ilike` can only ever
 * match itself. (`parseSupportQuery` already refuses `%` and `\`, and an
 * email may legitimately contain `_`, so this is what makes `_` safe.)
 */
export function escapeLikeExact(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/** Safe cap on how many audit rows one request can pull. */
export const STAFF_AUDIT_MAX_PAGE = 200;
export const STAFF_AUDIT_DEFAULT_PAGE = 50;

export interface StaffService {
  /** The active (not revoked) staff row for this user, or `null`. */
  getStaffMember(userId: string): Promise<StaffMember | null>;
  getPlatformOverview(now?: Date): Promise<PlatformOverview>;
  /**
   * Look an account up for support. The lookup is written to the staff
   * audit log *before* anything about the person is read: if the log
   * cannot be written, this throws and nothing is returned.
   */
  lookupUserForSupport(actor: StaffActor, rawQuery: string): Promise<SupportLookupResult>;
  recordStaffAction(entry: {
    actor: StaffActor;
    action: StaffAction;
    targetUserId?: string | null;
    detail?: string;
  }): Promise<void>;
  listStaffAuditLog(options?: {
    limit?: number;
    /** Only entries strictly older than this ISO time (for "older" paging). */
    before?: string;
  }): Promise<StaffAuditEntry[]>;
}

export class SupabaseStaffService implements StaffService {
  constructor(private readonly client: SupabaseClient) {}

  async getStaffMember(userId: string): Promise<StaffMember | null> {
    const { data, error } = await this.client
      .from("platform_staff")
      .select("user_id, role, granted_at")
      .eq("user_id", userId)
      .is("revoked_at", null)
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to check staff access for ${userId}: ${error.message}`);
    }
    // A row whose role is not one we know grants nothing.
    if (!data || !isStaffRole(data.role)) return null;
    return { userId: data.user_id, role: data.role, grantedAt: data.granted_at };
  }

  async getPlatformOverview(now: Date = new Date()): Promise<PlatformOverview> {
    const since = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString();
    const count = async (
      label: string,
      query: PromiseLike<{ count: number | null; error: { message: string } | null }>,
    ): Promise<number> => {
      const { count: n, error } = await query;
      if (error) throw new Error(`Failed to count ${label}: ${error.message}`);
      return n ?? 0;
    };
    const head = { count: "exact", head: true } as const;
    const [accounts, newLast7Days, newLast30Days, onboarded, workspaceMemberships, activeStaff] =
      await Promise.all([
        count("accounts", this.client.from("profiles").select("user_id", head)),
        count(
          "new accounts (7 days)",
          this.client.from("profiles").select("user_id", head).gte("created_at", since(7)),
        ),
        count(
          "new accounts (30 days)",
          this.client.from("profiles").select("user_id", head).gte("created_at", since(30)),
        ),
        count(
          "onboarded accounts",
          this.client
            .from("user_preferences")
            .select("user_id", head)
            .not("onboarded_at", "is", null),
        ),
        count(
          "workspace memberships",
          this.client.from("workspace_members").select("user_id", head),
        ),
        count(
          "active staff",
          this.client.from("platform_staff").select("user_id", head).is("revoked_at", null),
        ),
      ]);
    return {
      accounts,
      newLast7Days,
      newLast30Days,
      onboarded,
      workspaceMemberships,
      activeStaff,
      asOf: now.toISOString(),
    };
  }

  async lookupUserForSupport(actor: StaffActor, rawQuery: string): Promise<SupportLookupResult> {
    const query = parseSupportQuery(rawQuery);
    if (query.kind === "invalid") {
      // Nothing was looked at, so there is nothing to log.
      return { kind: "invalid", message: query.message };
    }

    // Step 1 — resolve to an id only. This is the one read that happens
    // before the audit entry exists, and it returns nothing but an id.
    const base = this.client.from("profiles").select("user_id");
    const exact =
      query.kind === "userId"
        ? base.eq("user_id", query.userId)
        : base.ilike("email", escapeLikeExact(query.email));
    const { data: match, error: matchError } = await exact.limit(1).maybeSingle();
    if (matchError) {
      throw new Error(`Failed to look up an account: ${matchError.message}`);
    }
    const targetUserId: string | null = match?.user_id ?? null;

    // Step 2 — write the audit entry. If this fails the lookup fails,
    // and nothing about the person is read.
    await this.recordStaffAction({
      actor,
      action: "user.lookup",
      targetUserId,
      detail: targetUserId
        ? query.kind === "email"
          ? "Looked up by email address"
          : "Looked up by user id"
        : "No account matched",
    });
    if (!targetUserId) return { kind: "not_found" };

    // Step 3 — now read the minimal support view.
    const [profileRes, authRes, membershipsRes, prefsRes] = await Promise.all([
      this.client
        .from("profiles")
        .select("email, display_name, created_at")
        .eq("user_id", targetUserId)
        .maybeSingle(),
      this.client.auth.admin.getUserById(targetUserId),
      this.client
        .from("workspace_members")
        .select("workspace_id, role, scoped_resource_ids")
        .eq("user_id", targetUserId),
      this.client
        .from("user_preferences")
        .select("onboarded_at, language")
        .eq("user_id", targetUserId)
        .maybeSingle(),
    ]);
    if (profileRes.error) {
      throw new Error(`Failed to load the account: ${profileRes.error.message}`);
    }
    if (membershipsRes.error) {
      throw new Error(`Failed to load workspace memberships: ${membershipsRes.error.message}`);
    }
    if (prefsRes.error) {
      throw new Error(`Failed to load account preferences: ${prefsRes.error.message}`);
    }
    // The sign-in details come from the auth system; if it can't be reached
    // they are shown as unknown rather than failing the whole lookup.
    const authUser = authRes.error ? null : (authRes.data?.user ?? null);

    return {
      kind: "found",
      user: {
        userId: targetUserId,
        email: profileRes.data?.email ?? null,
        displayName: profileRes.data?.display_name ?? null,
        createdAt: profileRes.data?.created_at ?? null,
        emailConfirmed: authUser ? Boolean(authUser.email_confirmed_at) : null,
        lastSignInAt: authUser?.last_sign_in_at ?? null,
        onboarded: Boolean(prefsRes.data?.onboarded_at),
        language: prefsRes.data?.language ?? null,
        memberships: (membershipsRes.data ?? []).map((row) => ({
          workspaceId: row.workspace_id,
          role: row.role as Role,
          scoped: Boolean(row.scoped_resource_ids?.length),
        })),
      },
    };
  }

  async recordStaffAction(entry: {
    actor: StaffActor;
    action: StaffAction;
    targetUserId?: string | null;
    detail?: string;
  }): Promise<void> {
    const { error } = await this.client.from("staff_audit_log").insert({
      staff_user_id: entry.actor.userId,
      staff_email: entry.actor.email,
      action: entry.action,
      target_user_id: entry.targetUserId ?? null,
      detail: entry.detail ?? null,
    });
    if (error) {
      throw new Error(
        `Failed to record staff action ${entry.action} for ${entry.actor.userId}: ${error.message}`,
      );
    }
  }

  async listStaffAuditLog(
    options: { limit?: number; before?: string } = {},
  ): Promise<StaffAuditEntry[]> {
    const limit = Math.min(
      Math.max(
        Math.trunc(options.limit ?? STAFF_AUDIT_DEFAULT_PAGE) || STAFF_AUDIT_DEFAULT_PAGE,
        1,
      ),
      STAFF_AUDIT_MAX_PAGE,
    );
    const base = this.client
      .from("staff_audit_log")
      .select("id, staff_user_id, staff_email, action, target_user_id, detail, created_at");
    const filtered = options.before ? base.lt("created_at", options.before) : base;
    const { data, error } = await filtered.order("created_at", { ascending: false }).limit(limit);
    if (error) {
      throw new Error(`Failed to load the staff audit log: ${error.message}`);
    }
    return (data ?? []).map((row) => ({
      id: row.id,
      staffUserId: row.staff_user_id,
      staffEmail: row.staff_email,
      action: row.action,
      targetUserId: row.target_user_id ?? null,
      detail: row.detail ?? null,
      createdAt: row.created_at,
    }));
  }
}
