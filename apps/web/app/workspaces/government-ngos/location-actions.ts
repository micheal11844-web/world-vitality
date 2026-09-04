"use server";

import { revalidatePath } from "next/cache";
import { can } from "@world-vitality/identity-service";
import { getWorkspaceRole } from "../../../lib/get-workspace-role";
import { getAccountService } from "../../../lib/account";
import { getSessionUserId } from "../../../lib/get-session-user-id";
import { logSecurity } from "../../../lib/logger";

export interface CreateLocationResult {
  ok: boolean;
  error?: string;
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
    return { ok: false, error: "Enter a label for this location." };
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
      error: "You do not have permission to add monitored locations in this workspace.",
    };
  }

  const userId = await getSessionUserId();
  if (!userId) {
    return { ok: false, error: "Your session could not be verified. Please sign in again." };
  }

  try {
    await getAccountService().createLocation({
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
    return { ok: false, error: "Failed to add monitored location. Please try again." };
  }
}
