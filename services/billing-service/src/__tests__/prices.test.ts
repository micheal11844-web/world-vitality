import { test } from "node:test";
import assert from "node:assert/strict";
import { PAID_PLAN_IDS } from "../plans.js";
import {
  ANNUAL_MONTHS_CHARGED,
  PLAN_PRICES,
  PRICE_CURRENCIES,
  formatPrice,
  priceMinor,
} from "../prices.js";

test("a year costs ten months, in every plan and currency", () => {
  for (const plan of PAID_PLAN_IDS) {
    for (const currency of PRICE_CURRENCIES) {
      const { monthly, annual } = PLAN_PRICES[plan][currency];
      assert.equal(annual, monthly * ANNUAL_MONTHS_CHARGED, `${plan} ${currency}`);
    }
  }
});

test("Premium costs more than Standard everywhere", () => {
  for (const currency of PRICE_CURRENCIES) {
    for (const interval of ["monthly", "annual"] as const) {
      assert.ok(
        priceMinor("premium", currency, interval) > priceMinor("standard", currency, interval),
        `${currency} ${interval}`,
      );
    }
  }
});

test("every price is a positive whole number of minor units", () => {
  for (const plan of PAID_PLAN_IDS) {
    for (const currency of PRICE_CURRENCIES) {
      for (const interval of ["monthly", "annual"] as const) {
        const value = priceMinor(plan, currency, interval);
        assert.ok(Number.isInteger(value) && value > 0);
      }
    }
  }
});

test("prices are written the way people read them", () => {
  assert.equal(formatPrice(priceMinor("standard", "NGN", "monthly"), "NGN"), "₦7,500");
  assert.equal(formatPrice(priceMinor("standard", "NGN", "annual"), "NGN"), "₦75,000");
  assert.equal(formatPrice(priceMinor("premium", "NGN", "monthly"), "NGN"), "₦25,000");
  assert.equal(formatPrice(priceMinor("premium", "NGN", "annual"), "NGN"), "₦250,000");
  assert.equal(formatPrice(priceMinor("standard", "USD", "monthly"), "USD"), "$9");
  assert.equal(formatPrice(priceMinor("premium", "USD", "annual"), "USD"), "$290");
  assert.equal(formatPrice(1250, "USD"), "$12.50");
});
