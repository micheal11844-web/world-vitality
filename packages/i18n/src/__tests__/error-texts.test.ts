import { test } from "node:test";
import assert from "node:assert/strict";
import { LOCALES } from "../locales.js";
import {
  ERROR_TEXTS,
  errorLocaleFromBrowser,
  isErrorLocale,
  type ErrorTexts,
} from "../error-texts.js";

test("every language has every error-page word, none blank, and the right direction", () => {
  for (const locale of LOCALES) {
    const texts: ErrorTexts | undefined = ERROR_TEXTS[locale.code];
    assert.ok(texts, `${locale.code}: no error texts`);
    assert.equal(texts.dir, locale.dir, `${locale.code}: direction differs from the locale table`);
    for (const [key, value] of Object.entries(texts)) {
      if (typeof value === "string")
        assert.ok(value.trim().length > 0, `${locale.code}.${key} is blank`);
    }
    const reference = texts.reference("abc123");
    assert.ok(reference.includes("abc123"), `${locale.code}: reference line drops the code`);
  }
});

test("the error words are not just the English ones copied across", () => {
  const english = ERROR_TEXTS.en;
  for (const locale of LOCALES) {
    if (locale.code === "en") continue;
    const texts = ERROR_TEXTS[locale.code];
    assert.notEqual(texts.errorTitle, english.errorTitle, `${locale.code}: title untranslated`);
    assert.notEqual(texts.retry, english.retry, `${locale.code}: retry untranslated`);
    assert.notEqual(texts.notFoundTitle, english.notFoundTitle, `${locale.code}: 404 untranslated`);
  }
});

test("only Arabic is right-to-left", () => {
  const rtl = LOCALES.filter((l) => ERROR_TEXTS[l.code].dir === "rtl").map((l) => l.code);
  assert.deepEqual(rtl, ["ar"]);
});

test("the language comes from the saved cookie first", () => {
  assert.equal(errorLocaleFromBrowser("theme=dark; wv_lang=ar; other=1", ["fr-FR"]), "ar");
  assert.equal(errorLocaleFromBrowser("wv_lang=pt", []), "pt");
});

test("without a saved choice the browser's first known language wins, then English", () => {
  assert.equal(errorLocaleFromBrowser("", ["de-DE", "fr-CA", "es"]), "fr");
  assert.equal(errorLocaleFromBrowser("", ["PT-br"]), "pt");
  assert.equal(errorLocaleFromBrowser("", ["de", "ja"]), "en");
  assert.equal(errorLocaleFromBrowser("", []), "en");
});

test("a cookie naming a language we don't have is ignored", () => {
  assert.equal(errorLocaleFromBrowser("wv_lang=xx", ["es-MX"]), "es");
  assert.equal(errorLocaleFromBrowser("wv_lang=", []), "en");
  // A cookie whose name merely ends the same way is not the language cookie.
  assert.equal(errorLocaleFromBrowser("not_wv_lang=ar", []), "en");
});

test("isErrorLocale accepts exactly the supported codes", () => {
  for (const locale of LOCALES) assert.ok(isErrorLocale(locale.code));
  for (const bad of ["", "EN", "en-US", "xx", null, undefined, 3]) assert.ok(!isErrorLocale(bad));
});
