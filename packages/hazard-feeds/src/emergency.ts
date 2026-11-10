/**
 * Which number to offer for "call the fire service".
 *
 * A number is named for a place only when the country is known from a camera
 * provider the fire is close to; everywhere else the Globe offers `112`, which
 * mobile phones route to the local emergency service in most countries (and in
 * the US and Canada, where 911 is the number), and says so. A wrong number in
 * an emergency is worse than a general one, so there is no guessing a country
 * from coordinates.
 */
export interface EmergencyNumber {
  /** Digits only, for a `tel:` link. */
  number: string;
  /** `true` when the number is the national one for a country the app knows; `false` for the general fallback. */
  specific: boolean;
}

const BY_COUNTRY: Record<string, string> = {
  US: "911",
  CA: "911",
  GB: "999",
  AU: "000",
  FI: "112",
};

export function emergencyNumberFor(countryCode: string | null | undefined): EmergencyNumber {
  const number = countryCode ? BY_COUNTRY[countryCode.toUpperCase()] : undefined;
  return number ? { number, specific: true } : { number: "112", specific: false };
}

/** The numbers listed in the Globe's general guidance, for places the app has no camera country for. */
export const KNOWN_EMERGENCY_NUMBERS: readonly { countryCode: string; number: string }[] =
  Object.entries(BY_COUNTRY).map(([countryCode, number]) => ({ countryCode, number }));
