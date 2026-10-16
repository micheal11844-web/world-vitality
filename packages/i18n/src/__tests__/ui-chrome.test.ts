import { test } from "node:test";
import assert from "node:assert/strict";
import { LOCALES } from "../locales.js";
import { createTranslator } from "../translator.js";
import { buildChromeStrings } from "../ui-chrome.js";

test("chrome strings are built for every language with nothing blank", () => {
  for (const locale of LOCALES) {
    const chrome = buildChromeStrings(createTranslator(locale.code));
    assert.equal(chrome.dir, locale.dir);
    const flat = [
      chrome.viewGlobe,
      chrome.settings,
      chrome.signOut,
      chrome.sidebar.primary,
      chrome.sidebar.expand,
      chrome.aiPanel.title,
      chrome.search.label,
      chrome.search.placeholder,
      chrome.bell.label,
      ...Object.values(chrome.search.kind),
      chrome.sidebar.expandItem("X"),
      chrome.search.pressEnter("q"),
      chrome.bell.unread(3),
      chrome.bell.critical(2),
    ];
    for (const text of flat)
      assert.ok(text.trim().length > 0, `${locale.code}: blank chrome string`);
  }
});

test("chrome messages carry their variables through", () => {
  const es = buildChromeStrings(createTranslator("es"));
  assert.equal(es.sidebar.expandItem("Agricultura"), "Expandir Agricultura");
  assert.match(es.search.noQuickMatches("riego"), /riego/);
  assert.equal(es.bell.unread(3), "3 sin leer");
});

test("Arabic bell labels use the right plural and the Arabic list separator", () => {
  const ar = buildChromeStrings(createTranslator("ar"));
  assert.equal(ar.listSeparator, "، ");
  assert.match(ar.bell.unread(1), /واحد/);
  assert.match(ar.bell.unread(2), /إشعاران/);
  assert.match(ar.bell.critical(2), /حرجان/);
});

test("English matches what the shared components have always said", () => {
  const en = buildChromeStrings(createTranslator("en"));
  assert.equal(en.bell.unread(3), "3 unread");
  assert.equal(en.bell.critical(2), "2 critical");
  assert.equal(en.viewGlobe, "View the Globe");
  assert.equal(en.sidebar.collapse, "Collapse sidebar (Ctrl+B)");
  assert.equal(en.search.noQuickMatches("x"), "No quick matches — press Enter to search for “x”");
});
