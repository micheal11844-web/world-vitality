import {
  resolveWorkspaceMembership,
  type WorkspaceMembership,
} from "@world-vitality/identity-service";
import { getAccessContext } from "./get-access-context";
import { logSecurity } from "./logger";

/**
 * Returns the current user's full membership for a workspace — role,
 * `scopedResourceIds` AND `organizationId` — unlike `getWorkspaceRole()`,
 * which returns only the role string (it is consumed as `Promise<Role>` by
 * every workspace page, so its shape stays as it is).
 *
 * The rules live in `resolveWorkspaceMembership` (identity-service):
 *  - the organisation's owner is `admin_owner` in every workspace;
 *  - a member has exactly the role they were invited with, in the
 *    workspaces they were invited to;
 *  - a member with no role in a workspace, and anyone with no organisation,
 *    gets `viewer_external` and NO organisation, so they see none of the
 *    organisation's saved items there.
 *
 * **Fails closed.** No session, no organisation, or any lookup error all
 * resolve to `viewer_external` with no `organizationId`. Before
 * organisations existed this failed to "least privilege, but see
 * everything the workspace has"; now that saved items belong to someone,
 * failing open would mean showing one customer another's data, so a
 * transient error shows an empty workspace instead.
 */
export async function getWorkspaceMembership(workspaceId: string): Promise<WorkspaceMembership> {
  const fallback: WorkspaceMembership = { workspaceId, role: "viewer_external" };
  try {
    const context = await getAccessContext();
    if (!context) {
      return fallback;
    }
    return resolveWorkspaceMembership(context.organization, context.roleRows, workspaceId);
  } catch (err) {
    logSecurity.error("workspace_membership_lookup_failed", err, { workspaceId });
    return fallback;
  }
}
