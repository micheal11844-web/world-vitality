import type { PaidPlanId } from "./plans.js";
import { planCodeKey, type Currency, type Interval, type PlanCodeMap } from "./paystack.js";
import { PAID_PLAN_IDS } from "./plans.js";

/**
 * The list prices (BUILD_PLAN "v94"; Decision-Log #020), in the currency's
 * smallest unit (kobo / cents) so no floating point is ever involved.
 *
 * **Reference only — Paystack is the authority on what is charged.** The
 * amount a customer pays is the amount on the Paystack plan you create in
 * the dashboard (see docs/runbooks/billing.md, "Create the plans"); this
 * table is what that guide tells you to type, what a pricing page would
 * show, and what the tests hold to the rules below. If you change a price
 * here, change the Paystack plan too (a Paystack plan's amount can be
 * edited, and existing subscribers keep the old amount until they renew
 * on the new plan — check Paystack's current behaviour first).
 *
 * Rules the tests hold:
 *  - a year costs 10 months (two months free) — the one discount offered;
 *  - Premium costs more than Standard, in every currency and interval;
 *  - NGN is what Nigerian customers pay, and is set for local purchasing
 *    power rather than converted from USD; USD (for customers paying from
 *    abroad) is only sold once a USD plan code is configured, which needs
 *    USD enabled on the Paystack account.
 *
 * Prices are shown and charged tax-inclusive. Whether VAT must be added
 * on top is a question for an accountant (it depends on registration), and
 * if it must, these are the numbers to revisit.
 */
export const ANNUAL_MONTHS_CHARGED = 10;

export const PRICE_CURRENCIES: readonly Currency[] = ["NGN", "USD"];

export const PLAN_PRICES: Record<PaidPlanId, Record<Currency, Record<Interval, number>>> = {
  standard: {
    NGN: { monthly: 750_000, annual: 7_500_000 }, //  ₦7,500 / ₦75,000
    USD: { monthly: 900, annual: 9_000 }, //            $9 / $90
  },
  premium: {
    NGN: { monthly: 2_500_000, annual: 25_000_000 }, // ₦25,000 / ₦250,000
    USD: { monthly: 2_900, annual: 29_000 }, //         $29 / $290
  },
};

export function priceMinor(plan: PaidPlanId, currency: Currency, interval: Interval): number {
  return PLAN_PRICES[plan][currency][interval];
}

const SYMBOLS: Record<Currency, string> = { NGN: "₦", USD: "$" };

/** `750000, "NGN"` → `₦7,500`. Whole units only; every list price is a whole number. */
export function formatPrice(minor: number, currency: Currency): string {
  const major = Math.round(minor) / 100;
  const digits = Number.isInteger(major) ? 0 : 2;
  return `${SYMBOLS[currency]}${major.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

export interface OfferedPrice {
  plan: PaidPlanId;
  currency: Currency;
  interval: Interval;
  /** Smallest currency unit, from the list prices above. */
  amountMinor: number;
}

/**
 * The prices that can actually be bought right now: only the combinations
 * with a Paystack plan code configured. The screen shows exactly these —
 * a price with no plan behind it is never advertised, and that is how USD
 * stays hidden until its plans exist.
 */
export function offeredPrices(codes: PlanCodeMap): OfferedPrice[] {
  const out: OfferedPrice[] = [];
  for (const plan of PAID_PLAN_IDS) {
    for (const currency of PRICE_CURRENCIES) {
      for (const interval of ["monthly", "annual"] as const) {
        if (codes.has(planCodeKey(plan, currency, interval))) {
          out.push({ plan, currency, interval, amountMinor: priceMinor(plan, currency, interval) });
        }
      }
    }
  }
  return out;
}
