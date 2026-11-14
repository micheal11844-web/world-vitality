import { countryName, type GlobeFlood } from "@world-vitality/hazard-feeds";

/**
 * The place a flood event is named by, for a label or the details panel.
 *
 * GDACS names events in English ("Flood in India"). When the event touches one
 * country, that country's name comes from the browser in the person's own
 * language; otherwise GDACS's own country text, and last the event's name.
 */
export function floodPlace(
  flood: Pick<GlobeFlood, "countryCode" | "country" | "name">,
  locale: string,
): string {
  const local = flood.countryCode ? countryName(flood.countryCode, locale) : null;
  return local ?? flood.country ?? flood.name;
}
