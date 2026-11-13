import { can } from "@world-vitality/identity-service";
import type { GlobePin } from "../app/globe/globe-types";
import { getWorkspaceMembership } from "./get-workspace-membership";
import { getOrganizationData } from "./organization-data";

/**
 * Every real, point-located place this app stores for the signed-in person:
 * Agriculture's fields, Insurance's insured properties and Government & NGOs'
 * monitored locations. The Globe plots them as pins, and the satellite-heat
 * check (`heat-watch.ts`) watches them.
 *
 * **Permission filtering happens here, per workspace, exactly as it does on
 * each workspace's own home page, and it is not optional.** A
 * `scoped_field_user` ("Claims Adjuster" in Insurance, "Field Staff" in
 * Government & NGOs) who can only see specific resources on their own
 * workspace's home page must see exactly the same restricted set here, never
 * the full unfiltered list: each workspace's membership (role +
 * `scopedResourceIds`) is fetched independently, because one person can hold a
 * different role in each workspace. Getting this wrong would be a permission
 * bypass, not a cosmetic bug (the kind of gap the repo-wide security audit,
 * BUILD_PLAN v45, was written to catch). The same rule holds for the alerts
 * built from these places: nobody is told about heat near a place they cannot
 * open.
 *
 * Needs the request's session (it reads the signed-in person's memberships), so
 * it must be called while the request is being handled, not later from a
 * background task.
 *
 * Each workspace's membership lookup flows straight into its own list read, so
 * a slow one never makes the other two wait.
 */
export async function loadWatchedPlaces(): Promise<GlobePin[]> {
  const [
    { membership: agricultureMembership, items: fields },
    { membership: insuranceMembership, items: properties },
    { membership: governmentNgosMembership, items: locations },
  ] = await Promise.all([
    getWorkspaceMembership("agriculture").then(async (membership) => ({
      membership,
      items: await getOrganizationData(membership).listFields("agriculture"),
    })),
    getWorkspaceMembership("insurance").then(async (membership) => ({
      membership,
      items: await getOrganizationData(membership).listProperties("insurance"),
    })),
    getWorkspaceMembership("government-ngos").then(async (membership) => ({
      membership,
      items: await getOrganizationData(membership).listLocations("government-ngos"),
    })),
  ]);

  return [
    ...fields
      .filter((f) =>
        can(agricultureMembership.role, "data:view", {
          resourceId: f.id,
          scopedResourceIds: agricultureMembership.scopedResourceIds,
        }),
      )
      .map((f) => ({
        id: `agriculture-${f.id}`,
        label: f.name,
        latitude: f.latitude,
        longitude: f.longitude,
        workspaceKey: "agriculture",
        workspaceLabel: "Agriculture",
        href: "/workspaces/agriculture",
      })),
    ...properties
      .filter((p) =>
        can(insuranceMembership.role, "data:view", {
          resourceId: p.id,
          scopedResourceIds: insuranceMembership.scopedResourceIds,
        }),
      )
      .map((p) => ({
        id: `insurance-${p.id}`,
        label: p.policyNumber,
        latitude: p.latitude,
        longitude: p.longitude,
        workspaceKey: "insurance",
        workspaceLabel: "Insurance",
        href: "/workspaces/insurance",
      })),
    ...locations
      .filter((l) =>
        can(governmentNgosMembership.role, "data:view", {
          resourceId: l.id,
          scopedResourceIds: governmentNgosMembership.scopedResourceIds,
        }),
      )
      .map((l) => ({
        id: `government-ngos-${l.id}`,
        label: l.label,
        latitude: l.latitude,
        longitude: l.longitude,
        workspaceKey: "government-ngos",
        workspaceLabel: "Government & NGOs",
        href: "/workspaces/government-ngos",
      })),
  ];
}
