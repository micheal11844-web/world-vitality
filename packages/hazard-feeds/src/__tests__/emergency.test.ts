import { test } from "node:test";
import assert from "node:assert/strict";
import { KNOWN_EMERGENCY_NUMBERS, emergencyNumberFor } from "../emergency.js";
import { CAMERA_PROVIDERS, CAMERA_PROVIDER_IDS } from "../providers.js";

test("emergencyNumberFor: national number for known countries, general 112 otherwise", () => {
  assert.deepEqual(emergencyNumberFor("US"), { number: "911", specific: true });
  assert.deepEqual(emergencyNumberFor("ca"), { number: "911", specific: true });
  assert.deepEqual(emergencyNumberFor("GB"), { number: "999", specific: true });
  assert.deepEqual(emergencyNumberFor("AU"), { number: "000", specific: true });
  assert.deepEqual(emergencyNumberFor("FI"), { number: "112", specific: true });
  assert.deepEqual(emergencyNumberFor("SG"), { number: "995", specific: true });
  for (const unknown of ["NG", "ZZ", "", null, undefined]) {
    assert.deepEqual(emergencyNumberFor(unknown), { number: "112", specific: false });
  }
});

test("every camera provider's country has a specific emergency number", () => {
  for (const id of CAMERA_PROVIDER_IDS) {
    assert.equal(emergencyNumberFor(CAMERA_PROVIDERS[id].countryCode).specific, true, id);
  }
  assert.ok(KNOWN_EMERGENCY_NUMBERS.length >= 6);
});
