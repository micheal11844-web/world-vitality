import type { Currency } from "./paystack.js";

/**
 * Which currency a visitor is shown, decided by the country they connect
 * from (Decision-Log #037).
 *
 *  - Nigeria → naira (₦). Priced for local purchasing power, not converted.
 *  - Anywhere else → US dollars ($), **but only once USD plans exist** (a
 *    Paystack plan code is configured for them, which needs international
 *    payments switched on in the Paystack dashboard). Until then everyone
 *    keeps seeing naira, exactly as before — a visitor is never shown a
 *    price that cannot be bought.
 *  - Country not known (no header, local development, a value that is not a
 *    country code) → both are offered and the person picks; naira is the
 *    default. Guessing wrong in either direction would be worse than asking.
 *
 * **This is a pricing convenience, not an identity check.** The country is
 * where the connection appears to come from (Vercel's `x-vercel-ip-country`),
 * so a VPN or a Nigerian travelling abroad lands in the other group. Nothing
 * here claims otherwise, and a customer's bank handles the currency of their
 * card either way — Paystack charges the plan's own currency.
 *
 * Pure functions only, so the rule is tested without a server.
 */

export type PricingRegion = "nigeria" | "abroad" | "unknown";

/** ISO 3166-1 alpha-2 code of the home market, the one place naira is shown. */
export const HOME_COUNTRY = "NG";

/**
 * Codes that look like a country but say "I could not tell" (some networks
 * use `XX`; `T1` is Tor on Cloudflare-style headers and has a digit, so the
 * shape check already rejects it).
 */
const NOT_A_COUNTRY = new Set(["XX", "ZZ"]);

export function pricingRegion(country: string | null | undefined): PricingRegion {
  if (typeof country !== "string") return "unknown";
  const code = country.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code) || NOT_A_COUNTRY.has(code)) return "unknown";
  return code === HOME_COUNTRY ? "nigeria" : "abroad";
}

/**
 * The offers a visitor from `country` may buy. Never returns an empty list
 * when the input had offers: if the preferred currency has no plans, the
 * other one is offered rather than nothing, so a half-configured account
 * still sells.
 */
export function offersForRegion<T extends { currency: Currency }>(
  offers: readonly T[],
  country: string | null | undefined,
): T[] {
  const region = pricingRegion(country);
  if (region === "unknown") return [...offers];
  const preferred: Currency = region === "nigeria" ? "NGN" : "USD";
  const matching = offers.filter((o) => o.currency === preferred);
  return matching.length > 0 ? matching : [...offers];
}

/**
 * What the billing screen should tell the visitor about the currency they
 * were shown: `"nigeria"` / `"abroad"` when their country decided it (and
 * the other currency exists, so the choice was real), otherwise `null`.
 */
export function regionNoteFor(
  offers: readonly { currency: Currency }[],
  country: string | null | undefined,
): "nigeria" | "abroad" | null {
  const region = pricingRegion(country);
  if (region === "unknown") return null;
  const offered = new Set(offers.map((o) => o.currency));
  if (!offered.has("NGN") || !offered.has("USD")) return null;
  return region;
}
