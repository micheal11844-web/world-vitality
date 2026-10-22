import {
  NasaPowerConnector,
  OpenMeteoConnector,
  UsgsStreamflowConnector,
  DATA_SOURCES,
  type DataIngestionConnector,
} from "@world-vitality/data-ingestion";
import type { SourceCheckView } from "./admin-types";

/** How long one probe may take before it counts as not responding. */
export const PROBE_TIMEOUT_MS = 10_000;

/**
 * One fixed, neutral place for the probes — Greenwich, London — so a
 * check never depends on any customer's data. The USGS probe uses the same
 * long-running Potomac gauge the Renewable Energy demo uses.
 */
const PROBE_LOCATION = {
  id: "admin-probe",
  latitude: 51.4779,
  longitude: -0.0015,
  label: "Greenwich",
};
const PROBE_STATION = {
  id: "potomac-little-falls",
  siteNumber: "01646500",
  latitude: 38.94974,
  longitude: -77.12786,
};

/** The connectors that have a `checkHealth()`, keyed by their catalogue connector id. */
function probeConnectors(): Record<string, DataIngestionConnector> {
  const connectors: DataIngestionConnector[] = [
    new NasaPowerConnector({
      locations: [PROBE_LOCATION],
      parameters: ["T2M"],
      community: "AG",
      lookbackDays: 3,
    }),
    new OpenMeteoConnector({ locations: [PROBE_LOCATION], forecastDays: 1 }),
    new UsgsStreamflowConnector({ stations: [PROBE_STATION] }),
  ];
  return Object.fromEntries(connectors.map((c) => [c.id, c]));
}

async function probe(
  connector: DataIngestionConnector,
  sourceId: string,
): Promise<SourceCheckView> {
  const started = Date.now();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeout = new Promise<{ healthy: false; detail: string }>((resolve) => {
      timer = setTimeout(
        () =>
          resolve({
            healthy: false,
            detail: `No answer within ${PROBE_TIMEOUT_MS / 1000} seconds.`,
          }),
        PROBE_TIMEOUT_MS,
      );
    });
    const result = await Promise.race([connector.checkHealth(), timeout]);
    return {
      id: sourceId,
      healthy: result.healthy,
      detail: result.detail ?? null,
      milliseconds: Date.now() - started,
    };
  } catch (err) {
    return {
      id: sourceId,
      healthy: false,
      detail: err instanceof Error ? err.message : String(err),
      milliseconds: Date.now() - started,
    };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Runs every available probe at once. Sources with no connector are not included. */
export async function runSourceChecks(): Promise<SourceCheckView[]> {
  const connectors = probeConnectors();
  const probes = DATA_SOURCES.flatMap((source) => {
    const connector = source.connectorId ? connectors[source.connectorId] : undefined;
    return connector ? [probe(connector, source.id)] : [];
  });
  return Promise.all(probes);
}
