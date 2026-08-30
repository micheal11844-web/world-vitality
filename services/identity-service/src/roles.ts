/**
 * The platform's core permission-role model — reused across every
 * workspace type rather than inventing new permission paradigms per
 * workspace (PRD Section C, item 2).
 *
 * **Documentation gap, flagged rather than silently resolved:** the PRD
 * names these four roles in exactly one place (Section C, item 2 — a
 * single passing mention, not the "Section C.2" BUILD_PLAN ticket 3.2
 * cites; C.2 is actually the Third-Party Workspace Marketplace section).
 * No detailed permission matrix for these roles exists anywhere in the
 * Constitution, PRD, or Engineering Blueprint. The `ROLE_PERMISSIONS`
 * matrix below is this implementation's own reasonable interpretation of
 * what each role name implies, not a transcription of a spec — review it
 * against actual product intent before relying on it for anything
 * beyond scaffolding, and reconcile the BUILD_PLAN section reference
 * when the PRD is next revised.
 *
 * **Resource-level scoping mechanism (added post-Stage-7):** `can()`
 * below follows the standard "actor → action → resource" pattern for
 * layering resource-level access on top of RBAC (rather than a role per
 * resource, which explodes combinatorially) — an authenticated user in
 * a workspace, taking an action, against an optional specific resource.
 * This closes the *mechanism* gap `scoped_field_user` previously had no
 * answer for. **The *product* gap is now closed too, for Agriculture
 * specifically**: `fields` (BUILD_PLAN "STAGE — AGRICULTURE FIELDS")
 * is a real sub-workspace resource type, `agriculture/page.tsx` is the
 * first page in this app to call `can()` with a real `resourceId`, and
 * the Team page's invite-time field picker is the first way a real
 * membership's `scopedResourceIds` gets populated with anything
 * meaningful. Every other workspace still has no comparable resource
 * type — Engineering Blueprint 4.5's "promote once a genuine second
 * consumer exists" still applies to any future one.
 */
export type Role = "admin_owner" | "operational_user" | "scoped_field_user" | "viewer_external";

/**
 * Discrete capabilities within a workspace. Grouped loosely around the
 * workspace sections named in Experience Blueprint Section 8 (Dashboard,
 * Map, Reports, Alerts, Team, Settings).
 */
export type Permission =
  | "workspace:manage_settings"
  | "workspace:manage_team"
  | "workspace:delete"
  | "billing:manage"
  | "data:view"
  | "data:edit"
  | "reports:view"
  | "reports:create"
  | "alerts:view"
  | "alerts:manage"
  | "export:data"
  | "comments:create";

/**
 * Which permissions each role holds, workspace-scoped (a user's role can
 * differ per workspace — see `WorkspaceMembership` in `account.ts`).
 *
 * - `admin_owner` — full control, including irreversible/high-consequence
 *   actions (delete workspace, manage billing, manage team membership).
 * - `operational_user` — day-to-day platform use: views and edits data,
 *   creates reports, manages alerts. Cannot change who's on the team,
 *   billing, or workspace-level settings.
 * - `scoped_field_user` — narrower than `operational_user`: no report
 *   creation, alert management, or data export — plus resource-level
 *   scoping: when a membership carries `scopedResourceIds` (see
 *   `WorkspaceMembership` in `account.ts`), this role's access narrows
 *   to just those resource IDs rather than the whole workspace — real
 *   and exercised since BUILD_PLAN "STAGE — AGRICULTURE FIELDS"
 *   (Agriculture's `fields` table, plus the Team page's invite-time
 *   field picker). Every other workspace still has no resource type to
 *   scope to, so this role continues to behave workspace-wide there —
 *   the correct, honest default for "no scope constraint configured,"
 *   not a bug.
 * - `viewer_external` — strictly read-only. Deliberately excluded from
 *   `comments:create` (BUILD_PLAN "STAGE — AGRICULTURE FIELD COMMENTS")
 *   — PRD A.1 names this distinction explicitly: "Agronomist/Advisor
 *   (read + comment)" vs. "Viewer (read-only)."
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  admin_owner: [
    "workspace:manage_settings",
    "workspace:manage_team",
    "workspace:delete",
    "billing:manage",
    "data:view",
    "data:edit",
    "reports:view",
    "reports:create",
    "alerts:view",
    "alerts:manage",
    "export:data",
    "comments:create",
  ],
  operational_user: [
    "data:view",
    "data:edit",
    "reports:view",
    "reports:create",
    "alerts:view",
    "alerts:manage",
    "export:data",
    "comments:create",
  ],
  scoped_field_user: [
    "data:view",
    "data:edit",
    "reports:view",
    "alerts:view",
    "comments:create",
  ],
  viewer_external: ["data:view", "reports:view", "alerts:view"],
} as const;

/**
 * Resource-scoping context for a `can()` check — the "resource" leg of
 * the actor → action → resource pattern. Omit entirely for a
 * workspace-wide check. Real since BUILD_PLAN "STAGE — AGRICULTURE
 * FIELDS": Agriculture's `fields` are a real resource type, and a real
 * membership can carry a populated `scopedResourceIds` via the Team
 * page's invite-time field picker — this is no longer a
 * built-ahead-of-need interface (see the module doc comment above).
 */
export interface ResourceScopeContext {
  /** The specific resource being acted on — e.g. a real Agriculture
   *  `fields.id`, or any future comparable resource in another
   *  workspace. */
  resourceId: string;
  /**
   * The acting membership's configured scope, from
   * `WorkspaceMembership.scopedResourceIds`. `undefined`/empty means
   * "not resource-scoped" — workspace-wide access, same as before this
   * mechanism existed.
   */
  scopedResourceIds: readonly string[] | undefined;
}

/**
 * Whether the given role holds the given permission.
 *
 * Pass `scope` to additionally check resource-level access (see
 * `ResourceScopeContext`). Omitting it — the common case today, since
 * nothing yet has a resource to check — is exactly equivalent to the
 * pre-existing workspace-wide behavior; this parameter is additive, not
 * a breaking change to any existing caller.
 */
export function can(role: Role, permission: Permission, scope?: ResourceScopeContext): boolean {
  if (!ROLE_PERMISSIONS[role].includes(permission)) {
    return false;
  }
  if (!scope) {
    return true;
  }
  const { resourceId, scopedResourceIds } = scope;
  // No configured scope on the membership = not resource-restricted =
  // workspace-wide access, regardless of role. This is the "boring,
  // consistent" default the resource-scoping literature recommends:
  // absence of a constraint means the broader (existing) behavior, not
  // an implicit deny — an implicit-deny-by-default here would silently
  // break every role for every workspace the moment this field was
  // added to the schema, before any UI exists to populate it.
  if (!scopedResourceIds || scopedResourceIds.length === 0) {
    return true;
  }
  return scopedResourceIds.includes(resourceId);
}

/** All permissions held by a role — useful for rendering UI affordances
 *  (Stage 6) without calling `can()` once per possible permission. */
export function permissionsFor(role: Role): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}
