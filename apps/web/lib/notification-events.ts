import {
  can,
  fieldCommentNotification,
  membershipAddedNotification,
} from "@world-vitality/identity-service";
import { WORKSPACE_LINKS } from "../app/workspaces/workspace-nav";
import { getAccountService } from "./account";
import { logApplication } from "./logger";
import { notifyUser } from "./notification-sync";
import { ROLE_LABELS } from "./role-labels";

/**
 * Collaboration events that become informational notifications
 * (Notification Center, PRD B.6). Both are **best-effort and never
 * throw**: a notification is a courtesy layered on an action that has
 * already succeeded, so a failure here is logged and swallowed rather
 * than failing the comment or the invite acceptance.
 */

/**
 * Tells the creator of a field that someone else commented on it.
 *
 * Skipped when the commenter *is* the creator, when the field has no
 * recorded creator (created by an account since deleted), and when the
 * creator can no longer comment on that field — a removed member, or a
 * scoped field user whose scope no longer includes it, gets nothing, so
 * a notification never reveals a field (or a comment snippet) the
 * person has lost access to.
 */
export async function notifyFieldCommentOwner(input: {
  workspaceId: string;
  fieldId: string;
  commentId: string;
  commenterId: string;
  commenterDisplayName: string | null;
  commenterEmail: string | null;
  body: string;
}): Promise<void> {
  try {
    const account = getAccountService();
    const fields = await account.listFields(input.workspaceId);
    const field = fields.find((f) => f.id === input.fieldId);
    const ownerId = field?.createdBy;
    if (!field || !ownerId || ownerId === input.commenterId) return;

    const memberships = await account.getWorkspaceMemberships(ownerId);
    const membership = memberships.find((m) => m.workspaceId === input.workspaceId);
    if (
      !membership ||
      !can(membership.role, "comments:create", {
        resourceId: input.fieldId,
        scopedResourceIds: membership.scopedResourceIds,
      })
    ) {
      return;
    }

    await notifyUser(
      ownerId,
      fieldCommentNotification({
        commentId: input.commentId,
        fieldName: field.name,
        commenterDisplayName: input.commenterDisplayName,
        commenterEmail: input.commenterEmail,
        commentBody: input.body,
      }),
    );
  } catch (err) {
    logApplication.error("notify_field_comment_owner_failed", err);
  }
}

/** Tells someone they now have access to a workspace (invite accepted). */
export async function notifyMembershipAdded(input: {
  userId: string;
  workspaceId: string;
  role: string;
}): Promise<void> {
  try {
    const workspaceLabel =
      WORKSPACE_LINKS.find((w) => w.key === input.workspaceId)?.label ?? input.workspaceId;
    await notifyUser(
      input.userId,
      membershipAddedNotification({
        workspaceId: input.workspaceId,
        workspaceLabel,
        roleId: input.role,
        roleLabel: ROLE_LABELS[input.role] ?? input.role,
        now: new Date(),
      }),
    );
  } catch (err) {
    logApplication.error("notify_membership_added_failed", err);
  }
}
