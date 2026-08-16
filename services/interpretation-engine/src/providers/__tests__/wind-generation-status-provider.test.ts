import { test } from "node:test";
import assert from "node:assert/strict";
import {
  WindGenerationStatusProvider,
  CAPABILITY_ID,
  classifyWindSpeed,
} from "../wind-generation-status-provider.js";
import type { NormalizedDataRecord } from "@world-vitality/data-schemas";

function record(value: number, dayOffset: number): NormalizedDataRecord {
  const timestamp = new Date(Date.UTC(2026, 0, 1 + dayOffset)).toISOString();
  return {
    id: `test:WS2M:${dayOffset}`,
    metric: "WS2M",
    value,
    unit: "m/s",
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

const provider = new WindGenerationStatusProvider();

test("classifies below-cut-in wind speed correctly", async () => {
  const result = await provider.interpret({ capability: CAPABILITY_ID, records: [record(1, 0)] });
  assert.match(result.summary, /^Below cut-in/);
});

test("classifies ramping wind speed correctly", async () => {
  const result = await provider.interpret({ capability: CAPABILITY_ID, records: [record(6, 0)] });
  assert.match(result.summary, /^Ramping/);
});

test("classifies rated-output wind speed correctly", async () => {
  const result = await provider.interpret({ capability: CAPABILITY_ID, records: [record(15, 0)] });
  assert.match(result.summary, /^Rated output/);
});

test("classifies cut-out wind speed correctly", async () => {
  const result = await provider.interpret({ capability: CAPABILITY_ID, records: [record(28, 0)] });
  assert.match(result.summary, /^Cut-out/);
});

test("reports high confidence with 5+ readings", async () => {
  const records = [4, 5, 6, 5.5, 4.5].map((v, i) => record(v, i));
  const result = await provider.interpret({ capability: CAPABILITY_ID, records });
  assert.equal(result.confidence, "high");
});

test("reports low confidence with a single reading", async () => {
  const result = await provider.interpret({ capability: CAPABILITY_ID, records: [record(6, 0)] });
  assert.equal(result.confidence, "low");
});

test("uses the most recent reading, not an average, when multiple days are present", async () => {
  const records = [record(1, 0), record(28, 1)];
  const result = await provider.interpret({ capability: CAPABILITY_ID, records });
  assert.match(result.summary, /^Cut-out/);
});

test("returns unableToAnswer, never a fabricated value, when no wind records exist", async () => {
  const result = await provider.interpret({ capability: CAPABILITY_ID, records: [] });
  assert.equal(result.confidence, "insufficient-data");
  assert.ok(result.unableToAnswer);
  assert.equal(result.contributingFactors.length, 0);
});

test("evaluate() matches ground truth when the band agrees", async () => {
  const { matchesGroundTruth } = await provider.evaluate(
    { capability: CAPABILITY_ID, records: [record(15, 0)] },
    { band: "rated-output" },
  );
  assert.equal(matchesGroundTruth, true);
});

test("evaluate() reports a mismatch when the band disagrees", async () => {
  const { matchesGroundTruth } = await provider.evaluate(
    { capability: CAPABILITY_ID, records: [record(1, 0)] },
    { band: "rated-output" },
  );
  assert.equal(matchesGroundTruth, false);
});

test("rejects a request for a capability it doesn't support", async () => {
  await assert.rejects(
    () => provider.interpret({ capability: "not-a-real-capability", records: [] }),
    /does not support capability/,
  );
});

test("classifyWindSpeed exposes band boundaries correctly, exported for reuse", () => {
  assert.equal(classifyWindSpeed(2.9).band, "below-cut-in");
  assert.equal(classifyWindSpeed(3).band, "ramping");
  assert.equal(classifyWindSpeed(11.9).band, "ramping");
  assert.equal(classifyWindSpeed(12).band, "rated-output");
  assert.equal(classifyWindSpeed(24.9).band, "rated-output");
  assert.equal(classifyWindSpeed(25).band, "cut-out");
});
