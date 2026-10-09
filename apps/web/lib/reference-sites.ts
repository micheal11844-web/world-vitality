import { NasaPowerConnector } from "@world-vitality/data-ingestion";

/**
 * Reference sites for the workspaces whose map pages have no real,
 * user-created resource table behind them (Weather & Climate,
 * Construction, Renewable Energy, Logistics & Shipping, Research,
 * Education). Agriculture, Insurance and Government & NGOs plot their
 * users' own fields/properties/locations; Disaster Monitoring plots
 * live hazard feeds. These six had one hardcoded demo point instead.
 *
 * This is a deliberate, honest middle step, not a claim of real
 * per-user data: a fixed, globally spread set of **sample** sites, each
 * with real NASA POWER readings, so the map shows genuine variation
 * (a hot, calm site next to a cold, windy one) instead of one dot. The
 * map itself labels them as sample sites. The first entry is the
 * "primary" site — the one the AI panel interprets, and the one the
 * workspace home pages already use as their demo location.
 *
 * Replacing this with real saved sites later (Construction sites,
 * Logistics waypoints, Education classrooms) means swapping the source
 * of the `ReferenceSite[]` — the map component and the fetch below
 * don't change.
 */
export interface ReferenceSite {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export const REFERENCE_SITES: readonly ReferenceSite[] = [
  { id: "ref-ibadan", name: "Ibadan, Nigeria", latitude: 7.3775, longitude: 3.947 },
  { id: "ref-nairobi", name: "Nairobi, Kenya", latitude: -1.2864, longitude: 36.8172 },
  { id: "ref-rotterdam", name: "Rotterdam, Netherlands", latitude: 51.9244, longitude: 4.4777 },
  { id: "ref-des-moines", name: "Des Moines, USA", latitude: 41.5868, longitude: -93.625 },
  { id: "ref-chennai", name: "Chennai, India", latitude: 13.0827, longitude: 80.2707 },
  { id: "ref-brisbane", name: "Brisbane, Australia", latitude: -27.4698, longitude: 153.0251 },
];

export type ReferenceParameter = "T2M" | "WS2M" | "GWETROOT";

/** Plain, serializable shape handed to the client map component. */
export interface SiteReading extends ReferenceSite {
  temperatureValue?: number;
  windValue?: number;
  moistureValue?: number;
}

type IngestedRecords = Awaited<ReturnType<NasaPowerConnector["ingest"]>>["records"];

export interface ReferenceSiteData {
  readings: SiteReading[];
  /** Records for the primary site only — what the AI panel interprets. */
  primaryRecords: IngestedRecords;
  /** Sites whose NASA POWER call failed; omitted from `readings`. */
  failedSites: number;
}

function latest(records: IngestedRecords, metric: string): number | undefined {
  return records
    .filter((r) => r.metric === metric)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0]?.value;
}

/**
 * Fetches the requested parameters for every reference site.
 *
 * One `NasaPowerConnector` call per site, in parallel — NOT one batched
 * call. Same correctness reason `getFieldStatus` documents: a batched
 * call returns one mixed `records` array and the interpretation
 * providers don't filter by location, so interpreting it would silently
 * blend sites together. A site whose call fails is dropped and counted
 * (`failedSites`) rather than failing the whole page or being shown
 * with a made-up value.
 */
export async function getReferenceSiteData(
  parameters: ReferenceParameter[],
  requestedBy: string,
): Promise<ReferenceSiteData> {
  const settled = await Promise.allSettled(
    REFERENCE_SITES.map(async (site) => {
      const connector = new NasaPowerConnector({
        locations: [{ id: site.id, latitude: site.latitude, longitude: site.longitude }],
        parameters,
        community: "AG",
        lookbackDays: 7,
      });
      const { records } = await connector.ingest({ type: "manual", requestedBy });
      return { site, records };
    }),
  );

  const readings: SiteReading[] = [];
  let primaryRecords: IngestedRecords = [];
  let failedSites = 0;

  settled.forEach((outcome, index) => {
    if (outcome.status === "rejected") {
      failedSites += 1;
      return;
    }
    const { site, records } = outcome.value;
    if (index === 0) primaryRecords = records;
    readings.push({
      ...site,
      temperatureValue: latest(records, "T2M"),
      windValue: latest(records, "WS2M"),
      moistureValue: latest(records, "GWETROOT"),
    });
  });

  return { readings, primaryRecords, failedSites };
}
