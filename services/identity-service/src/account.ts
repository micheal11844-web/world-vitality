import type { SupabaseClient } from "@supabase/supabase-js";
import type { Role } from "./roles.js";
import type { HomePlace } from "./personas.js";
import { SupabaseOrganizationData } from "./organization-data.js";
import {
  OrganizationHasMembersError,
  type JoinOrganizationResult,
  type OrganizationData,
  type OrganizationMembership,
  type OrganizationRole,
} from "./organizations.js";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  isNotificationMessageKey,
  isNotificationTier,
  isOfficialMinTier,
  type NewNotification,
  type Notification,
  type NotificationMessageParams,
  type NotificationSettings,
  type NotificationSource,
  type OfficialMinTier,
} from "./notifications.js";

export interface Profile {
  userId: string;
  email: string;
  displayName: string | null;
  createdAt: string;
}

/**
 * Per-user application preferences (`user_preferences`, migration
 * 0013). Today: the answers from Adaptive Onboarding (PRD B.1). A user
 * with no row yet is represented as all-null — "never onboarded" is
 * `onboardedAt === null`, which is distinct from "onboarded but chose
 * not to say" (`onboardedAt` set, `persona`/`homePlace` null).
 */
export interface UserPreferences {
  userId: string;
  /** A `PERSONAS` id, or `null` (never chosen, or skipped). */
  persona: string | null;
  homePlace: HomePlace | null;
  /** Set when onboarding was finished OR skipped. */
  onboardedAt: string | null;
  /**
   * The language the person chose (a supported language code), or `null`
   * (never chosen). Stored as a string here — which codes are valid is
   * the app's i18n catalog, validated at the edge, not this service.
   */
  language: string | null;
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
  /**
   * The organisation this role belongs to (`workspace_members.
   * organization_id`, migration 0018). Rows read from the database carry it;
   * `resolveWorkspaceMembership` always sets it for someone who has an
   * organisation and leaves it unset for someone who has none — in which
   * case `OrganizationData` is the empty, fail-closed handle.
   */
  organizationId?: string;
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
 * not `workspace_members` itself — `SupabaseOrganizationData.
 * listWorkspaceMembers` merges them in application code (two queries)
 * because there is no foreign key between `workspace_members` and
 * `profiles` for PostgREST to infer an embedded join from.
 */
export interface WorkspaceMemberSummary {
  userId: string;
  email: string;
  displayName: string | null;
  role: Role;
  scopedResourceIds?: string[];
  /**
   * True for the organisation's owner, who is `admin_owner` in every
   * workspace without a role row, and who cannot be removed or demoted.
   */
  isOrganizationOwner?: boolean;
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
 * A real, workspace-scoped resource for Government & NGOs (BUILD_PLAN
 * "STAGE — GOVERNMENT & NGOS FOLLOW-UP: MONITORED LOCATIONS"), the
 * third real resource type after `Field` and `InsuranceProperty`,
 * closing the same "genuinely incomplete" resource-scoping gap for
 * Field Staff ("scoped regional access," PRD A.10). Named "location,"
 * not "jurisdiction" or "region" — see
 * `0012_government_ngos_locations.sql`'s doc comment for why (no GIS
 * boundary data exists in this app; a single point isn't honestly a
 * jurisdiction).
 */
export interface GovernmentNgosLocation {
  id: string;
  workspaceId: string;
  label: string;
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
   * The user's preferences. Never throws for "no row" — returns the
   * all-null default, so a brand-new user simply reads as "not
   * onboarded". Throws on a real database error (the caller decides
   * whether to fail open; the Dashboard does, so a preferences outage
   * can never lock someone out of the app).
   */
  getPreferences(userId: string): Promise<UserPreferences>;

  /**
   * Upserts onboarding answers and stamps `onboardedAt` (finishing or
   * skipping both count). Passing `persona`/`homePlace` as `null`
   * clears them — "skip" and "redo without a place" are both just
   * saves. Callers must validate `homePlace` with `parseHomePlace`
   * first; the table's CHECK constraints are a backstop, not the
   * validation.
   */
  saveOnboarding(
    userId: string,
    answers: { persona: string | null; homePlace: HomePlace | null },
    now?: Date,
  ): Promise<UserPreferences>;

