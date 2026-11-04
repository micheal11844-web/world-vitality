"use server";

import { revalidatePath } from "next/cache";
import { can } from "@world-vitality/identity-service";
import { getWorkspaceMembership } from "../../../lib/get-workspace-membership";
import { getOrganizationData } from "../../../lib/organization-data";
import { savedItemLimitMessage } from "../../../lib/plan-limits";
import { getSessionUserId } from "../../../lib/get-session-user-id";
import { logSecurity } from "../../../lib/logger";
import { notifyFieldCommentOwner } from "../../../lib/notification-events";
import { tServer } from "../../../lib/i18n/server";

export interface CreateFieldResult {
  ok: boolean;
  error?: string;
  /** The error is a plan limit: the form offers a "See plans" link. */
  upgrade?: boolean;
}

const WORKSPACE_ID = "agriculture";

/**
 * Creates a new field (BUILD_PLAN "STAGE — AGRICULTURE FIELDS"). Gated
 * by `can(role, "data:edit")` workspace-wide — creating a field has no
 * existing resourceId to scope against, unlike viewing one. Re-checks
 * server-side here, independent of the calling page's own render-time
 * check, same defense-in-depth reasoning as every other Server Action
 * in this app.
 */
export async function createFieldAction(
  name: string,
  latitude: number,
  longitude: number,
): Promise<CreateFieldResult> {
  if (!name.trim()) {
    return { ok: false, error: await tServer("agri.err.nameRequired") };
  }
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return { ok: false, error: await tServer("resource.latitudeRange") };
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return { ok: false, error: await tServer("resource.longitudeRange") };
  }

  const membership = await getWorkspaceMembership(WORKSPACE_ID);
  if (!can(membership.role, "data:edit")) {
    return { ok: false, error: await tServer("agri.err.noPermissionAdd") };
  }

  const userId = await getSessionUserId();
  if (!userId) {
    return { ok: false, error: await tServer("resource.sessionUnverified") };
  }

  const data = getOrganizationData(membership);
  const limitMessage = membership.organizationId
    ? await savedItemLimitMessage(membership.organizationId, data)
    : null;
  if (limitMessage) {
    return { ok: false, error: limitMessage, upgrade: true };
  }

  try {
    await data.createField({
      workspaceId: WORKSPACE_ID,
      name: name.trim(),
      latitude,
      longitude,
      createdBy: userId,
    });
    revalidatePath("/workspaces/agriculture");
    return { ok: true };
  } catch (err) {
    logSecurity.error("create_field_failed", err, { workspaceId: WORKSPACE_ID });
    return { ok: false, error: await tServer("agri.err.createFailed") };
  }
}

/**
 * Updates an existing field. **Resource-scoped**, unlike
 * `createFieldAction` — uses `getWorkspaceMembership` (role +
 * `scopedResourceIds`), not just `getWorkspaceRole`, so a
 * `scoped_field_user` holding `data:edit` in general is still refused
 * for a field outside their configured scope. Same defense-in-depth
 * reasoning as every other Server Action in this app: re-checked here
 * independent of whatever the calling page already gated.
 */
export async function updateFieldAction(
  fieldId: string,
  name: string,
  latitude: number,
  longitude: number,
): Promise<CreateFieldResult> {
  if (!name.trim()) {
    return { ok: false, error: await tServer("agri.err.nameRequired") };
  }
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return { ok: false, error: await tServer("resource.latitudeRange") };
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return { ok: false, error: await tServer("resource.longitudeRange") };
  }

  const membership = await getWorkspaceMembership(WORKSPACE_ID);
  if (
    !can(membership.role, "data:edit", {
      resourceId: fieldId,
      scopedResourceIds: membership.scopedResourceIds,
    })
  ) {
    return { ok: false, error: await tServer("agri.err.noPermissionEdit") };
  }

  try {
    await getOrganizationData(membership).updateField(fieldId, {
      name: name.trim(),
      latitude,
      longitude,
    });
    revalidatePath("/workspaces/agriculture");
    return { ok: true };
  } catch (err) {
    logSecurity.error("update_field_failed", err, { workspaceId: WORKSPACE_ID, fieldId });
    return { ok: false, error: await tServer("agri.err.updateFailed") };
  }
}

/**
 * Deletes a field. Same resource-scoped gating as `updateFieldAction`.
 * See `AccountService.deleteField`'s doc comment for the one
 * honestly-flagged edge case this doesn't handle (a dangling id left
 * in some membership's `scopedResourceIds`).
 */
export async function deleteFieldAction(fieldId: string): Promise<CreateFieldResult> {
  const membership = await getWorkspaceMembership(WORKSPACE_ID);
  if (
    !can(membership.role, "data:edit", {
      resourceId: fieldId,
      scopedResourceIds: membership.scopedResourceIds,
    })
  ) {
    return { ok: false, error: await tServer("agri.err.noPermissionDelete") };
  }

  try {
    await getOrganizationData(membership).deleteField(fieldId);
    revalidatePath("/workspaces/agriculture");
    return { ok: true };
  } catch (err) {
    logSecurity.error("delete_field_failed", err, { workspaceId: WORKSPACE_ID, fieldId });
    return { ok: false, error: await tServer("agri.err.deleteFailed") };
  }
}

