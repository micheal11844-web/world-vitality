import { can } from "@world-vitality/identity-service";
import { getWorkspaceMembership } from "../../lib/get-workspace-membership";
import { getAccountService } from "../../lib/account";
import { fetchFloodingLocations } from "../../lib/usgs-flood-impacts";
import { fetchNearbyShelters } from "../../lib/fema-shelters";
import { fetchActiveFireDetections } from "../../lib/nasa-firms";
import { logTelemetry, logSecurity } from "../../lib/logger";
import { GlobeShell } from "./globe-shell";
import type { GlobePin } from "./globe-viewer";

export const dynamic = "force-dynamic";

// Same shared demo location Disaster Monitoring's own page uses — see
// that page's own doc comment for why it's U.S.-only (National
// Weather Service has no coverage outside U.S. jurisdiction).
const DISASTER_MONITORING_DEMO_LOCATION = {
  latitude: 34.0522,
  longitude: -118.2437,
  stateCode: "CA",
};

/**
 * "God's Eye" global view — server-side data assembly (BUILD_PLAN
 * "STAGE — GOD'S EYE GLOBE VIEW", extended by "STAGE — GLOBE VIEW:
 * DISASTER MONITORING LAYERS"). Combines every real, point-located
 * resource this app tracks — Agriculture's fields, Insurance's
 * insured properties, Government & NGOs' monitored locations, and
 * Disaster Monitoring's flood/shelter/fire point data — into one flat
 * pin list for `GlobeViewer` to plot.
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
 * workspace. Getting this wrong would be a real permission bypass, not
 * a cosmetic bug — the exact category of gap the repo-wide security
 * audit (BUILD_PLAN v45) was written to catch. Disaster Monitoring's
 * three layers below need no equivalent filtering: that workspace has
 * no resource-scoped permission model of its own (its data is public
 * safety information, gated only by requiring a session to view the
 * workspace at all, same as its own home page) — see this stage's
 * BUILD_PLAN entry for the specific reasoning about why a fourth one
 * (Active Alerts) is deliberately NOT included below.
 *
 * **Disaster Monitoring's three point-based layers, each fetched
 * independently with its own try/catch — one source failing must never
 * take down the whole globe, matching the exact graceful-degradation
 * pattern `disaster-monitoring/page.tsx` itself already established for
 * these same four fetchers.** Flood and shelter data have no optional
 * configuration; fire detection requires the owner's own
 * `NASA_FIRMS_MAP_KEY` (this app can't self-register for one) — unlike
 * that workspace's own page, which shows an explicit "not configured"
 * state, the globe silently omits the fire layer entirely if unset,
 * since fires are one pin type among many here rather than a whole
 * dedicated section, and a missing-but-optional layer doesn't warrant
 * an error state on an overview page.
 *
 * **Deliberately NOT plotting individual Active Alerts as pins** — NWS
 * alerts (`NwsAlert`) cover polygonal warning *areas*, not points; they
 * carry no latitude/longitude of their own; the only "location" this
 * app has for one is the single query point used to look it up.
 * Plotting alerts as if they were point-specific pins would imply a
 * precision the data doesn't have — the same "never claim more
 * precision than what's real" discipline this app applies everywhere
 * else (e.g. `usgs-flood-impacts.ts`'s own provisional-data caveat).
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

  let floods: Awaited<ReturnType<typeof fetchFloodingLocations>> = [];
  try {
    floods = await fetchFloodingLocations(DISASTER_MONITORING_DEMO_LOCATION.stateCode);
  } catch (err) {
    logSecurity.error("globe_floods_fetch_failed", err);
  }

  let shelters: Awaited<ReturnType<typeof fetchNearbyShelters>> = [];
  try {
    shelters = await fetchNearbyShelters(
      DISASTER_MONITORING_DEMO_LOCATION.latitude,
      DISASTER_MONITORING_DEMO_LOCATION.longitude,
    );
  } catch (err) {
    logSecurity.error("globe_shelters_fetch_failed", err);
  }

  let fires: Awaited<ReturnType<typeof fetchActiveFireDetections>> = [];
  try {
    fires = await fetchActiveFireDetections(
      DISASTER_MONITORING_DEMO_LOCATION.latitude,
      DISASTER_MONITORING_DEMO_LOCATION.longitude,
    );
  } catch (err) {
    // Silently omitted if NASA_FIRMS_MAP_KEY just isn't configured —
    // see this function's own doc comment. Any other failure is still
    // logged, same as the other two layers above.
    if (!(err instanceof Error && err.message.includes("NASA_FIRMS_MAP_KEY"))) {
      logSecurity.error("globe_fires_fetch_failed", err);
    }
  }

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
    // Disaster Monitoring's three point-based layers — no
    // resource-scoped filtering needed, see this function's own doc
    // comment for why.
    ...floods
      .filter((f) => f.latitude !== null && f.longitude !== null)
      .map((f) => ({
        id: `disaster-monitoring-flood-${f.id}`,
        label: f.name,
        latitude: f.latitude as number,
        longitude: f.longitude as number,
        workspaceKey: "disaster-monitoring-flood",
        workspaceLabel: "Disaster Monitoring",
        href: "/workspaces/disaster-monitoring",
      })),
    ...shelters.map((s) => ({
      id: `disaster-monitoring-shelter-${s.id}`,
      label: s.name,
      latitude: s.latitude,
      longitude: s.longitude,
      workspaceKey: "disaster-monitoring-shelter",
      workspaceLabel: "Disaster Monitoring",
      href: "/workspaces/disaster-monitoring",
    })),
    ...fires.map((f, i) => ({
      id: `disaster-monitoring-fire-${i}`,
      label: `Fire detection (${f.confidence} confidence)`,
      latitude: f.latitude,
      longitude: f.longitude,
      workspaceKey: "disaster-monitoring-fire",
      workspaceLabel: "Disaster Monitoring",
      href: "/workspaces/disaster-monitoring",
    })),
  ];

  return <GlobeShell pins={pins} />;
}
