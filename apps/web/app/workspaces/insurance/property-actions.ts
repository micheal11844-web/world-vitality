"use server";

import { revalidatePath } from "next/cache";
import { can } from "@world-vitality/identity-service";
import { getWorkspaceRole } from "../../../lib/get-workspace-role";
import { getWorkspaceMembership } from "../../../lib/get-workspace-membership";
import { getAccountService } from "../../../lib/account";
import { getSessionUserId } from "../../../lib/get-session-user-id";
import { logSecurity } from "../../../lib/logger";

export interface CreatePropertyResult {
  ok: boolean;
  error?: string;
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
    return { ok: false, error: "Enter a policy number." };
  }
  if (!propertyAddress.trim()) {
    return { ok: false, error: "Enter a property address." };
  }
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return { ok: false, error: "Latitude must be a number between -90 and 90." };
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return { ok: false, error: "Longitude must be a number between -180 and 180." };
  }

  const role = await getWorkspaceRole(WORKSPACE_ID);
  if (!can(role, "data:edit")) {
    return {
      ok: false,
      error: "You do not have permission to add insured properties in this workspace.",
    };
  }

  const userId = await getSessionUserId();
  if (!userId) {
    return { ok: false, error: "Your session could not be verified. Please sign in again." };
  }

  try {
    await getAccountService().createProperty({
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
    return { ok: false, error: "Failed to create insured property. Please try again." };
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
    return { ok: false, error: "Enter a policy number." };
  }
  if (!propertyAddress.trim()) {
    return { ok: false, error: "Enter a property address." };
  }
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return { ok: false, error: "Latitude must be a number between -90 and 90." };
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return { ok: false, error: "Longitude must be a number between -180 and 180." };
  }

  const membership = await getWorkspaceMembership(WORKSPACE_ID);
  if (
    !can(membership.role, "data:edit", {
      resourceId: propertyId,
      scopedResourceIds: membership.scopedResourceIds,
    })
  ) {
    return { ok: false, error: "You do not have permission to edit this property." };
  }

  try {
    await getAccountService().updateProperty(propertyId, {
      policyNumber: policyNumber.trim(),
      propertyAddress: propertyAddress.trim(),
      latitude,
      longitude,
    });
    revalidatePath("/workspaces/insurance");
    return { ok: true };
  } catch (err) {
    logSecurity.error("update_property_failed", err, { workspaceId: WORKSPACE_ID, propertyId });
    return { ok: false, error: "Failed to update insured property. Please try again." };
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
    return { ok: false, error: "You do not have permission to delete this property." };
  }

  try {
    await getAccountService().deleteProperty(propertyId);
    revalidatePath("/workspaces/insurance");
    return { ok: true };
  } catch (err) {
    logSecurity.error("delete_property_failed", err, { workspaceId: WORKSPACE_ID, propertyId });
    return { ok: false, error: "Failed to delete insured property. Please try again." };
  }
}
