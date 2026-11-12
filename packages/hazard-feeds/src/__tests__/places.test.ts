import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CITY_PLACES,
  CITY_VISIBLE_M,
  COUNTRY_PLACES,
  COUNTRY_VISIBLE_M,
  countryName,
} from "../places.js";

test("every country has a unique two-letter code, a point on Earth and a known tier", () => {
  const seen = new Set<string>();
  for (const [code, longitude, latitude, tier] of COUNTRY_PLACES) {
    assert.match(code, /^[A-Z]{2}$/);
    assert.ok(!seen.has(code), `${code} is listed twice`);
    seen.add(code);
    assert.ok(longitude >= -180 && longitude <= 180, `${code} longitude`);
    assert.ok(latitude >= -90 && latitude <= 90, `${code} latitude`);
    assert.ok(tier === 0 || tier === 1 || tier === 2, `${code} tier`);
  }
  assert.ok(COUNTRY_PLACES.length >= 170);
});

test("every country code has a name in English", () => {
  for (const [code] of COUNTRY_PLACES) {
    const name = countryName(code, "en");
    assert.ok(name, `${code} has no English name`);
    assert.notEqual(name, "Unknown Region", `${code} is not a country code`);
  }
});

test("country names follow the person's language", () => {
  assert.equal(countryName("ES", "en"), "Spain");
  assert.equal(countryName("ES", "es"), "España");
  assert.equal(countryName("ES", "fr"), "Espagne");
  assert.equal(countryName("NG", "en"), "Nigeria");
  assert.match(countryName("NG", "ar") ?? "", /\p{Script=Arabic}/u);
  assert.equal(countryName("XK", "en"), "Kosovo");
});

test("a code or a language the browser does not know gives no name, never a bare code", () => {
  assert.equal(countryName("QQ", "en"), null);
  assert.equal(countryName("NG", "not a language!"), null);
});

test("cities are unique, on Earth, and include the places people here care about", () => {
  const seen = new Set<string>();
  for (const [name, longitude, latitude, tier] of CITY_PLACES) {
    const key = `${name}@${Math.round(longitude)},${Math.round(latitude)}`;
    assert.ok(!seen.has(key), `${key} is listed twice`);
    seen.add(key);
    assert.ok(name.length > 0 && name.length <= 40, name);
    assert.ok(longitude >= -180 && longitude <= 180, `${name} longitude`);
    assert.ok(latitude >= -90 && latitude <= 90, `${name} latitude`);
    assert.ok(tier === 0 || tier === 1 || tier === 2, `${name} tier`);
  }
  const names = new Set(CITY_PLACES.map(([name]) => name));
  for (const wanted of ["Lagos", "Abuja", "Kano", "Ibadan", "Port Harcourt", "Nairobi", "London"]) {
    assert.ok(names.has(wanted), `${wanted} is missing`);
  }
});

test("Lagos is where Lagos is, and among the first cities to be named", () => {
  const lagos = CITY_PLACES.find(([name]) => name === "Lagos");
  assert.ok(lagos);
  assert.ok(Math.abs(lagos[1] - 3.4) < 0.3 && Math.abs(lagos[2] - 6.45) < 0.3);
  assert.equal(lagos[3], 0);
});

test("the first tier is a short list, so a continent-sized view stays readable", () => {
  const first = CITY_PLACES.filter(([, , , tier]) => tier === 0).length;
  assert.ok(first >= 30 && first <= 80, `${first} first-tier cities`);
});

test("closer tiers reach less far, and every range is a real range", () => {
  for (const table of [COUNTRY_VISIBLE_M, CITY_VISIBLE_M]) {
    assert.ok(table[0].far > table[1].far && table[1].far > table[2].far);
    for (const tier of [0, 1, 2] as const) {
      assert.ok(table[tier].near >= 0 && table[tier].near < table[tier].far);
    }
  }
  // City names never take over the whole-Earth view from the country names.
  assert.ok(CITY_VISIBLE_M[0].far < COUNTRY_VISIBLE_M[0].far);
});
