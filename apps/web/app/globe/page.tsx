import { can } from "@world-vitality/identity-service";
import { getWorkspaceMembership } from "../../lib/get-workspace-membership";
import { getAccountService } from "../../lib/account";
import { logTelemetry } from "../../lib/logger";
import { GlobeShell } from "./globe-shell";
import type { GlobePin } from "./globe-viewer";

export const dynamic = "force-dynamic";

/**
 * "God's Eye" global view — server-side data assembly (BUILD_PLAN
 * "STAGE — GOD'S EYE GLOBE VIEW"). Combines every real, workspace-
 * scoped resource this app tracks (Agriculture's fields, Insurance's
 * insured properties, Government & NGOs' monitored locations) into one
 * flat pin list for `GlobeViewer` to plot — the first page in this app
 * to read across more than one workspace's resource table at once.
 *
 * **Permission filtering happens here, per workspace, exactly as it
 * does on each workspace's own home page — this is not optional and
 * not a lighter-weight check because it's "just a visualization."** A
 * `scoped_field_user` ("Claims Adjuster" in Insurance, "Field Staff" in
 * Government & NGOs) who can only see specific resources on their own
 * workspace's home page must see exactly the same restricted set here,
 * never the full unfiltered list — each workspace's own membership
 * (role + `scopedResourceIds`) is fetched independently, since a
 * single signed-in user can hold a completely different role in each
 * of the three workspaces. Getting this wrong would be a real
 * permission bypass, not a cosmetic bug — the exact category of gap
 * the repo-wide security audit (BUILD_PLAN v45) was written to catch.
 */
export default async function GlobePage() {
  logTelemetry.event("globe_viewed");

  const [agricultureMembership, insuranceMembership, governmentNgosMembership] = await Promise.all(
    [
      getWorkspaceMembership("agriculture"),
      getWorkspaceMembership("insurance"),
      getWorkspaceMembership("government-ngos"),
    ],
  );

  const [fields, properties, locations] = await Promise.all([
    getAccountService().listFields("agriculture"),
    getAccountService().listProperties("insurance"),
    getAccountService().listLocations("government-ngos"),
  ]);

  const pins: GlobePin[] = [
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

  return <GlobeShell pins={pins} />;
}
