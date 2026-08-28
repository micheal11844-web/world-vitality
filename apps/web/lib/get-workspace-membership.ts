import { cookies } from "next/headers";
import type { WorkspaceMembership } from "@world-vitality/identity-service";
import { getAuthService } from "./auth";
import { getAccountService } from "./account";
import { SESSION_COOKIE } from "./constants";
import { logSecurity } from "./logger";

/**
 * Returns the current user's full membership for a workspace — role
 * AND `scopedResourceIds` — unlike `getWorkspaceRole()`, which discards
 * `scopedResourceIds` and returns only the role string. Kept as a
 * separate function rather than widening `getWorkspaceRole`'s return
 * type: that function is already consumed as `Promise<Role>` by every
 * one of this app's 10 workspace pages, and changing its shape for the
 * sake of the one caller that actually needs resource-scoping
 * (`agriculture/page.tsx`, the first real use of `can()`'s `scope`
 * parameter) would be a breaking change to every existing call site.
 * Same reasoning `get-session-user-id.ts` already used for the same
 * kind of "one caller needs more than the others" situation.
 *
 * Fails safe the same way `getWorkspaceRole` does: no session, no
 * membership, or any lookup error all resolve to `viewer_external` with
 * no resource scope (i.e., least privilege, not resource-restricted —
 * restricting further on failure would be a different kind of bug, not
 * a safer one, since it could hide data a legitimately-scoped user
 * should see due to an unrelated transient error).
 */
export async function getWorkspaceMembership(workspaceId: string): Promise<WorkspaceMembership> {
  const fallback: WorkspaceMembership = { workspaceId, role: "viewer_external" };
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;
    if (!sessionToken) {
      return fallback;
    }

    const auth = getAuthService();
    const session = await auth.getSession(sessionToken);
    if (!session) {
      return fallback;
    }

    const account = getAccountService();
    const memberships = await account.getWorkspaceMemberships(session.userId);
    const membership = memberships.find((m) => m.workspaceId === workspaceId);
    return membership ?? fallback;
  } catch (err) {
    logSecurity.error("workspace_membership_lookup_failed", err, { workspaceId });
    return fallback;
  }
}
