import { NasaPowerConnector } from "@world-vitality/data-ingestion";
import {
  ConstructionRiskStatusProvider,
  CONSTRUCTION_RISK_CAPABILITY_ID,
} from "@world-vitality/interpretation-engine";
import { WorkspaceShell } from "../workspace-shell";
import { MapView } from "./MapView";

export const dynamic = "force-dynamic";

// Same demo-location coordinates as the Construction home page,
// Agriculture, and Weather & Climate — see the home page's comment for
// why (no real user-configured saved sites exist yet).
const DEMO_LOCATION = { id: "demo-location-1", latitude: 7.3775, longitude: 3.947 };

async function getSiteRiskData() {
  const connector = new NasaPowerConnector({
    locations: [DEMO_LOCATION],
    parameters: ["T2M", "WS2M"],
    community: "AG",
    lookbackDays: 7,
  });
  const { records } = await connector.ingest({
    type: "manual",
    requestedBy: "construction-map-page",
  });
  const provider = new ConstructionRiskStatusProvider();
  const result = await provider.interpret({
    capability: CONSTRUCTION_RISK_CAPABILITY_ID,
    records,
  });

  const latestTemp = records
    .filter((r) => r.metric === "T2M")
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
  const latestWind = records
    .filter((r) => r.metric === "WS2M")
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];

  return { result, temperatureValue: latestTemp?.value, windValue: latestWind?.value };
}

/**
 * Construction's map page (BUILD_PLAN Stage 12). Structurally identical
 * to Agriculture's and Weather & Climate's map pages — same "base layers
 * + one data overlay" honest scope (BUILD_PLAN 6.4's narrow-scope
 * precedent), not the PRD's full "site-level weather and terrain/flood-
 * risk overlay" vision. No terrain/flood-risk layer exists — flagged,
 * not silently omitted (same gap noted in the interpretation provider's
 * doc comment: needs precipitation data not yet ingested).
 */
export default async function ConstructionMapPage() {
  const { result, temperatureValue, windValue } = await getSiteRiskData();

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
        <MapView
          latitude={DEMO_LOCATION.latitude}
          longitude={DEMO_LOCATION.longitude}
          temperatureValue={temperatureValue}
          windValue={windValue}
        />
      </div>
    </WorkspaceShell>
  );
}
