/**
 * The data sources World Vitality reads from, with the licence facts the
 * team needs to see in one place (internal admin console, BUILD_PLAN "v87").
 *
 * This is a summary, not the source of truth: each entry points at its
 * provenance document in `docs/data-provenance/`, which is where the
 * licence reading and the known limitations are argued out. A test
 * (`__tests__/source-catalog.test.ts`) fails if a provenance document
 * exists without an entry here, or an entry has no document, so the two
 * cannot quietly drift apart.
 *
 * `commercialUse` exists so that "may we charge while using this source?"
 * is a question the code can answer instead of something to remember. Today
 * exactly one source answers "restricted": Open-Meteo's free tier is for
 * non-commercial use only (docs/data-provenance/open-meteo.md,
 * Decision #004). Charging for the product is the trigger the document
 * names.
 */

export type CommercialUse = "permitted" | "restricted";

export interface DataSourceInfo {
  /** Same as the file name in `docs/data-provenance/` (without `.md`). */
  id: string;
  name: string;
  /** What the app uses it for, in a line. */
  usedFor: string;
  licence: string;
  commercialUse: CommercialUse;
  /** Why, when `commercialUse` is `"restricted"`; optional context otherwise. */
  commercialNote?: string;
  /** An environment variable that must be set for the source to work. */
  requiresKeyEnv?: string;
  /**
   * An environment variable that, once set, means a paid plan with a
   * commercial licence is in use, lifting `commercialUse: "restricted"`.
   * `commercialUse` itself keeps describing the free tier, which is what the
   * provenance document argues about.
   */
  commercialKeyEnv?: string;
  /**
   * The id of a `DataIngestionConnector` whose `checkHealth()` can probe
   * this source, or `null` when the source is read directly by the app and
   * has no probe yet.
   */
  connectorId: string | null;
}

export const DATA_SOURCES: readonly DataSourceInfo[] = [
  {
    id: "nasa-power",
    name: "NASA POWER",
    usedFor: "Observed temperature, wind and solar figures for any place on Earth",
    licence: "CC BY 4.0 (attribution required)",
    commercialUse: "permitted",
    connectorId: "nasa-power",
  },
  {
    id: "open-meteo",
    name: "Open-Meteo",
    usedFor:
      "Seven-day forecasts in the Weather, Construction, Logistics, Renewable Energy and Research workspaces",
    licence: "CC BY 4.0 (attribution required)",
    commercialUse: "restricted",
    commercialNote:
      "The free tier is for non-commercial use only. Before charging for access, move to a paid Open-Meteo plan (and set OPEN_METEO_API_KEY) or replace this source.",
    commercialKeyEnv: "OPEN_METEO_API_KEY",
    connectorId: "open-meteo",
  },
  {
    id: "usgs-nwis-streamflow",
    name: "USGS streamflow gauges",
    usedFor: "River flow for the hydro asset type in Renewable Energy",
    licence: "Public domain (US government work)",
    commercialUse: "permitted",
    connectorId: "usgs-nwis-streamflow",
  },
  {
    id: "nws-active-alerts",
    name: "NWS active alerts",
    usedFor: "Official weather alerts: Disaster Monitoring and the Notification Center",
    licence: "Public domain (US government work)",
    commercialUse: "permitted",
    connectorId: null,
  },
  {
    id: "nasa-firms-fire-detections",
    name: "NASA FIRMS fire detections",
    usedFor: "Satellite fire detections on the Disaster Monitoring map and the globe",
    licence: "Public domain (US government work), citation requested",
    commercialUse: "permitted",
    requiresKeyEnv: "NASA_FIRMS_MAP_KEY",
    connectorId: null,
  },
  {
    id: "fema-hifld-shelters",
    name: "FEMA / HIFLD shelters",
    usedFor: "Emergency shelter locations on the Disaster Monitoring map and the globe",
    licence: "Public domain (US government work)",
    commercialUse: "permitted",
    connectorId: null,
  },
  {
    id: "usgs-flood-impact",
    name: "USGS flood impact",
    usedFor: "Flood-impact information alongside alerts in Disaster Monitoring",
    licence: "Public domain (US government work)",
    commercialUse: "permitted",
    connectorId: null,
  },
];

/**
 * May we charge while using this source, given how the app is configured?
 * A restricted source is lifted when its paid-plan key is present. Only
 * whether the key is set is looked at — never its value.
 */
export function effectiveCommercialUse(
  source: DataSourceInfo,
  env: Record<string, string | undefined> = process.env,
): CommercialUse {
  if (source.commercialUse === "permitted") return "permitted";
  return source.commercialKeyEnv && env[source.commercialKeyEnv]?.trim()
    ? "permitted"
    : "restricted";
}

/** Sources that must be dealt with before the product starts charging. */
export function sourcesRestrictingCommercialUse(
  env: Record<string, string | undefined> = process.env,
): DataSourceInfo[] {
  return DATA_SOURCES.filter((s) => effectiveCommercialUse(s, env) === "restricted");
}
