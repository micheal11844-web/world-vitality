import { NasaPowerConnector } from "@world-vitality/data-ingestion";
import { WorkspaceShell } from "../workspace-shell";
import { MapView } from "./MapView";
import { getWorkspaceRole } from "../../../../lib/get-workspace-role";

export const dynamic = "force-dynamic";

const WORKSPACE_ID = "education";
const DEMO_LOCATION = { id: "demo-classroom-location-1", latitude: 7.3775, longitude: 3.947 };

async function getCurrentMoisture() {
  const connector = new NasaPowerConnector({
    locations: [DEMO_LOCATION],
    parameters: ["GWETROOT"],
    community: "AG",
    lookbackDays: 7,
  });
  const { records } = await connector.ingest({
    type: "manual",
    requestedBy: "education-map-page",
  });
  const latest = records
    .filter((r) => r.metric === "GWETROOT")
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
  return latest?.value;
}

/**
 * Education's map page (BUILD_PLAN "STAGE — EDUCATION WORKSPACE"). PRD
 * A.8 asks for "simplified, guided-exploration map layers appropriate
 * to age level" — this is one demo point, one plain-language overlay
 * toggle, no analytical controls beyond that (no confidence badges, no
 * multi-metric switching) — deliberately simpler than every other
 * workspace's map, in keeping with the PRD's ask, not a cut corner. No
 * personal or student data anywhere on this page.
 */
export default async function EducationMapPage() {
  const role = await getWorkspaceRole(WORKSPACE_ID);
  const moistureValue = await getCurrentMoisture();

  return (
    <WorkspaceShell activeKey="map" role={role}>
      <div
        style={{
          height: "100%",
          minHeight: "32rem",
          borderRadius: "var(--wv-radius-md)",
          overflow: "hidden",
        }}
      >
        <MapView
          latitude={DEMO_LOCATION.latitude}
          longitude={DEMO_LOCATION.longitude}
          moistureValue={moistureValue}
        />
      </div>
    </WorkspaceShell>
  );
}
