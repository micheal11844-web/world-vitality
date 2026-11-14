import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DATA_CREDITS,
  DATA_CREDIT_GROUPS,
  DATA_CREDIT_IDS,
  OPEN_METEO_CREDIT_URL,
  dataCreditsInGroup,
} from "../data-credits.js";
import { CAMERA_PROVIDERS } from "../providers.js";

test("every credit is keyed by its own id and has a name and a secure link", () => {
  for (const id of DATA_CREDIT_IDS) {
    const credit = DATA_CREDITS[id];
    assert.equal(credit.id, id);
    assert.ok(credit.name.trim().length > 0, `${id} has a name`);
    assert.match(credit.url, /^https:\/\/[a-z0-9.-]+\.[a-z]{2,}(\/|$)/, `${id} link`);
    if (credit.licence) {
      assert.ok(credit.licence.name.trim().length > 0, `${id} licence name`);
      assert.match(credit.licence.url, /^https:\/\//, `${id} licence link`);
    }
  }
});

test("every credit belongs to a group the page lists, and groups are not empty", () => {
  const listed = new Set<string>(DATA_CREDIT_GROUPS);
  for (const id of DATA_CREDIT_IDS) assert.ok(listed.has(DATA_CREDITS[id].group), id);
  for (const group of DATA_CREDIT_GROUPS) {
    assert.ok(dataCreditsInGroup(group).length > 0, `${group} has at least one credit`);
  }
  const grouped = DATA_CREDIT_GROUPS.flatMap((group) => dataCreditsInGroup(group));
  assert.equal(grouped.length, DATA_CREDIT_IDS.length);
});

test("Open-Meteo is credited with a link to its own site and under CC BY 4.0", () => {
  assert.equal(OPEN_METEO_CREDIT_URL, "https://open-meteo.com/");
  assert.equal(DATA_CREDITS["open-meteo"].url, OPEN_METEO_CREDIT_URL);
  assert.equal(DATA_CREDITS["open-meteo"].licence?.name, "CC BY 4.0");
  assert.equal(DATA_CREDITS.geonames.licence?.name, "CC BY 4.0");
});

test("a source whose terms are silent is not given a licence it has not stated", () => {
  assert.equal(DATA_CREDITS.gdacs.licence, undefined);
  assert.equal(DATA_CREDITS["nasa-power"].licence, undefined);
  assert.equal(DATA_CREDITS["nasa-firms"].licence, undefined);
});

test("every camera agency states the credit and licence the page will print", () => {
  for (const provider of Object.values(CAMERA_PROVIDERS)) {
    assert.ok(provider.attribution.trim().length > 0, `${provider.id} credit`);
    assert.ok(provider.licenceName.trim().length > 0, `${provider.id} licence name`);
    assert.match(provider.licenceUrl, /^https:\/\//, `${provider.id} licence link`);
    assert.match(provider.sourceUrl, /^https:\/\//, `${provider.id} source link`);
  }
});