  /**
   * Saves the chosen language (`null` clears it). Touches only that
   * column: if the user has never onboarded, the row it creates still
   * reads as "not onboarded" (`onboardedAt` stays null), and an existing
   * persona/home place is left alone. Callers must validate the code
   * against the supported list first.
   */
  saveLanguage(userId: string, language: string | null, now?: Date): Promise<void>;

  /**
   * The user's inbox (Notification Center, PRD B.6), newest first. By
   * default only what is currently relevant: not dismissed and not
   * past its own expiry. `includeInactive` returns every row (used by
   * the data export, so a person gets everything held about them).
   * `limit` defaults to 100.
   */
  listNotifications(
    userId: string,
    options?: { includeInactive?: boolean; limit?: number; now?: Date },
  ): Promise<Notification[]>;

  /**
   * Adds notifications for a user. Idempotent per `dedupeKey`: a row
   * that already exists for that key is left exactly as it is, so
   * re-checking the same active alert never duplicates it or resets its
   * read state. Items without a key always insert.
   */
  createNotifications(userId: string, items: NewNotification[], now?: Date): Promise<void>;

  /**
   * Ends every still-active official alert for this user whose key is
   * *not* in `activeDedupeKeys` (the agency no longer lists it — it was
   * cancelled, or the user changed their home place). An empty list ends
   * them all. Only call this after a *successful* fetch: a failed check
   * must never make a live alert disappear.
   */
  expireOfficialNotificationsExcept(
    userId: string,
    activeDedupeKeys: string[],
    now?: Date,
  ): Promise<void>;

  /** Marks one notification read. Scoped to the owner in the query itself. */
  markNotificationRead(userId: string, id: string, now?: Date): Promise<void>;

  /** Marks every unread notification read. */
  markAllNotificationsRead(userId: string, now?: Date): Promise<void>;

  /** Hides one notification from the inbox. Scoped to the owner in the query itself. */
  dismissNotification(userId: string, id: string, now?: Date): Promise<void>;

  /** Settings, or the defaults when the user has never saved any. */
  getNotificationSettings(userId: string): Promise<NotificationSettings>;

  /** Saves the two user-controlled settings (never touches the sync timestamp). */
  saveNotificationSettings(
    userId: string,
    settings: { officialMinTier: OfficialMinTier; collaborationEnabled: boolean },
    now?: Date,
  ): Promise<NotificationSettings>;

  /** Records that official alerts were just checked (the re-check throttle). */
  markAlertsSynced(userId: string, now?: Date): Promise<void>;

  /** Deletes notifications created before `olderThan`. */
  pruneNotifications(userId: string, olderThan: Date): Promise<void>;

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
   * this behind manual review as their default path. One exception, which
   * is the person's own to resolve in a minute rather than a review:
   * the owner of an organisation that still has other members gets an
   * `OrganizationHasMembersError`, because deleting the owner deletes the
   * organisation and everything those members saved in it.
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
   * The organisation this person belongs to, or `null` if they have none
   * yet (a brand-new account that has not been used). See `organizations.ts`.
   */
  getOrganizationMembership(userId: string): Promise<OrganizationMembership | null>;

  /**
   * The person's organisation, creating their own personal one on first use.
   * Safe to call concurrently and repeatedly: the database does it in one
   * statement and returns the existing one if there is one.
   */
  ensureOrganization(userId: string): Promise<OrganizationMembership>;

  /** An organisation by id (its owner decides its plan), or `null`. */
  getOrganization(
    organizationId: string,
  ): Promise<{ id: string; name: string; ownerId: string } | null>;

  /**
   * Puts a person into an existing organisation — an invitation being
   * accepted. `maxSeats` is the organisation's seat limit (`null`/omitted
   * = none). The whole decision is made in one database statement, so two
   * people taking the last seat cannot both succeed; see
   * `join_organization` in migration 0018 for the exact answers.
   */
  joinOrganization(
    userId: string,
    organizationId: string,
    options?: { maxSeats?: number | null },
  ): Promise<JoinOrganizationResult>;

