import { WorkspaceShell } from "../workspace-shell";
import { getReferenceSiteData } from "../../../../lib/reference-sites";
import { MapView } from "./MapView";
import { getWorkspaceRole } from "../../../../lib/get-workspace-role";

export const dynamic = "force-dynamic";

const WORKSPACE_ID = "education";

/**
 * Education's map page. PRD A.8 asks for "simplified, guided-exploration
 * map layers appropriate to age level" — still one plain-language
 * overlay toggle, no analytical controls (no confidence badges, no
 * multi-metric switching). It now shows how wet the ground is at several
 * places around the world, so a class can compare them. No personal or
 * student data anywhere on this page.
 */
export default async function EducationMapPage() {
  const role = await getWorkspaceRole(WORKSPACE_ID);
  const { readings, failedSites } = await getReferenceSiteData(["GWETROOT"], "education-map-page");

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
        <MapView sites={readings} failedSites={failedSites} />
      </div>
    </WorkspaceShell>
  );
}