/**
 * Creates a comment on a field (BUILD_PLAN "STAGE — AGRICULTURE FIELD
 * COMMENTS", PRD A.1's "commentary threads on specific fields").
 * **Resource-scoped**, same as `updateFieldAction`/`deleteFieldAction`
 * — uses `getWorkspaceMembership`, not just `getWorkspaceRole`, so a
 * `scoped_field_user` holding `comments:create` in general is still
 * refused for a field outside their configured scope.
 */
export async function createFieldCommentAction(
  fieldId: string,
  body: string,
): Promise<CreateFieldResult> {
  if (!body.trim()) {
    return { ok: false, error: await tServer("agri.err.commentEmpty") };
  }

  const membership = await getWorkspaceMembership(WORKSPACE_ID);
  if (
    !can(membership.role, "comments:create", {
      resourceId: fieldId,
      scopedResourceIds: membership.scopedResourceIds,
    })
  ) {
    return { ok: false, error: await tServer("agri.err.noPermissionComment") };
  }

  const userId = await getSessionUserId();
  if (!userId) {
    return { ok: false, error: await tServer("resource.sessionUnverified") };
  }

  try {
    const comment = await getOrganizationData(membership).createFieldComment({
      fieldId,
      userId,
      body: body.trim(),
    });
    // Best-effort: tells the field's creator (never throws, never fails the comment).
    await notifyFieldCommentOwner({
      organizationId: membership.organizationId,
      workspaceId: WORKSPACE_ID,
      fieldId,
      commentId: comment.id,
      commenterId: userId,
      commenterDisplayName: comment.displayName,
      commenterEmail: comment.email,
      body: comment.body,
    });
    revalidatePath("/workspaces/agriculture");
    return { ok: true };
  } catch (err) {
    logSecurity.error("create_field_comment_failed", err, { workspaceId: WORKSPACE_ID, fieldId });
    return { ok: false, error: await tServer("agri.err.postFailed") };
  }
}

/**
 * Edits a comment (BUILD_PLAN "STAGE — AGRICULTURE FIELD COMMENTS
 * FOLLOW-UP: EDIT/DELETE"). Two independent checks, same
 * defense-in-depth layering as every other write path in this app: a
 * resource-scoped `can(role, "comments:create", { resourceId,
 * scopedResourceIds })` (a `scoped_field_user` who lost this field from
 * their scope is refused, same as `createFieldCommentAction`), **and**
 * `AccountService.updateFieldComment`'s own author-only enforcement
 * (a `WHERE user_id = requester` clause on the write itself) — holding
 * the permission in general does not let anyone edit someone else's
 * comment.
 */
export async function updateFieldCommentAction(
  commentId: string,
  fieldId: string,
  body: string,
): Promise<CreateFieldResult> {
  if (!body.trim()) {
    return { ok: false, error: await tServer("agri.err.commentEmpty") };
  }

  const membership = await getWorkspaceMembership(WORKSPACE_ID);
  if (
    !can(membership.role, "comments:create", {
      resourceId: fieldId,
      scopedResourceIds: membership.scopedResourceIds,
    })
  ) {
    return { ok: false, error: await tServer("agri.err.noPermissionComment") };
  }

  const userId = await getSessionUserId();
  if (!userId) {
    return { ok: false, error: await tServer("resource.sessionUnverified") };
  }

  try {
    await getOrganizationData(membership).updateFieldComment(commentId, userId, body.trim());
    revalidatePath("/workspaces/agriculture");
    return { ok: true };
  } catch (err) {
    logSecurity.error("update_field_comment_failed", err, {
      workspaceId: WORKSPACE_ID,
      fieldId,
      commentId,
    });
    return { ok: false, error: await tServer("agri.err.editOwnOnly") };
  }
}

/**
 * Deletes a comment. Same two-layer enforcement as
 * `updateFieldCommentAction` (resource-scoped `comments:create` plus
 * `AccountService.deleteFieldComment`'s own author-only WHERE clause).
 * No admin/moderator override — see `AccountService.deleteFieldComment`'s
 * doc comment for why that's a deliberate scope boundary, not an
 * oversight.
 */
export async function deleteFieldCommentAction(
  commentId: string,
  fieldId: string,
): Promise<CreateFieldResult> {
  const membership = await getWorkspaceMembership(WORKSPACE_ID);
  if (
    !can(membership.role, "comments:create", {
      resourceId: fieldId,
      scopedResourceIds: membership.scopedResourceIds,
    })
  ) {
    return { ok: false, error: await tServer("agri.err.noPermissionComment") };
  }

  const userId = await getSessionUserId();
  if (!userId) {
    return { ok: false, error: await tServer("resource.sessionUnverified") };
  }

  try {
    await getOrganizationData(membership).deleteFieldComment(commentId, userId);
    revalidatePath("/workspaces/agriculture");
    return { ok: true };
  } catch (err) {
    logSecurity.error("delete_field_comment_failed", err, {
      workspaceId: WORKSPACE_ID,
      fieldId,
      commentId,
    });
    return { ok: false, error: await tServer("agri.err.deleteOwnOnly") };
  }
}
