import { test } from "node:test";
import assert from "node:assert/strict";
import { offersForRegion, pricingRegion, regionNoteFor } from "../region.js";
import { offeredPrices } from "../prices.js";
import { planCodeKey, type PlanCodeMap } from "../paystack.js";

function codes(...keys: Array<[string, "NGN" | "USD", "monthly" | "annual"]>): PlanCodeMap {
  return new Map(
    keys.map(([plan, currency, interval]) => [
      planCodeKey(plan as "standard" | "premium", currency, interval),
      `PLN_${plan}_${currency}_${interval}`,
    ]),
  );
}

const NGN_ONLY = offeredPrices(
  codes(
    ["standard", "NGN", "monthly"],
    ["standard", "NGN", "annual"],
    ["premium", "NGN", "monthly"],
    ["premium", "NGN", "annual"],
  ),
);
const BOTH = offeredPrices(
  codes(
    ["standard", "NGN", "monthly"],
    ["premium", "NGN", "monthly"],
    ["standard", "USD", "monthly"],
    ["premium", "USD", "monthly"],
  ),
);
const USD_ONLY = offeredPrices(codes(["standard", "USD", "monthly"]));

const currencies = (list: readonly { currency: string }[]) =>
  Array.from(new Set(list.map((o) => o.currency)));

test("a country code is read in any case, with spaces, and only Nigeria is home", () => {
  assert.equal(pricingRegion("NG"), "nigeria");
  assert.equal(pricingRegion("ng"), "nigeria");
  assert.equal(pricingRegion(" Ng "), "nigeria");
  assert.equal(pricingRegion("US"), "abroad");
  assert.equal(pricingRegion("GH"), "abroad");
  assert.equal(pricingRegion("gb"), "abroad");
});

test("anything that is not a country code means the region is not known", () => {
  for (const value of [null, undefined, "", " ", "N", "NGA", "N1", "T1", "XX", "ZZ", "12", "N G"]) {
    assert.equal(pricingRegion(value as string | null | undefined), "unknown", String(value));
  }
});

test("Nigeria sees naira only; everywhere else sees dollars only", () => {
  assert.deepEqual(currencies(offersForRegion(BOTH, "NG")), ["NGN"]);
  assert.deepEqual(currencies(offersForRegion(BOTH, "US")), ["USD"]);
  assert.deepEqual(currencies(offersForRegion(BOTH, "de")), ["USD"]);
});

test("an unknown country is offered both, so the person chooses", () => {
  assert.deepEqual(currencies(offersForRegion(BOTH, null)), ["NGN", "USD"]);
  assert.deepEqual(currencies(offersForRegion(BOTH, "XX")), ["NGN", "USD"]);
  assert.equal(offersForRegion(BOTH, null).length, BOTH.length);
});

test("until USD plans exist, everyone keeps seeing naira (nothing changes)", () => {
  for (const country of ["NG", "US", "GB", null]) {
    assert.deepEqual(offersForRegion(NGN_ONLY, country), NGN_ONLY, String(country));
  }
});

test("a half-configured account still sells: no list is ever emptied", () => {
  assert.deepEqual(currencies(offersForRegion(USD_ONLY, "NG")), ["USD"]);
  assert.equal(offersForRegion(USD_ONLY, "NG").length, USD_ONLY.length);
  assert.deepEqual(offersForRegion([], "NG"), []);
  assert.deepEqual(offersForRegion([], null), []);
});

test("the filter keeps every plan and interval of the chosen currency", () => {
  const ngn = offersForRegion(BOTH, "NG");
  assert.equal(ngn.length, BOTH.filter((o) => o.currency === "NGN").length);
  for (const o of ngn) assert.ok(BOTH.includes(o), "the very same offer objects");
});

test("the input list is never changed", () => {
  const before = JSON.stringify(BOTH);
  offersForRegion(BOTH, "NG");
  offersForRegion(BOTH, null);
  assert.equal(JSON.stringify(BOTH), before);
});

test("the screen is told about the region only when it really chose the currency", () => {
  assert.equal(regionNoteFor(BOTH, "NG"), "nigeria");
  assert.equal(regionNoteFor(BOTH, "FR"), "abroad");
  assert.equal(regionNoteFor(BOTH, null), null);
  assert.equal(regionNoteFor(NGN_ONLY, "NG"), null, "no dollars to compare with");
  assert.equal(regionNoteFor(NGN_ONLY, "US"), null);
  assert.equal(regionNoteFor(USD_ONLY, "NG"), null);
});
