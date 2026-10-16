import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_LOCALE,
  LOCALES,
  isLocaleCode,
  localeDirection,
  matchLocale,
  negotiateLocale,
  parseAcceptLanguage,
} from "../locales.js";

test("English is the source language and the default", () => {
  assert.equal(DEFAULT_LOCALE, "en");
  assert.equal(LOCALES.find((l) => l.code === "en")?.review, "source");
});

test("only English is ever unmarked: every other language starts as a draft", () => {
  for (const l of LOCALES) {
    if (l.code !== "en") assert.equal(l.review, "draft", `${l.code} must be flagged as unreviewed`);
  }
});

test("Arabic is right-to-left; the rest are left-to-right", () => {
  assert.equal(localeDirection("ar"), "rtl");
  for (const code of ["en", "es", "fr", "pt"] as const) assert.equal(localeDirection(code), "ltr");
});

test("isLocaleCode only accepts supported codes", () => {
  assert.ok(isLocaleCode("es"));
  assert.ok(!isLocaleCode("de"));
  assert.ok(!isLocaleCode("ES"));
  assert.ok(!isLocaleCode(undefined));
  assert.ok(!isLocaleCode(5));
});

test("parseAcceptLanguage orders by q, drops q=0 and wildcards, survives junk", () => {
  assert.deepEqual(parseAcceptLanguage("fr;q=0.5, es-MX, en;q=0.8"), ["es-MX", "en", "fr"]);
  assert.deepEqual(parseAcceptLanguage("de;q=0, *;q=0.1, pt-BR"), ["pt-BR"]);
  assert.deepEqual(parseAcceptLanguage("en;q=abc"), []);
  assert.deepEqual(parseAcceptLanguage(""), []);
  assert.deepEqual(parseAcceptLanguage(null), []);
});

test("matchLocale maps regional tags by primary subtag and never guesses", () => {
  assert.equal(matchLocale("es-MX"), "es");
  assert.equal(matchLocale("PT_br"), "pt");
  assert.equal(matchLocale("ar-EG"), "ar");
  assert.equal(matchLocale("de-DE"), null);
  assert.equal(matchLocale(""), null);
  assert.equal(matchLocale(null), null);
});

test("negotiateLocale: account preference beats device cookie beats browser beats English", () => {
  assert.equal(negotiateLocale({ cookie: "fr", preference: "es", acceptLanguage: "pt" }), "es");
  assert.equal(negotiateLocale({ cookie: "fr", acceptLanguage: "pt" }), "fr");
  assert.equal(negotiateLocale({ acceptLanguage: "pt" }), "pt");
  assert.equal(negotiateLocale({ acceptLanguage: "de, pt-BR;q=0.8" }), "pt");
  assert.equal(negotiateLocale({}), "en");
});

test("negotiateLocale skips an invalid value instead of trusting it", () => {
  assert.equal(negotiateLocale({ cookie: "fr", preference: "xx" }), "fr");
  assert.equal(negotiateLocale({ cookie: "xx", preference: "ar" }), "ar");
  assert.equal(
    negotiateLocale({ cookie: "<script>", preference: "nope", acceptLanguage: "es" }),
    "es",
  );
});
