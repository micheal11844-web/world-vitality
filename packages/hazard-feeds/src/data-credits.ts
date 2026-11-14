/**
 * Every outside source of data, maps or software the app shows or relies on,
 * with the link and licence the public "Data sources and credits" page prints.
 *
 * This is the one list. The page is built from it (so nothing can be shown
 * there that is not here) and camera agencies are added from `CAMERA_PROVIDERS`
 * (so a camera feed cannot be switched on without its credit appearing). The
 * wording that goes with each entry is translated in the web app, which holds a
 * `Record<DataCreditId, …>` over these ids: adding an id here fails the build
 * until its sentences exist in every language.
 *
 * **What a licence line means.** Only terms read from the source's own pages are
 * written down. A source whose terms say nothing about reuse (GDACS, NASA POWER)
 * has no `licence` here and is credited by name and link only; see
 * `docs/runbooks/data-credits.md` for what was read and what is still open.
 *
 * **Open-Meteo is the one with a hard rule.** Its free licence (CC BY 4.0)
 * requires "a link next to any location Open-Meteo data are displayed", so
 * `OPEN_METEO_CREDIT_URL` is what every forecast card links to.
 */

export type DataCreditGroup = "weather" | "hazards" | "maps" | "security";

export type DataCreditId =
  | "open-meteo"
  | "geonames"
  | "nasa-power"
  | "nws"
  | "nasa-firms"
  | "gdacs"
  | "usgs-rtfi"
  | "fema-shelters"
  | "openstreetmap"
  | "natural-earth"
  | "cesium"
  | "maplibre"
  | "pwned-passwords";

export interface DataCredit {
  id: DataCreditId;
  group: DataCreditGroup;
  /** A proper name: shown as written in every language. */
  name: string;
  url: string;
  /** Present only when the source's own pages state a licence. */
  licence?: { name: string; url: string };
}

/** Where "Weather data by Open-Meteo.com" must link (their terms ask for this exact destination). */
export const OPEN_METEO_CREDIT_URL = "https://open-meteo.com/";
export const GEONAMES_CREDIT_URL = "https://www.geonames.org/";

const CC_BY_4 = { name: "CC BY 4.0", url: "https://creativecommons.org/licenses/by/4.0/" };

/** The order the page lists the groups in. */
export const DATA_CREDIT_GROUPS: readonly DataCreditGroup[] = [
  "weather",
  "hazards",
  "maps",
  "security",
];

export const DATA_CREDITS: Record<DataCreditId, DataCredit> = {
  "open-meteo": {
    id: "open-meteo",
    group: "weather",
    name: "Open-Meteo.com",
    url: OPEN_METEO_CREDIT_URL,
    licence: CC_BY_4,
  },
  geonames: {
    id: "geonames",
    group: "weather",
    name: "GeoNames",
    url: GEONAMES_CREDIT_URL,
    licence: CC_BY_4,
  },
  "nasa-power": {
    id: "nasa-power",
    group: "weather",
    name: "NASA POWER",
    url: "https://power.larc.nasa.gov/",
  },
  nws: {
    id: "nws",
    group: "weather",
    name: "U.S. National Weather Service",
    url: "https://www.weather.gov/documentation/services-web-api",
  },
  "nasa-firms": {
    id: "nasa-firms",
    group: "hazards",
    name: "NASA FIRMS",
    url: "https://firms.modaps.eosdis.nasa.gov/",
  },
  gdacs: {
    id: "gdacs",
    group: "hazards",
    name: "GDACS",
    url: "https://www.gdacs.org/",
  },
  "usgs-rtfi": {
    id: "usgs-rtfi",
    group: "hazards",
    name: "USGS Real-Time Flood Impact",
    url: "https://www.usgs.gov/",
  },
  "fema-shelters": {
    id: "fema-shelters",
    group: "hazards",
    name: "FEMA National Shelter System",
    url: "https://www.fema.gov/",
  },
  openstreetmap: {
    id: "openstreetmap",
    group: "maps",
    name: "OpenStreetMap",
    url: "https://www.openstreetmap.org/copyright",
    licence: { name: "ODbL 1.0", url: "https://opendatacommons.org/licenses/odbl/1-0/" },
  },
  "natural-earth": {
    id: "natural-earth",
    group: "maps",
    name: "Natural Earth",
    url: "https://www.naturalearthdata.com/",
    licence: {
      name: "Public domain",
      url: "https://www.naturalearthdata.com/about/terms-of-use/",
    },
  },
  cesium: {
    id: "cesium",
    group: "maps",
    name: "CesiumJS",
    url: "https://cesium.com/platform/cesiumjs/",
    licence: { name: "Apache 2.0", url: "https://www.apache.org/licenses/LICENSE-2.0" },
  },
  maplibre: {
    id: "maplibre",
    group: "maps",
    name: "MapLibre GL JS",
    url: "https://maplibre.org/",
    licence: { name: "BSD 3-Clause", url: "https://opensource.org/license/bsd-3-clause" },
  },
  "pwned-passwords": {
    id: "pwned-passwords",
    group: "security",
    name: "Have I Been Pwned: Pwned Passwords",
    url: "https://haveibeenpwned.com/Passwords",
  },
};

export const DATA_CREDIT_IDS = Object.keys(DATA_CREDITS) as DataCreditId[];

/** The credits of one group, in the order they are declared above. */
export function dataCreditsInGroup(group: DataCreditGroup): DataCredit[] {
  return DATA_CREDIT_IDS.map((id) => DATA_CREDITS[id]).filter((credit) => credit.group === group);
}
