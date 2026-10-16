import { test } from "node:test";
import assert from "node:assert/strict";
import { formatMessage, isValidTemplate, templateVariables } from "../format.js";

test("substitutes variables", () => {
  assert.equal(formatMessage("Hi {name}, step {n}", { name: "Ada", n: 2 }, "en"), "Hi Ada, step 2");
});

test("a missing variable stays visible rather than becoming 'undefined'", () => {
  assert.equal(formatMessage("Hi {name}", {}, "en"), "Hi {name}");
  assert.equal(formatMessage("Hi {name}", undefined, "en"), "Hi {name}");
});

test("English plurals: one vs other", () => {
  const t = "{count, plural, one {# day} other {# days}}";
  assert.equal(formatMessage(t, { count: 1 }, "en"), "1 day");
  assert.equal(formatMessage(t, { count: 0 }, "en"), "0 days");
  assert.equal(formatMessage(t, { count: 12 }, "en"), "12 days");
});

test("French treats 0 and 1 as singular; Spanish does not", () => {
  const t = "{count, plural, one {# jour} other {# jours}}";
  assert.equal(formatMessage(t, { count: 0 }, "fr"), "0 jour");
  assert.equal(formatMessage(t, { count: 2 }, "fr"), "2 jours");
  const es = "{count, plural, one {# día} other {# días}}";
  assert.equal(formatMessage(es, { count: 0 }, "es"), "0 días");
  assert.equal(formatMessage(es, { count: 1 }, "es"), "1 día");
});

test("Arabic uses all six plural categories", () => {
  const t = "{count, plural, zero {Z} one {O} two {T} few {F} many {M} other {X}}";
  assert.equal(formatMessage(t, { count: 0 }, "ar"), "Z");
  assert.equal(formatMessage(t, { count: 1 }, "ar"), "O");
  assert.equal(formatMessage(t, { count: 2 }, "ar"), "T");
  assert.equal(formatMessage(t, { count: 3 }, "ar"), "F");
  assert.equal(formatMessage(t, { count: 11 }, "ar"), "M");
  assert.equal(formatMessage(t, { count: 100 }, "ar"), "X");
});

test("an exact =N branch wins over the category", () => {
  const t = "{count, plural, =0 {none} one {# item} other {# items}}";
  assert.equal(formatMessage(t, { count: 0 }, "en"), "none");
  assert.equal(formatMessage(t, { count: 1 }, "en"), "1 item");
});

test("variables inside a plural branch are substituted", () => {
  const t = "{count, plural, one {{who} has # file} other {{who} has # files}}";
  assert.equal(formatMessage(t, { count: 3, who: "Ada" }, "en"), "Ada has 3 files");
});

test("a plural with a non-numeric or missing count leaves its placeholder", () => {
  const t = "{count, plural, one {# a} other {# b}}";
  assert.equal(formatMessage(t, {}, "en"), "{count}");
  assert.equal(formatMessage(t, { count: "abc" }, "en"), "{count}");
});

test("a malformed template is returned as written and never throws", () => {
  for (const bad of [
    "Hello {name",
    "{n, plural, one {x}}",
    "{n, select, a {b} other {c}}",
    "{n, plural, bogus {x} other {y}}",
  ]) {
    assert.equal(isValidTemplate(bad), false, bad);
    assert.equal(formatMessage(bad, { n: 1 }, "en"), bad);
  }
});

test("templateVariables lists plural counters and branch variables, sorted", () => {
  assert.deepEqual(templateVariables("{b} {a}"), ["a", "b"]);
  assert.deepEqual(templateVariables("{count, plural, one {{who} # x} other {{who} # y}}"), [
    "count",
    "who",
  ]);
  assert.deepEqual(templateVariables("no variables"), []);
});

test("user-supplied text is substituted as-is, never interpreted as a template", () => {
  assert.equal(
    formatMessage("Results for “{query}”", { query: "{count, plural, other {x}}" }, "en"),
    "Results for “{count, plural, other {x}}”",
  );
});

test("in a right-to-left language, substituted strings are bidi-isolated; numbers and LTR text are not", () => {
  const FSI = "⁨";
  const PDI = "⁩";
  assert.equal(formatMessage("«{place}»", { place: "Lagos" }, "ar"), `«${FSI}Lagos${PDI}»`);
  assert.equal(formatMessage("«{place}»", { place: "Lagos" }, "es"), "«Lagos»");
  assert.equal(formatMessage("{n}", { n: 5 }, "ar"), "5");
  assert.equal(formatMessage("{a}", { a: "" }, "ar"), "");
  const plural = formatMessage(
    "{count, plural, one {{who} #} other {{who} #}}",
    { count: 1, who: "Ada" },
    "ar",
  );
  assert.ok(plural.includes(`${FSI}Ada${PDI}`));
});

test("a plain numeric variable uses the language's numerals, like a plural count does", () => {
  assert.equal(formatMessage("Step {n}", { n: 3 }, "en"), "Step 3");
  // The same rule as `#`: whatever the language's digits are, both agree.
  const arabicDigits = new Intl.NumberFormat("ar").format(3);
  assert.equal(formatMessage("{n}", { n: 3 }, "ar"), arabicDigits);
  assert.equal(
    formatMessage("{count, plural, other {#}}", { count: 3 }, "ar"),
    formatMessage("{count}", { count: 3 }, "ar"),
  );
  // Strings are never reformatted.
  assert.equal(formatMessage("{s}", { s: "007" }, "en"), "007");
});
