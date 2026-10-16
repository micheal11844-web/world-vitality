import { test } from "node:test";
import assert from "node:assert/strict";
import { isValidTemplate, templateVariables } from "../format.js";
import { LOCALES } from "../locales.js";
import { en } from "../messages/en.js";
import { CATALOGS, createTranslator } from "../translator.js";

const keys = Object.keys(en) as (keyof typeof en)[];

for (const locale of LOCALES) {
  test(`${locale.code}: has every key and nothing extra`, () => {
    const catalog = CATALOGS[locale.code] as Record<string, string>;
    assert.deepEqual(Object.keys(catalog).sort(), [...keys].sort());
  });

  test(`${locale.code}: every message is non-empty and well-formed`, () => {
    for (const key of keys) {
      const value = CATALOGS[locale.code][key];
      assert.ok(value.trim().length > 0, `${locale.code}.${key} is empty`);
      assert.ok(isValidTemplate(value), `${locale.code}.${key} is malformed: ${value}`);
    }
  });

  test(`${locale.code}: uses the same variables as English for every message`, () => {
    for (const key of keys) {
      assert.deepEqual(
        templateVariables(CATALOGS[locale.code][key]),
        templateVariables(en[key]),
        `${locale.code}.${key} must use the same {variables} as English`,
      );
    }
  });
}

test("the non-English catalogs are really translated, not copies of English", () => {
  // A handful of keys are legitimately identical in some languages (brand
  // words, "Info"), so allow a small share — but a catalog that is mostly
  // English means a translation step was skipped.
  for (const locale of LOCALES) {
    if (locale.code === "en") continue;
    const same = keys.filter((k) => CATALOGS[locale.code][k] === en[k]).length;
    assert.ok(
      same / keys.length < 0.06,
      `${locale.code}: ${same}/${keys.length} messages are still English`,
    );
  }
});

test("plural messages carry the categories their language needs", () => {
  const gaps = (code: "ar" | "es" | "fr" | "pt" | "en") => CATALOGS[code]["dashboard.insightGaps"];
  assert.match(gaps("en"), /plural/);
  // Arabic needs more than one/other, or counts like 2 and 3 read wrong.
  for (const category of ["one", "two", "few", "many", "other"]) {
    assert.match(gaps("ar"), new RegExp(`${category} \\{`), `ar insightGaps lacks "${category}"`);
  }
  for (const code of ["es", "fr", "pt"] as const) assert.match(gaps(code), /other \{/);
});

test("the translator formats, and falls back to English then to the key", () => {
  const es = createTranslator("es");
  assert.equal(es.dir, "ltr");
  assert.equal(es.t("search.resultsFor", { query: "agua" }), "Resultados para «agua»");
  assert.equal(createTranslator("ar").dir, "rtl");
  assert.equal(createTranslator("en").t("common.continue"), "Continue");
  // A key that doesn't exist anywhere shows as itself — loud in review, never blank.
  assert.equal(createTranslator("fr").t("nope.nothing" as never), "nope.nothing");
});

test("the safety-critical wording survives translation: official text stays unmodified and in English", () => {
  for (const locale of LOCALES) {
    const note = CATALOGS[locale.code]["notifications.officialEnglishNote"];
    assert.ok(note.length > 40, `${locale.code} officialEnglishNote missing`);
  }
  // The "no all-clear" status for a failed check must still tell people to use local official sources.
  assert.match(CATALOGS.es["notifications.status.failed"], /oficiales/i);
  assert.match(CATALOGS.fr["notifications.status.failed"], /officielles/i);
  assert.match(CATALOGS.pt["notifications.status.failed"], /oficiais/i);
  assert.ok(CATALOGS.ar["notifications.status.failed"].includes("الرسمية"));
});

test("the unreviewed-draft disclosure is present in every language that needs it", () => {
  for (const locale of LOCALES) {
    assert.ok(CATALOGS[locale.code]["settings.language.draftNote"].length > 40);
  }
});

test("translateOr uses the message when it exists and the fallback when it doesn't", async () => {
  const { translateOr } = await import("../translator-core.js");
  const { createTranslator } = await import("../translator.js");
  const { t } = createTranslator("es");
  assert.equal(
    translateOr(t, "workspace.agriculture.name", "Agriculture"),
    t("workspace.agriculture.name"),
  );
  assert.equal(translateOr(t, "workspace.not-a-workspace.name", "Fallback"), "Fallback");
  assert.equal(translateOr(t, "constructor", "Fallback"), "Fallback");
});
