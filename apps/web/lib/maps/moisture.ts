import type { MessageKey } from "@world-vitality/i18n";

/**
 * The plain-language band for a soil-moisture reading (0–1), as a message
 * key — the same boundaries as `SoilMoistureStatusProvider` and the marker
 * colours, shared by the Agriculture, Insurance and Government & NGOs maps
 * so the words and the colours cannot drift apart.
 */
export function moistureLabelKey(value: number): MessageKey {
  if (value <= 0.2) return "map.moisture.veryDry";
  if (value <= 0.4) return "map.moisture.dry";
  if (value <= 0.6) return "map.moisture.moderate";
  if (value <= 0.8) return "map.moisture.moist";
  return "map.moisture.saturated";
}

/** A reading such as 0.15 with two decimals, in the reader's own numerals and decimal mark. */
export function formatReading(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
