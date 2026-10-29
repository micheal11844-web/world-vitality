import type { Role } from "@world-vitality/identity-service";
import { getWorkspaceMembership } from "./get-workspace-membership";

/**
 * The current user's role in a workspace — just the role string, for the
 * many pages and actions that only need to ask `can(role, ...)`.
 *
 * It is `getWorkspaceMembership(workspaceId).role`, so the rules are the
 * same in one place: the organisation's owner is `admin_owner`, a member
 * has the role they were invited with, and anyone else — no session, no
 * role in that workspace, or a lookup that failed — is `viewer_external`
 * (least privilege), never an elevated role. See `get-workspace-membership.ts`.
 */
export async function getWorkspaceRole(workspaceId: string): Promise<Role> {
  return (await getWorkspaceMembership(workspaceId)).role;
}