  /**
   * Everything one organisation owns — saved items, comments, and its
   * people — confined to that organisation. This is the ONLY way to reach
   * saved items: there is deliberately no unscoped list/create/update/delete
   * on this service.
   */
  forOrganization(organizationId: string): OrganizationData;
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
      .select("workspace_id, role, scoped_resource_ids, organization_id")
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
      organizationId: row.organization_id ?? undefined,
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
    // An organisation's owner cannot take other people's saved work with
    // them: deleting the owner deletes the organisation. Refuse until the
    // others have been removed (the Team page does that).
    const organization = await this.getOrganizationMembership(userId);
    if (organization?.role === "owner") {
      const members = await this.forOrganization(organization.organizationId).countMembers();
      if (members > 1) {
        throw new OrganizationHasMembersError(members - 1);
      }
    }

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

  async getOrganizationMembership(userId: string): Promise<OrganizationMembership | null> {
    const { data: member, error } = await this.client
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to load organisation membership for ${userId}: ${error.message}`);
    }
    if (!member) return null;
    const organization = await this.getOrganization(member.organization_id);
    if (!organization) {
      throw new Error(`Organisation ${member.organization_id} (for ${userId}) was not found`);
    }
    return {
      organizationId: organization.id,
      name: organization.name,
      ownerId: organization.ownerId,
      role: member.role as OrganizationRole,
    };
  }

  async getOrganization(
    organizationId: string,
  ): Promise<{ id: string; name: string; ownerId: string } | null> {
    const { data, error } = await this.client
      .from("organizations")
      .select("id, name, owner_id")
      .eq("id", organizationId)
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to load organisation ${organizationId}: ${error.message}`);
    }
    return data ? { id: data.id, name: data.name, ownerId: data.owner_id } : null;
  }

  async ensureOrganization(userId: string): Promise<OrganizationMembership> {
    const existing = await this.getOrganizationMembership(userId);
    if (existing) return existing;
    const { error } = await this.client.rpc("ensure_personal_organization", {
      p_user_id: userId,
    });
    if (error) {
      throw new Error(`Failed to create an organisation for ${userId}: ${error.message}`);
    }
    const created = await this.getOrganizationMembership(userId);
    if (!created) {
      throw new Error(`Organisation for ${userId} was not found right after creating it`);
    }
    return created;
  }

  async joinOrganization(
    userId: string,
    organizationId: string,
    options: { maxSeats?: number | null } = {},
  ): Promise<JoinOrganizationResult> {
    const { data, error } = await this.client.rpc("join_organization", {
      p_user_id: userId,
      p_organization_id: organizationId,
      p_max_seats: options.maxSeats ?? null,
    });
    if (error) {
      throw new Error(`Failed to join organisation ${organizationId}: ${error.message}`);
    }
    if (!isJoinResult(data)) {
      throw new Error(`Unexpected answer joining organisation ${organizationId}`);
    }
    return data;
  }

  forOrganization(organizationId: string): OrganizationData {
    return new SupabaseOrganizationData(this.client, organizationId);
  }

  async getPreferences(userId: string): Promise<UserPreferences> {
    const { data, error } = await this.client
      .from("user_preferences")
      .select(
        "persona, home_name, home_region, home_country, home_latitude, home_longitude, onboarded_at, language",
      )
      .eq("user_id", userId)
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to load preferences for ${userId}: ${error.message}`);
    }
    return rowToPreferences(userId, data);
  }

  async saveOnboarding(
    userId: string,
    answers: { persona: string | null; homePlace: HomePlace | null },
    now: Date = new Date(),
  ): Promise<UserPreferences> {
    const place = answers.homePlace;
    const { data, error } = await this.client
      .from("user_preferences")
      .upsert(
        {
          user_id: userId,
          persona: answers.persona,
          home_name: place?.name ?? null,
          home_region: place?.region ?? null,
          home_country: place?.country ?? null,
          home_latitude: place?.latitude ?? null,
          home_longitude: place?.longitude ?? null,
          onboarded_at: now.toISOString(),
          updated_at: now.toISOString(),
        },
        { onConflict: "user_id" },
      )
      .select(
        "persona, home_name, home_region, home_country, home_latitude, home_longitude, onboarded_at, language",
      )
      .single();
    if (error || !data) {
      throw new Error(`Failed to save preferences for ${userId}: ${error?.message ?? "no row"}`);
    }
    return rowToPreferences(userId, data);
  }

  async saveLanguage(
    userId: string,
    language: string | null,
    now: Date = new Date(),
  ): Promise<void> {
    const { error } = await this.client
      .from("user_preferences")
      .upsert(
        { user_id: userId, language, updated_at: now.toISOString() },
        { onConflict: "user_id" },
      );
    if (error) {
      throw new Error(`Failed to save language for ${userId}: ${error.message}`);
    }
  }

  async listNotifications(
    userId: string,
    options: { includeInactive?: boolean; limit?: number; now?: Date } = {},
  ): Promise<Notification[]> {
    const now = options.now ?? new Date();
    let query = this.client
      .from("notifications")
      .select(NOTIFICATION_COLUMNS)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(options.limit ?? 100);
    if (!options.includeInactive) {
      query = query
        .is("dismissed_at", null)
        .or(`expires_at.is.null,expires_at.gt.${now.toISOString()}`);
    }
    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to list notifications for ${userId}: ${error.message}`);
    }
    return ((data ?? []) as NotificationRow[]).map(rowToNotification);
  }

  async createNotifications(
    userId: string,
    items: NewNotification[],
    now: Date = new Date(),
  ): Promise<void> {
    if (items.length === 0) return;
    // Every row carries every column: a bulk insert with differing keys
    // would send NULL for the missing ones and trip NOT NULL on created_at.
    const rows = items.map((item) => ({
      user_id: userId,
      source: item.source,
      tier: item.tier,
      title: item.title,
      body: item.body ?? null,
      detail: item.detail ?? null,
      href: item.href ?? null,
      dedupe_key: item.dedupeKey ?? null,
      expires_at: item.expiresAt ?? null,
      created_at: item.createdAt ?? now.toISOString(),
      message_key: item.messageKey ?? null,
      message_params: item.messageParams ?? null,
    }));
    const { error } = await this.client
      .from("notifications")
      .upsert(rows, { onConflict: "user_id,dedupe_key", ignoreDuplicates: true });
    if (error) {
      throw new Error(`Failed to create notifications for ${userId}: ${error.message}`);
    }
  }

  async expireOfficialNotificationsExcept(
    userId: string,
    activeDedupeKeys: string[],
    now: Date = new Date(),
  ): Promise<void> {
    let query = this.client
      .from("notifications")
      .update({ expires_at: now.toISOString() })
      .eq("user_id", userId)
      .eq("source", "official_alert")
      .or(`expires_at.is.null,expires_at.gt.${now.toISOString()}`);
    if (activeDedupeKeys.length > 0) {
      query = query.not("dedupe_key", "in", `(${activeDedupeKeys.map(quoteForInList).join(",")})`);
    }
    const { error } = await query;
    if (error) {
      throw new Error(`Failed to end stale alerts for ${userId}: ${error.message}`);
    }
  }

  async markNotificationRead(userId: string, id: string, now: Date = new Date()): Promise<void> {
    const { error } = await this.client
      .from("notifications")
      .update({ read_at: now.toISOString() })
      .eq("id", id)
      .eq("user_id", userId)
      .is("read_at", null);
    if (error) {
      throw new Error(`Failed to mark notification read for ${userId}: ${error.message}`);
    }
  }

  async markAllNotificationsRead(userId: string, now: Date = new Date()): Promise<void> {
    const { error } = await this.client
      .from("notifications")
      .update({ read_at: now.toISOString() })
      .eq("user_id", userId)
      .is("read_at", null);
    if (error) {
      throw new Error(`Failed to mark notifications read for ${userId}: ${error.message}`);
    }
  }

  async dismissNotification(userId: string, id: string, now: Date = new Date()): Promise<void> {
    const { error } = await this.client
      .from("notifications")
      .update({ dismissed_at: now.toISOString() })
      .eq("id", id)
      .eq("user_id", userId);
    if (error) {
      throw new Error(`Failed to dismiss notification for ${userId}: ${error.message}`);
    }
  }

  async getNotificationSettings(userId: string): Promise<NotificationSettings> {
    const { data, error } = await this.client
      .from("notification_settings")
      .select("official_min_tier, collaboration_enabled, alerts_synced_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to load notification settings for ${userId}: ${error.message}`);
    }
    return rowToNotificationSettings(data);
  }

  async saveNotificationSettings(
    userId: string,
    settings: { officialMinTier: OfficialMinTier; collaborationEnabled: boolean },
    now: Date = new Date(),
  ): Promise<NotificationSettings> {
    const { data, error } = await this.client
      .from("notification_settings")
      .upsert(
        {
          user_id: userId,
          official_min_tier: settings.officialMinTier,
          collaboration_enabled: settings.collaborationEnabled,
          updated_at: now.toISOString(),
        },
        { onConflict: "user_id" },
      )
      .select("official_min_tier, collaboration_enabled, alerts_synced_at")
      .single();
    if (error || !data) {
      throw new Error(
        `Failed to save notification settings for ${userId}: ${error?.message ?? "no row"}`,
      );
    }
    return rowToNotificationSettings(data);
  }

  async markAlertsSynced(userId: string, now: Date = new Date()): Promise<void> {
    const { error } = await this.client
      .from("notification_settings")
      .upsert(
        { user_id: userId, alerts_synced_at: now.toISOString(), updated_at: now.toISOString() },
        { onConflict: "user_id" },
      );
    if (error) {
      throw new Error(`Failed to record alert check for ${userId}: ${error.message}`);
    }
  }

  async pruneNotifications(userId: string, olderThan: Date): Promise<void> {
    const { error } = await this.client
      .from("notifications")
      .delete()
      .eq("user_id", userId)
      .lt("created_at", olderThan.toISOString());
    if (error) {
      throw new Error(`Failed to prune notifications for ${userId}: ${error.message}`);
    }
  }
}

