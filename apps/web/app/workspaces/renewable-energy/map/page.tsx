import {
  WindGenerationStatusProvider,
  WIND_GENERATION_STATUS_CAPABILITY_ID,
} from "@world-vitality/interpretation-engine";
import { WorkspaceShell } from "../workspace-shell";
import { getReferenceSiteData } from "../../../../lib/reference-sites";
import { MapView } from "./MapView";

export const dynamic = "force-dynamic";

/**
 * Renewable Energy's map page — a multi-marker map over the shared
 * sample reference sites (see `lib/reference-sites.ts`), each colored by
 * its own latest wind-generation band, so wind-resource variation
 * across regions is visible at a glance. The AI panel interprets the
 * primary site. Still not the PRD's multi-year siting/feasibility map.
 */
export default async function RenewableEnergyMapPage() {
  const { readings, primaryRecords, failedSites } = await getReferenceSiteData(
    ["WS2M"],
    "renewable-energy-map-page",
  );
  const result = await new WindGenerationStatusProvider().interpret({
    capability: WIND_GENERATION_STATUS_CAPABILITY_ID,
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
