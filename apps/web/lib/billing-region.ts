import { headers } from "next/headers";
import { offersForRegion, regionNoteFor, type OfferedPrice } from "@world-vitality/billing-service";
import { getOfferedPrices } from "./billing";

/**
 * The country the current request appears to come from, as Vercel reports it
 * (`x-vercel-ip-country`, a two-letter ISO 3166-1 code). `null` when the
 * header is absent — local development, or any host that is not Vercel — and
 * the pricing rules then treat the region as unknown and offer both
 * currencies. Only meaningful inside a request (a page or a Server Action).
 */
export async function getRequestCountry(): Promise<string | null> {
  return (await headers()).get("x-vercel-ip-country");
}

/**
 * What this visitor can buy: the plans that exist, narrowed to the currency
 * their country is priced in (Decision-Log #037). The billing page lists
 * these and `startCheckoutAction` refuses anything else, so the screen and
 * the server cannot disagree.
 */
export async function getOffersForRequest(): Promise<{
  offers: OfferedPrice[];
  regionNote: "nigeria" | "abroad" | null;
}> {
  const country = await getRequestCountry();
  const all = getOfferedPrices();
  const offers = offersForRegion(all, country);
  return { offers, regionNote: regionNoteFor(all, country) };
}
