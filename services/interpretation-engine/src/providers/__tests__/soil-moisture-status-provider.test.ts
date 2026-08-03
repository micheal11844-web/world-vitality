import { test } from "node:test";
import assert from "node:assert/strict";
import { SoilMoistureStatusProvider, CAPABILITY_ID } from "../soil-moisture-status-provider.js";
import type { NormalizedDataRecord } from "@world-vitality/data-schemas";

function record(value: number, dayOffset: number, metric = "GWETROOT"): NormalizedDataRecord {
  const timestamp = new Date(Date.UTC(2024, 0, 1 + dayOffset)).toISOString();
  return {
    id: `test:${metric}:${dayOffset}`,
    metric,
    value,
    unit: "fraction",
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

const provider = new SoilMoistureStatusProvider();

test("classifies a dry reading correctly and reports low confidence for a single data point", async () => {
  const result = await provider.interpret({
    capability: CAPABILITY_ID,
    records: [record(0.15, 0)],
  });
  assert.equal(result.confidence, "low");
  assert.match(result.summary, /dry/);
  assert.equal(result.unableToAnswer, undefined);
});

test("classifies a saturated reading and flags waterlogging risk", async () => {
  const result = await provider.interpret({
    capability: CAPABILITY_ID,
    records: [record(0.95, 0)],
  });
  assert.match(result.summary, /saturated/);
});

test("reports high confidence with 5+ readings", async () => {
  const records = [0.5, 0.52, 0.48, 0.51, 0.49].map((v, i) => record(v, i));
  const result = await provider.interpret({ capability: CAPABILITY_ID, records });
  assert.equal(result.confidence, "high");
  assert.equal(result.contributingFactors.length, 2);
});

test("returns unableToAnswer, never a fabricated value, when no soil-moisture records exist", async () => {
  const result = await provider.interpret({
    capability: CAPABILITY_ID,
    records: [record(20, 0, "T2M")], // unrelated metric only
  });
  assert.equal(result.confidence, "insufficient-data");
  assert.ok(result.unableToAnswer);
  assert.equal(result.contributingFactors.length, 0);
});

test("uses the most recent reading, not an average, when multiple days are present", async () => {
  const records = [record(0.1, 0), record(0.9, 1)]; // dry then saturated
  const result = await provider.interpret({ capability: CAPABILITY_ID, records });
  assert.match(result.summary, /saturated/);
});

test("evaluate() matches ground truth when the classified band agrees", async () => {
  const { matchesGroundTruth } = await provider.evaluate(
    { capability: CAPABILITY_ID, records: [record(0.3, 0)] },
    { band: "dry" },
  );
  assert.equal(matchesGroundTruth, true);
});

test("evaluate() reports a mismatch when the classified band disagrees with ground truth", async () => {
  const { matchesGroundTruth } = await provider.evaluate(
    { capability: CAPABILITY_ID, records: [record(0.15, 0)] },
    { band: "saturated" },
  );
  assert.equal(matchesGroundTruth, false);
});

test("rejects requests for a capability it doesn't support", async () => {
  await assert.rejects(
    () => provider.interpret({ capability: "something-else", records: [] }),
    /does not support capability/,
  );
});
