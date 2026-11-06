"use server";

import { revalidatePath } from "next/cache";
import type { Role } from "@world-vitality/identity-service";
import { RemoveMemberRefusedError, can } from "@world-vitality/identity-service";
import { tServer } from "../../../../lib/i18n/server";
import { getWorkspaceMembership } from "../../../../lib/get-workspace-membership";
import { getOrganizationData } from "../../../../lib/organization-data";
import { seatLimitMessage } from "../../../../lib/plan-limits";
import { getAuthService } from "../../../../lib/auth";
import { logSecurity } from "../../../../lib/logger";

export interface TeamActionResult {
  ok: boolean;
  error?: string;
  /** The error is a plan limit: the form offers a "See plans" link. */
  upgrade?: boolean;
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
    return { ok: false, error: await tServer("team.err.email") };
  }
  if (!VALID_ROLES.includes(role as Role)) {
    return { ok: false, error: await tServer("team.err.role") };
  }

  const membership = await getWorkspaceMembership(workspaceId);
  if (!can(membership.role, "workspace:manage_team") || !membership.organizationId) {
    return { ok: false, error: await tServer("team.err.noInvite") };
  }

  // The invitation carries the INVITER's organisation, taken from their own
  // session here — never from anything the browser sent.
  const limitMessage = await seatLimitMessage(
    membership.organizationId,
    getOrganizationData(membership),
  );
  if (limitMessage) {
    return { ok: false, error: limitMessage, upgrade: true };
  }

  try {
    await getAuthService().inviteUser(email, {
      organizationId: membership.organizationId,
      workspaceId,
      role: role as Role,
      scopedResourceIds,
    });
    return { ok: true };
  } catch (err) {
    logSecurity.error("invite_member_failed", err, { workspaceId });
    return { ok: false, error: await tServer("team.err.inviteFailed") };
  }
}

/**
 * Removes a member from a workspace. The data layer refuses to remove the
 * organisation's owner or a workspace's last `admin_owner`, and says which
 * with a typed error; those two reasons matter to the person clicking the
 * button, so each gets its own sentence in their language. Anything else
 * (a database failure) gets a generic one — the raw message, which can
 * carry an id or database text, is logged and never shown.
 */
export async function removeMemberAction(
  workspaceId: string,
  userId: string,
): Promise<TeamActionResult> {
  const membership = await getWorkspaceMembership(workspaceId);
  if (!can(membership.role, "workspace:manage_team")) {
    return { ok: false, error: await tServer("team.err.noRemove") };
  }

  try {
    await getOrganizationData(membership).removeMember(workspaceId, userId);
    revalidatePath(`/workspaces/${workspaceId}/team`);
    return { ok: true };
  } catch (err) {
    logSecurity.error("remove_member_failed", err, { workspaceId, targetUserId: userId });
    if (err instanceof RemoveMemberRefusedError) {
      return {
        ok: false,
        error: await tServer(
          err.reason === "organization_owner"
            ? "team.err.ownerCannotBeRemoved"
            : "team.err.lastAdmin",
        ),
      };
    }
    return { ok: false, error: await tServer("team.err.removeFailed") };
  }
}
