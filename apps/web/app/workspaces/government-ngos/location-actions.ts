"use server";

import { revalidatePath } from "next/cache";
import { can } from "@world-vitality/identity-service";
import { getWorkspaceMembership } from "../../../lib/get-workspace-membership";
import { getOrganizationData } from "../../../lib/organization-data";
import { savedItemLimitMessage } from "../../../lib/plan-limits";
import { getSessionUserId } from "../../../lib/get-session-user-id";
import { logSecurity } from "../../../lib/logger";
import { tServer } from "../../../lib/i18n/server";

export interface CreateLocationResult {
  ok: boolean;
  error?: string;
  /** The error is a plan limit: the form offers a "See plans" link. */
  upgrade?: boolean;
}

const WORKSPACE_ID = "government-ngos";

/**
 * Creates a new monitored location (BUILD_PLAN "STAGE — GOVERNMENT &
 * NGOS FOLLOW-UP: MONITORED LOCATIONS"), this workspace's analog of
 * `createPropertyAction`/`createFieldAction`. Gated by `can(role,
 * "data:edit")` workspace-wide — creating a location has no existing
 * resourceId to scope against, unlike viewing one. Re-checks
 * server-side here, independent of the calling page's own render-time
 * check, same defense-in-depth reasoning as every other Server Action
 * in this app.
 */
export async function createLocationAction(
  label: string,
  latitude: number,
  longitude: number,
): Promise<CreateLocationResult> {
  if (!label.trim()) {
    return { ok: false, error: await tServer("gov.err.labelRequired") };
  }
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return { ok: false, error: await tServer("resource.latitudeRange") };
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return { ok: false, error: await tServer("resource.longitudeRange") };
  }

  const membership = await getWorkspaceMembership(WORKSPACE_ID);
  if (!can(membership.role, "data:edit")) {
    return {
      ok: false,
      error: await tServer("gov.err.noPermissionAdd"),
    };
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
    await data.createLocation({
      workspaceId: WORKSPACE_ID,
      label: label.trim(),
      latitude,
      longitude,
      createdBy: userId,
    });
    revalidatePath("/workspaces/government-ngos");
    return { ok: true };
  } catch (err) {
    logSecurity.error("create_location_failed", err, { workspaceId: WORKSPACE_ID });
    return { ok: false, error: await tServer("gov.err.createFailed") };
  }
}

/**
 * Updates an existing monitored location (BUILD_PLAN "STAGE —
 * GOVERNMENT & NGOS FOLLOW-UP: MONITORED LOCATIONS EDIT/DELETE").
 * **Resource-scoped**, unlike `createLocationAction` — uses
 * `getWorkspaceMembership` (role + `scopedResourceIds`), not just
 * `getWorkspaceRole`, so a `scoped_field_user` ("Field Staff") holding
 * `data:edit` in general is still refused for a location outside
 * their configured scope. Mirrors `updatePropertyAction`/
 * `updateFieldAction`'s exact reasoning.
 */
export async function updateLocationAction(
  locationId: string,
  label: string,
  latitude: number,
  longitude: number,
): Promise<CreateLocationResult> {
  if (!label.trim()) {
    return { ok: false, error: await tServer("gov.err.labelRequired") };
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
      resourceId: locationId,
      scopedResourceIds: membership.scopedResourceIds,
    })
  ) {
    return { ok: false, error: await tServer("gov.err.noPermissionEdit") };
  }

  try {
    await getOrganizationData(membership).updateLocation(locationId, {
      label: label.trim(),
      latitude,
      longitude,
    });
    revalidatePath("/workspaces/government-ngos");
    return { ok: true };
  } catch (err) {
    logSecurity.error("update_location_failed", err, { workspaceId: WORKSPACE_ID, locationId });
    return { ok: false, error: await tServer("gov.err.updateFailed") };
  }
}

/**
 * Deletes a monitored location. Same resource-scoped gating as
 * `updateLocationAction`. See `AccountService.deleteLocation`'s doc
 * comment for the dangling-`scopedResourceIds` cleanup it performs
 * before deleting the row itself.
 */
export async function deleteLocationAction(locationId: string): Promise<CreateLocationResult> {
  const membership = await getWorkspaceMembership(WORKSPACE_ID);
  if (
    !can(membership.role, "data:edit", {
      resourceId: locationId,
      scopedResourceIds: membership.scopedResourceIds,
    })
  ) {
    return { ok: false, error: await tServer("gov.err.noPermissionDelete") };
  }

  try {
    await getOrganizationData(membership).deleteLocation(locationId);
    revalidatePath("/workspaces/government-ngos");
    return { ok: true };
  } catch (err) {
    logSecurity.error("delete_location_failed", err, { workspaceId: WORKSPACE_ID, locationId });
    return { ok: false, error: await tServer("gov.err.deleteFailed") };
  }
}
