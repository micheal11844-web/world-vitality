import { test } from "node:test";
import assert from "node:assert/strict";
import { NormalizedDataRecordSchema } from "../record.js";

function baseRecord() {
  return {
    id: "test:1",
    metric: "T2M",
    value: 22.5,
    unit: "C",
    timestamp: new Date().toISOString(),
    provenance: {
      source: "test",
      sourceName: "Test",
      license: "CC-BY-4.0",
      retrievedAt: new Date().toISOString(),
      knownLimitations: [],
    },
  };
}

test("a record with no recordType is valid — the implicit 'observed' default", () => {
  const result = NormalizedDataRecordSchema.safeParse(baseRecord());
  assert.equal(result.success, true);
});

test("recordType 'observed' is valid without forecastIssuedAt", () => {
  const result = NormalizedDataRecordSchema.safeParse({
    ...baseRecord(),
    recordType: "observed",
  });
  assert.equal(result.success, true);
});

test("recordType 'forecast' WITHOUT forecastIssuedAt is rejected", () => {
  const result = NormalizedDataRecordSchema.safeParse({
    ...baseRecord(),
    recordType: "forecast",
  });
  assert.equal(result.success, false);
});

test("recordType 'forecast' WITH forecastIssuedAt is valid", () => {
  const result = NormalizedDataRecordSchema.safeParse({
    ...baseRecord(),
    recordType: "forecast",
    forecastIssuedAt: new Date().toISOString(),
  });
  assert.equal(result.success, true);
});
