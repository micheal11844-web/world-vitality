import { cookies } from "next/headers";
import type { Role } from "@world-vitality/identity-service";
import { getAuthService } from "./auth";
import { getAccountService } from "./account";
import { SESSION_COOKIE } from "./constants";
import { logSecurity } from "./logger";

/**
 * The app's first real role-based UI gating (BUILD_PLAN "STAGE —
 * GOVERNMENT & NGOS WORKSPACE"): the four-role permission model
 * (`roles.ts`, `admin_owner`/`operational_user`/`scoped_field_user`/
 * `viewer_external`) and `WorkspaceMembership` have existed since
 * Stage 3.3, but no page anywhere in this app has ever actually looked
 * up a user's role and used it to show or hide anything — every
 * workspace has shown the exact same view to every signed-in user
 * regardless of role. This is the first caller.
 *
 * **Fail-safe default, stated explicitly: no membership record for a
 * workspace resolves to `viewer_external` (least privilege), never to
 * an elevated role.** This matters concretely today: nothing in this
 * app has any UI for assigning a workspace membership yet (no invite
 * flow, no admin console), so *every* real signed-in user currently has
 * zero membership rows for every workspace — meaning everyone sees the
 * `viewer_external` view of any role-gated UI by default, until
 * memberships are created directly (which the owner can request be done
 * via a Supabase migration, the same way `test-workspace` was verified
 * before this code was written). This is the correct, safe default for
 * "no role configured" — the alternative (defaulting to an elevated
 * role) would mean every unconfigured user silently getting full
 * access, which is backwards for a permission system.
 *
 * Also fails safe on any lookup error (missing session, missing env
 * vars, a real database failure) — same reasoning: a permission check
 * that can't complete must resolve to the least-privileged outcome, not
 * throw and break the page or silently grant access.
 */
export async function getWorkspaceRole(workspaceId: string): Promise<Role> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;
    if (!sessionToken) {
      return "viewer_external";
    }

    const auth = getAuthService();
    const session = await auth.getSession(sessionToken);
    if (!session) {
      return "viewer_external";
    }

    const account = getAccountService();
    const memberships = await account.getWorkspaceMemberships(session.userId);
    const membership = memberships.find((m) => m.workspaceId === workspaceId);
    return membership?.role ?? "viewer_external";
  } catch (err) {
    logSecurity.error("workspace_role_lookup_failed", err, { workspaceId });
    return "viewer_external";
  }
}
