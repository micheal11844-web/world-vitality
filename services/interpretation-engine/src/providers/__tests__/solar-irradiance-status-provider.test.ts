import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SolarIrradianceStatusProvider,
  CAPABILITY_ID,
  classifySolarIrradiance,
} from "../solar-irradiance-status-provider.js";
import type { NormalizedDataRecord } from "@world-vitality/data-schemas";

function record(value: number, dayOffset: number): NormalizedDataRecord {
  const timestamp = new Date(Date.UTC(2026, 0, 1 + dayOffset)).toISOString();
  return {
    id: `test:ALLSKY_SFC_SW_DWN:${dayOffset}`,
    metric: "ALLSKY_SFC_SW_DWN",
    value,
    unit: "kWh/m^2/day",
    timestamp,
    provenance: {
      source: "test",
      sourceName: "Test Fixture",
      license: "CC-BY-4.0",
      retrievedAt: timestamp,
      knownLimitations: [],
    },
  };
}

const provider = new SolarIrradianceStatusProvider();

test("classifies minimal irradiance correctly", async () => {
  const result = await provider.interpret({ capability: CAPABILITY_ID, records: [record(1, 0)] });
  assert.match(result.summary, /^Minimal irradiance/);
});

test("classifies low irradiance correctly", async () => {
  const result = await provider.interpret({ capability: CAPABILITY_ID, records: [record(3, 0)] });
  assert.match(result.summary, /^Low irradiance/);
});

test("classifies moderate irradiance correctly", async () => {
  const result = await provider.interpret({ capability: CAPABILITY_ID, records: [record(5, 0)] });
  assert.match(result.summary, /^Moderate irradiance/);
});

test("classifies high irradiance correctly", async () => {
  const result = await provider.interpret({ capability: CAPABILITY_ID, records: [record(7, 0)] });
  assert.match(result.summary, /^High irradiance/);
});

test("reports high confidence with 5+ readings", async () => {
  const records = [4, 5, 6, 5.5, 4.5].map((v, i) => record(v, i));
  const result = await provider.interpret({ capability: CAPABILITY_ID, records });
  assert.equal(result.confidence, "high");
});

test("reports low confidence with a single reading", async () => {
  const result = await provider.interpret({ capability: CAPABILITY_ID, records: [record(5, 0)] });
  assert.equal(result.confidence, "low");
});

test("uses the most recent reading, not an average, when multiple days are present", async () => {
  const records = [record(1, 0), record(7, 1)];
  const result = await provider.interpret({ capability: CAPABILITY_ID, records });
  assert.match(result.summary, /^High irradiance/);
});

test("returns unableToAnswer, never a fabricated value, when no irradiance records exist", async () => {
  const result = await provider.interpret({ capability: CAPABILITY_ID, records: [] });
  assert.equal(result.confidence, "insufficient-data");
  assert.ok(result.unableToAnswer);
  assert.equal(result.contributingFactors.length, 0);
});

test("evaluate() matches ground truth when the band agrees", async () => {
  const { matchesGroundTruth } = await provider.evaluate(
    { capability: CAPABILITY_ID, records: [record(7, 0)] },
    { band: "high" },
  );
  assert.equal(matchesGroundTruth, true);
});

test("evaluate() reports a mismatch when the band disagrees", async () => {
  const { matchesGroundTruth } = await provider.evaluate(
    { capability: CAPABILITY_ID, records: [record(1, 0)] },
    { band: "high" },
  );
  assert.equal(matchesGroundTruth, false);
});

test("rejects a request for a capability it doesn't support", async () => {
  await assert.rejects(
    () => provider.interpret({ capability: "not-a-real-capability", records: [] }),
    /does not support capability/,
  );
});

test("classifySolarIrradiance exposes band boundaries correctly, exported for reuse", () => {
  assert.equal(classifySolarIrradiance(1.9).band, "minimal");
  assert.equal(classifySolarIrradiance(2).band, "low");
  assert.equal(classifySolarIrradiance(3.9).band, "low");
  assert.equal(classifySolarIrradiance(4).band, "moderate");
  assert.equal(classifySolarIrradiance(5.9).band, "moderate");
  assert.equal(classifySolarIrradiance(6).band, "high");
});
