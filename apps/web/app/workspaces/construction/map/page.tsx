import {
  ConstructionRiskStatusProvider,
  CONSTRUCTION_RISK_CAPABILITY_ID,
} from "@world-vitality/interpretation-engine";
import { WorkspaceShell } from "../workspace-shell";
import { getReferenceSiteData } from "../../../../lib/reference-sites";
import { MapView } from "./MapView";

export const dynamic = "force-dynamic";

/**
 * Construction's map page — a multi-marker map over the shared sample
 * reference sites (see `lib/reference-sites.ts`), each colored by its
 * own worst-of temperature/wind go / caution / no-go status. Still no
 * terrain or flood-risk layer (needs precipitation data not yet
 * ingested for this map). The AI panel interprets the primary site.
 */
export default async function ConstructionMapPage() {
  const { readings, primaryRecords, failedSites } = await getReferenceSiteData(
    ["T2M", "WS2M"],
    "construction-map-page",
  );
  const result = await new ConstructionRiskStatusProvider().interpret({
    capability: CONSTRUCTION_RISK_CAPABILITY_ID,
    records: primaryRecords,
  });

  return (
    <WorkspaceShell activeKey="map" aiInterpretation={result}>
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
