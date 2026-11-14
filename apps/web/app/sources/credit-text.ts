import type { MessageKey } from "@world-vitality/i18n";
import type { DataCreditGroup, DataCreditId } from "@world-vitality/hazard-feeds";

/**
 * The sentences that go with each credit on the "Data sources and credits"
 * page. A `Record` over `DataCreditId` on purpose: a source added to the
 * registry in `packages/hazard-feeds/src/data-credits.ts` does not compile
 * until it has a sentence here, and each key must exist in the English catalog
 * (and so, by the catalog's own type, in every other language).
 *
 * `use` says what the app uses the source for. `note` is the source's own
 * credit line or the caveat that must travel with its data, when there is one.
 */
export const CREDIT_TEXT: Record<DataCreditId, { use: MessageKey; note?: MessageKey }> = {
  "open-meteo": { use: "credits.use.open-meteo" },
  geonames: { use: "credits.use.geonames", note: "credits.note.geonames" },
  "nasa-power": { use: "credits.use.nasa-power", note: "credits.note.nasa-power" },
  nws: { use: "credits.use.nws", note: "credits.note.nws" },
  "nasa-firms": { use: "credits.use.nasa-firms", note: "credits.note.nasa-firms" },
  gdacs: { use: "credits.use.gdacs", note: "credits.note.gdacs" },
  "usgs-rtfi": { use: "credits.use.usgs-rtfi", note: "credits.note.usgs-rtfi" },
  "fema-shelters": { use: "credits.use.fema-shelters", note: "credits.note.fema-shelters" },
  openstreetmap: { use: "credits.use.openstreetmap", note: "credits.note.openstreetmap" },
  "natural-earth": { use: "credits.use.natural-earth", note: "credits.note.natural-earth" },
  cesium: { use: "credits.use.cesium" },
  maplibre: { use: "credits.use.maplibre" },
  "pwned-passwords": { use: "credits.use.pwned-passwords" },
};

export const CREDIT_GROUP_TITLE: Record<DataCreditGroup, MessageKey> = {
  weather: "credits.group.weather",
  hazards: "credits.group.hazards",
  maps: "credits.group.maps",
  security: "credits.group.security",
};
