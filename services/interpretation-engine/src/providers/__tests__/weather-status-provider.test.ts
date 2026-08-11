import { test } from "node:test";
import assert from "node:assert/strict";
import { WeatherStatusProvider, CAPABILITY_ID } from "../weather-status-provider.js";
import type { NormalizedDataRecord } from "@world-vitality/data-schemas";

function record(value: number, dayOffset: number, metric = "T2M"): NormalizedDataRecord {
  const timestamp = new Date(Date.UTC(2024, 0, 1 + dayOffset)).toISOString();
  return {
    id: `test:${metric}:${dayOffset}`,
    metric,
    value,
    unit: "C",
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

const provider = new WeatherStatusProvider();

test("classifies a cold reading correctly and reports low confidence for a single data point", async () => {
  const result = await provider.interpret({
    capability: CAPABILITY_ID,
    records: [record(2, 0)],
  });
  assert.equal(result.confidence, "low");
  assert.match(result.summary, /cold/);
  assert.equal(result.unableToAnswer, undefined);
});

test("classifies a hot reading correctly", async () => {
  const result = await provider.interpret({
    capability: CAPABILITY_ID,
    records: [record(38, 0)],
  });
  assert.match(result.summary, /hot/);
});

test("reports high confidence with 5+ readings", async () => {
  const records = [20, 21, 19, 20.5, 19.5].map((v, i) => record(v, i));
  const result = await provider.interpret({ capability: CAPABILITY_ID, records });
  assert.equal(result.confidence, "high");
  assert.equal(result.contributingFactors.length, 2);
});

test("returns unableToAnswer, never a fabricated value, when no temperature records exist", async () => {
  const result = await provider.interpret({
    capability: CAPABILITY_ID,
    records: [record(0.5, 0, "GWETROOT")], // unrelated metric only
  });
  assert.equal(result.confidence, "insufficient-data");
  assert.ok(result.unableToAnswer);
  assert.equal(result.contributingFactors.length, 0);
});

test("uses the most recent reading, not an average, when multiple days are present", async () => {
  const records = [record(2, 0), record(35, 1)]; // cold then hot
  const result = await provider.interpret({ capability: CAPABILITY_ID, records });
  assert.match(result.summary, /hot/);
});

test("evaluate() matches ground truth when the classified band agrees", async () => {
  const { matchesGroundTruth } = await provider.evaluate(
    { capability: CAPABILITY_ID, records: [record(20, 0)] },
    { band: "mild" },
  );
  assert.equal(matchesGroundTruth, true);
});

test("evaluate() reports a mismatch when the classified band disagrees with ground truth", async () => {
  const { matchesGroundTruth } = await provider.evaluate(
    { capability: CAPABILITY_ID, records: [record(2, 0)] },
    { band: "hot" },
  );
  assert.equal(matchesGroundTruth, false);
});

test("rejects requests for a capability it doesn't support", async () => {
  await assert.rejects(
    () => provider.interpret({ capability: "something-else", records: [] }),
    /does not support capability/,
  );
});
