"use server";

import { revalidatePath } from "next/cache";
import type { Role } from "@world-vitality/identity-service";
import { can } from "@world-vitality/identity-service";
import { getWorkspaceRole } from "../../../../lib/get-workspace-role";
import { getAuthService } from "../../../../lib/auth";
import { getAccountService } from "../../../../lib/account";
import { logSecurity } from "../../../../lib/logger";

export interface TeamActionResult {
  ok: boolean;
  error?: string;
}

const VALID_ROLES: Role[] = [
  "admin_owner",
  "operational_user",
  "scoped_field_user",
  "viewer_external",
];

/**
 * Invites someone to a workspace by email (BUILD_PLAN "STAGE —
 * TEAM/INVITE UI"). Re-checks `workspace:manage_team` server-side here,
 * not just at the calling page's render time — a Server Action is a
 * real network endpoint in its own right and must not trust that the
 * page which rendered its form actually enforced the gate (the page
 * does too, but this is defense in depth, same reasoning as every other
 * server-side permission check in this app).
 */
export async function inviteMemberAction(
  workspaceId: string,
  email: string,
  role: string,
  scopedResourceIds?: string[],
): Promise<TeamActionResult> {
  if (!email || !email.includes("@")) {
    return { ok: false, error: "Enter a valid email address." };
  }
  if (!VALID_ROLES.includes(role as Role)) {
    return { ok: false, error: "Choose a valid role." };
  }

  const currentUserRole = await getWorkspaceRole(workspaceId);
  if (!can(currentUserRole, "workspace:manage_team")) {
    return { ok: false, error: "You do not have permission to invite people to this workspace." };
  }

  try {
    await getAuthService().inviteUser(email, {
      workspaceId,
      role: role as Role,
      scopedResourceIds,
    });
    return { ok: true };
  } catch (err) {
    logSecurity.error("invite_member_failed", err, { workspaceId });
    return { ok: false, error: "Failed to send invite. Please try again." };
  }
}

/**
 * Removes a member from a workspace. `AccountService.removeMember`
 * itself refuses to remove a workspace's last `admin_owner` — that
 * error message is surfaced to the caller as-is rather than replaced
 * with a generic one, since it's the one case where the specific reason
 * matters to the person clicking the button.
 */
export async function removeMemberAction(
  workspaceId: string,
  userId: string,
): Promise<TeamActionResult> {
  const currentUserRole = await getWorkspaceRole(workspaceId);
  if (!can(currentUserRole, "workspace:manage_team")) {
    return {
      ok: false,
      error: "You do not have permission to remove people from this workspace.",
    };
  }

  try {
    await getAccountService().removeMember(workspaceId, userId);
    revalidatePath(`/workspaces/${workspaceId}/team`);
    return { ok: true };
  } catch (err) {
    logSecurity.error("remove_member_failed", err, { workspaceId, targetUserId: userId });
    return { ok: false, error: err instanceof Error ? err.message : "Failed to remove member." };
  }
}