interface PreferencesRow {
  persona: string | null;
  home_name: string | null;
  home_region: string | null;
  home_country: string | null;
  home_latitude: number | null;
  home_longitude: number | null;
  onboarded_at: string | null;
  language?: string | null;
}

function rowToPreferences(userId: string, row: PreferencesRow | null): UserPreferences {
  if (!row) return { userId, persona: null, homePlace: null, onboardedAt: null, language: null };
  const hasPlace =
    row.home_name !== null && row.home_latitude !== null && row.home_longitude !== null;
  return {
    userId,
    persona: row.persona,
    homePlace: hasPlace
      ? {
          name: row.home_name as string,
          region: row.home_region,
          country: row.home_country,
          latitude: row.home_latitude as number,
          longitude: row.home_longitude as number,
        }
      : null,
    onboardedAt: row.onboarded_at,
    language: row.language ?? null,
  };
}

const NOTIFICATION_COLUMNS =
  "id, source, tier, title, body, detail, href, created_at, expires_at, read_at, dismissed_at, message_key, message_params";

interface NotificationRow {
  id: string;
  source: string;
  tier: string;
  title: string;
  body: string | null;
  detail: string | null;
  href: string | null;
  created_at: string;
  expires_at: string | null;
  read_at: string | null;
  dismissed_at: string | null;
  message_key?: string | null;
  message_params?: unknown;
}

function rowToNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    source: row.source as NotificationSource,
    // The table's CHECK constraint guarantees a valid tier; the fallback
    // only guards against a future drift, never hides an unknown value as critical.
    tier: isNotificationTier(row.tier) ? row.tier : "info",
    title: row.title,
    body: row.body,
    detail: row.detail,
    href: row.href,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    readAt: row.read_at,
    dismissedAt: row.dismissed_at,
    messageKey: isNotificationMessageKey(row.message_key) ? row.message_key : null,
    messageParams: toMessageParams(row.message_params),
  };
}

/** Keeps only string values — a stored object is data, never trusted to be well-shaped. */
function toMessageParams(value: unknown): NotificationMessageParams | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const out: NotificationMessageParams = {};
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v === "string") out[key] = v;
  }
  return out;
}

function rowToNotificationSettings(
  row: {
    official_min_tier: string;
    collaboration_enabled: boolean;
    alerts_synced_at: string | null;
  } | null,
): NotificationSettings {
  if (!row) return { ...DEFAULT_NOTIFICATION_SETTINGS };
  return {
    officialMinTier: isOfficialMinTier(row.official_min_tier) ? row.official_min_tier : "info",
    collaborationEnabled: row.collaboration_enabled,
    alertsSyncedAt: row.alerts_synced_at,
  };
}

/** Double-quotes a value for a PostgREST `in.(...)` list, escaping quotes and backslashes. */
function quoteForInList(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

const JOIN_RESULTS: ReadonlySet<string> = new Set<JoinOrganizationResult>([
  "joined",
  "already",
  "seat_limit",
  "in_other_organization",
  "not_found",
]);

function isJoinResult(value: unknown): value is JoinOrganizationResult {
  return typeof value === "string" && JOIN_RESULTS.has(value);
}
