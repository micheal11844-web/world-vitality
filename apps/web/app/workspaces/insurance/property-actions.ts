"use server";

import { revalidatePath } from "next/cache";
import { can } from "@world-vitality/identity-service";
import { getWorkspaceMembership } from "../../../lib/get-workspace-membership";
import { getOrganizationData } from "../../../lib/organization-data";
import { savedItemLimitMessage } from "../../../lib/plan-limits";
import { getSessionUserId } from "../../../lib/get-session-user-id";
import { logSecurity } from "../../../lib/logger";
import { tServer } from "../../../lib/i18n/server";

export interface CreatePropertyResult {
  ok: boolean;
  error?: string;
  /** The error is a plan limit: the form offers a "See plans" link. */
  upgrade?: boolean;
}

const WORKSPACE_ID = "insurance";

/**
 * Creates a new insured property (BUILD_PLAN "STAGE — INSURANCE
 * FOLLOW-UP: INSURED PROPERTIES"), Insurance's analog of
 * `createFieldAction`. Gated by `can(role, "data:edit")` workspace-wide
 * — creating a property has no existing resourceId to scope against,
 * unlike viewing one. Re-checks server-side here, independent of the
 * calling page's own render-time check, same defense-in-depth
 * reasoning as every other Server Action in this app.
 */
export async function createPropertyAction(
  policyNumber: string,
  propertyAddress: string,
  latitude: number,
  longitude: number,
): Promise<CreatePropertyResult> {
  if (!policyNumber.trim()) {
    return { ok: false, error: await tServer("insurance.err.policyRequired") };
  }
  if (!propertyAddress.trim()) {
    return { ok: false, error: await tServer("insurance.err.addressRequired") };
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
      error: await tServer("insurance.err.noPermissionAdd"),
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
    await data.createProperty({
      workspaceId: WORKSPACE_ID,
      policyNumber: policyNumber.trim(),
      propertyAddress: propertyAddress.trim(),
      latitude,
      longitude,
      createdBy: userId,
    });
    revalidatePath("/workspaces/insurance");
    return { ok: true };
  } catch (err) {
    logSecurity.error("create_property_failed", err, { workspaceId: WORKSPACE_ID });
    return { ok: false, error: await tServer("insurance.err.createFailed") };
  }
}

/**
 * Updates an existing insured property. **Resource-scoped**, unlike
 * `createPropertyAction` — uses `getWorkspaceMembership` (role +
 * `scopedResourceIds`), not just `getWorkspaceRole`, so a
 * `scoped_field_user` ("Claims Adjuster") holding `data:edit` in
 * general is still refused for a property outside their configured
 * scope. Mirrors `updateFieldAction`'s exact reasoning.
 */
export async function updatePropertyAction(
  propertyId: string,
  policyNumber: string,
  propertyAddress: string,
  latitude: number,
  longitude: number,
): Promise<CreatePropertyResult> {
  if (!policyNumber.trim()) {
    return { ok: false, error: await tServer("insurance.err.policyRequired") };
  }
  if (!propertyAddress.trim()) {
    return { ok: false, error: await tServer("insurance.err.addressRequired") };
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
      resourceId: propertyId,
      scopedResourceIds: membership.scopedResourceIds,
    })
  ) {
    return { ok: false, error: await tServer("insurance.err.noPermissionEdit") };
  }

  try {
    await getOrganizationData(membership).updateProperty(propertyId, {
      policyNumber: policyNumber.trim(),
      propertyAddress: propertyAddress.trim(),
      latitude,
      longitude,
    });
    revalidatePath("/workspaces/insurance");
    return { ok: true };
  } catch (err) {
    logSecurity.error("update_property_failed", err, { workspaceId: WORKSPACE_ID, propertyId });
    return { ok: false, error: await tServer("insurance.err.updateFailed") };
  }
}

/**
 * Deletes an insured property. Same resource-scoped gating as
 * `updatePropertyAction`. See `AccountService.deleteProperty`'s doc
 * comment for the dangling-`scopedResourceIds` cleanup it performs
 * before deleting the row itself.
 */
export async function deletePropertyAction(propertyId: string): Promise<CreatePropertyResult> {
  const membership = await getWorkspaceMembership(WORKSPACE_ID);
  if (
    !can(membership.role, "data:edit", {
      resourceId: propertyId,
      scopedResourceIds: membership.scopedResourceIds,
    })
  ) {
    return { ok: false, error: await tServer("insurance.err.noPermissionDelete") };
  }

  try {
    await getOrganizationData(membership).deleteProperty(propertyId);
    revalidatePath("/workspaces/insurance");
    return { ok: true };
  } catch (err) {
    logSecurity.error("delete_property_failed", err, { workspaceId: WORKSPACE_ID, propertyId });
    return { ok: false, error: await tServer("insurance.err.deleteFailed") };
  }
}
