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
  | "export:data";

/**
 * Which permissions each role holds, workspace-scoped (a user's role can
 * differ per workspace — see `WorkspaceMembership` in `account.ts`).
 *
 * - `admin_owner` — full control, including irreversible/high-consequence
 *   actions (delete workspace, manage billing, manage team membership).
 * - `operational_user` — day-to-day platform use: views and edits data,
 *   creates reports, manages alerts. Cannot change who's on the team,
 *   billing, or workspace-level settings.
 * - `scoped_field_user` — same shape as `operational_user` today, minus
 *   report creation. "Scoped" implies a narrower slice of *data* (e.g. one
 *   field, one site) rather than fewer permission types — that data-level
 *   scoping isn't modeled by this role system yet (permissions here are
 *   workspace-wide, not resource-scoped) and needs its own design pass
 *   before this role is trustworthy for real access control.
 * - `viewer_external` — strictly read-only.
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
  ],
  operational_user: [
    "data:view",
    "data:edit",
    "reports:view",
    "reports:create",
    "alerts:view",
    "alerts:manage",
    "export:data",
  ],
  scoped_field_user: ["data:view", "data:edit", "reports:view", "alerts:view"],
  viewer_external: ["data:view", "reports:view", "alerts:view"],
} as const;

/** Whether the given role holds the given permission. */
export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/** All permissions held by a role — useful for rendering UI affordances
 *  (Stage 6) without calling `can()` once per possible permission. */
export function permissionsFor(role: Role): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}
