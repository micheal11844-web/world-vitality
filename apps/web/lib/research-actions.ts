"use server";

import { NasaPowerConnector, OpenMeteoConnector } from "@world-vitality/data-ingestion";
import type { NormalizedDataRecord, IngestionGap } from "@world-vitality/data-schemas";
import { logSecurity } from "./logger";

export type DatasetSource = "nasa-power" | "open-meteo";

export interface DatasetQuery {
  source: DatasetSource;
  /** Only meaningful for `nasa-power` — `open-meteo` always fetches both
   *  metrics together (see `OpenMeteoConnector`'s doc comment on why:
   *  it's a single daily-forecast request, not per-parameter). Ignored,
   *  not rejected, when the source is `open-meteo`. */
  metrics: Array<"T2M" | "WS2M">;
}

export interface DatasetQueryResult {
  ok: boolean;
  error?: string;
  records?: NormalizedDataRecord[];
  gaps?: IngestionGap[];
}

// Same single demo location every workspace uses — see Agriculture's
// home page comment for why (no real user-configured saved locations
// exist yet). Research's own "sign-up captures research
// affiliation/purpose" journey (PRD Section A.9) isn't built either.
const DEMO_LOCATION = { id: "demo-location-1", latitude: 7.3775, longitude: 3.947 };

/**
 * Server Action backing `app/workspaces/research/page.tsx`'s Dataset
 * Explorer. Deliberately thin — it calls the exact same connectors
 * every other workspace already uses (`NasaPowerConnector`,
 * `OpenMeteoConnector`), unmodified, and returns their raw
 * `NormalizedDataRecord`s (full `provenance` intact) straight through.
 * No `InterpretationProvider` sits in front of this data — see
 * `workspace-shell.tsx`'s doc comment for why that's a deliberate
 * choice specific to this workspace, not a gap.
 */
export async function fetchDatasetAction(query: DatasetQuery): Promise<DatasetQueryResult> {
  try {
    if (query.source === "nasa-power") {
      const parameters = query.metrics.length > 0 ? query.metrics : ["T2M", "WS2M"];
      const connector = new NasaPowerConnector({
        locations: [DEMO_LOCATION],
        parameters,
        community: "AG",
        lookbackDays: 7,
      });
      const { records, gaps } = await connector.ingest({
        type: "manual",
        requestedBy: "research-dataset-explorer",
      });
      return { ok: true, records, gaps };
    }

    const connector = new OpenMeteoConnector({ locations: [DEMO_LOCATION], forecastDays: 7 });
    const { records, gaps } = await connector.ingest({
      type: "manual",
      requestedBy: "research-dataset-explorer",
    });
    return { ok: true, records, gaps };
  } catch (err) {
    logSecurity.error("research_dataset_fetch_failed", err, { source: query.source });
    return { ok: false, error: "Couldn't fetch that dataset. Please try again." };
  }
}
