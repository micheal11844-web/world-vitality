import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SolarIrradianceOutlookProvider,
  CAPABILITY_ID,
} from "../solar-irradiance-outlook-provider.js";
import type { NormalizedDataRecord } from "@world-vitality/data-schemas";

const ISSUED_AT = new Date(Date.UTC(2026, 7, 16, 0, 0, 0)).toISOString();

function forecastRecord(kwhPerM2PerDay: number, dayOffset: number): NormalizedDataRecord {
  const timestamp = new Date(Date.UTC(2026, 7, 16 + dayOffset, 12, 0, 0)).toISOString();
  return {
    id: `test:ALLSKY_SFC_SW_DWN:${dayOffset}`,
    metric: "ALLSKY_SFC_SW_DWN",
    value: kwhPerM2PerDay,
    unit: "kWh/m^2/day",
    timestamp,
    recordType: "forecast",
    forecastIssuedAt: ISSUED_AT,
    provenance: {
      source: "test",
      sourceName: "Test Fixture",
      license: "CC-BY-4.0",
      retrievedAt: ISSUED_AT,
      knownLimitations: [],
    },
  };
}

const provider = new SolarIrradianceOutlookProvider();

test("summarizes a high-irradiance-heavy outlook", async () => {
  const records = [0, 1, 2].map((d) => forecastRecord(7, d));
  const result = await provider.interpret({ capability: CAPABILITY_ID, records });
  assert.match(result.summary, /3 day\(s\) with high irradiance/);
});

test("flags high days distinctly from minimal days", async () => {
  const records = [forecastRecord(7, 0), forecastRecord(1, 1)];
  const result = await provider.interpret({ capability: CAPABILITY_ID, records });
  assert.match(result.summary, /1 day\(s\) with high irradiance/);
  assert.match(result.summary, /1 day\(s\) with minimal irradiance/);
});

test("assigns high confidence when every day is short-range", async () => {
  const records = [0, 1, 2].map((d) => forecastRecord(5, d));
  const result = await provider.interpret({ capability: CAPABILITY_ID, records });
  assert.equal(result.confidence, "high");
});

test("assigns low confidence when the furthest day is long-range", async () => {
  const records = [forecastRecord(5, 0), forecastRecord(5, 9)];
  const result = await provider.interpret({ capability: CAPABILITY_ID, records });
  assert.equal(result.confidence, "low");
});

test("ignores observed (non-forecast) records entirely", async () => {
  const observed: NormalizedDataRecord = {
    id: "observed:ALLSKY_SFC_SW_DWN:0",
    metric: "ALLSKY_SFC_SW_DWN",
    value: 5,
    unit: "kWh/m^2/day",
    timestamp: new Date(Date.UTC(2026, 7, 16)).toISOString(),
    provenance: {
      source: "test",
      sourceName: "Test Fixture",
      license: "CC-BY-4.0",
      retrievedAt: ISSUED_AT,
      knownLimitations: [],
    },
  };
  const result = await provider.interpret({ capability: CAPABILITY_ID, records: [observed] });
  assert.ok(result.unableToAnswer);
});

test("returns unableToAnswer, never a fabricated outlook, when no forecast records exist", async () => {
  const result = await provider.interpret({ capability: CAPABILITY_ID, records: [] });
  assert.equal(result.confidence, "insufficient-data");
  assert.ok(result.unableToAnswer);
  assert.equal(result.contributingFactors.length, 0);
});

test("evaluate() matches ground truth when any day hits high irradiance", async () => {
  const { matchesGroundTruth } = await provider.evaluate(
    { capability: CAPABILITY_ID, records: [forecastRecord(7, 0)] },
    { anyHigh: true },
  );
  assert.equal(matchesGroundTruth, true);
});

test("rejects a request for a capability it doesn't support", async () => {
  await assert.rejects(
    () => provider.interpret({ capability: "not-a-real-capability", records: [] }),
    /does not support capability/,
  );
});
