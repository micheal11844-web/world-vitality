import {
  LogisticsRouteRiskProvider,
  LOGISTICS_ROUTE_RISK_CAPABILITY_ID,
} from "@world-vitality/interpretation-engine";
import { WorkspaceShell } from "../workspace-shell";
import { getReferenceSiteData } from "../../../../lib/reference-sites";
import { MapView } from "./MapView";

export const dynamic = "force-dynamic";

/**
 * Logistics & Shipping's map page — a multi-marker map over the shared
 * sample reference sites (see `lib/reference-sites.ts`), each colored by
 * its own latest route-risk band. Still not the PRD's multi-waypoint
 * route overlay with storm tracks and port status: these are
 * independent points, not connected routes. The AI panel interprets the
 * primary site.
 */
export default async function LogisticsMapPage() {
  const { readings, primaryRecords, failedSites } = await getReferenceSiteData(
    ["WS2M"],
    "logistics-map-page",
  );
  const result = await new LogisticsRouteRiskProvider().interpret({
    capability: LOGISTICS_ROUTE_RISK_CAPABILITY_ID,
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
