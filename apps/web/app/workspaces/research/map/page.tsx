import { WorkspaceShell } from "../workspace-shell";
import { getReferenceSiteData } from "../../../../lib/reference-sites";
import { MapView } from "./MapView";

export const dynamic = "force-dynamic";

/**
 * Research's map page. Unlike every other workspace's map, it shows the
 * **raw metric values themselves** in each marker's popup — no risk
 * band, no color-coded interpretation — per the PRD's "minimally
 * interpreted, maximally transparent" design for this workspace
 * (Section A.9). Now one marker per shared sample reference site (see
 * `lib/reference-sites.ts`) instead of a single point.
 */
export default async function ResearchMapPage() {
  const { readings, failedSites } = await getReferenceSiteData(
    ["T2M", "WS2M"],
    "research-map-page",
  );

  return (
    <WorkspaceShell activeKey="map">
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
