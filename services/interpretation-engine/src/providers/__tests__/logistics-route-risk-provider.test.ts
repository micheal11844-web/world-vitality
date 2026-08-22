import { test } from "node:test";
import assert from "node:assert/strict";
import {
  LogisticsRouteRiskProvider,
  CAPABILITY_ID,
  classifyRouteRisk,
} from "../logistics-route-risk-provider.js";
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

const provider = new LogisticsRouteRiskProvider();

test("classifies clear wind speed correctly", async () => {
  const result = await provider.interpret({ capability: CAPABILITY_ID, records: [record(3, 0)] });
  assert.match(result.summary, /^Clear/);
});

test("classifies elevated risk wind speed correctly", async () => {
  const result = await provider.interpret({ capability: CAPABILITY_ID, records: [record(10, 0)] });
  assert.match(result.summary, /^Elevated risk/);
});

test("classifies high risk wind speed correctly", async () => {
  const result = await provider.interpret({ capability: CAPABILITY_ID, records: [record(16, 0)] });
  assert.match(result.summary, /^High risk/);
});

test("classifies severe risk wind speed correctly", async () => {
  const result = await provider.interpret({ capability: CAPABILITY_ID, records: [record(25, 0)] });
  assert.match(result.summary, /^Severe risk/);
});

test("classifyRouteRisk exposes band boundaries correctly, exported for reuse", () => {
  assert.equal(classifyRouteRisk(7.9).band, "clear");
  assert.equal(classifyRouteRisk(8).band, "elevated");
  assert.equal(classifyRouteRisk(13.9).band, "elevated");
  assert.equal(classifyRouteRisk(14).band, "high");
  assert.equal(classifyRouteRisk(19.9).band, "high");
  assert.equal(classifyRouteRisk(20).band, "severe");
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
  const records = [record(1, 0), record(25, 1)];
  const result = await provider.interpret({ capability: CAPABILITY_ID, records });
  assert.match(result.summary, /^Severe risk/);
});

test("returns unableToAnswer, never a fabricated value, when no wind records exist", async () => {
  const result = await provider.interpret({ capability: CAPABILITY_ID, records: [] });
  assert.equal(result.confidence, "insufficient-data");
  assert.ok(result.unableToAnswer);
  assert.equal(result.contributingFactors.length, 0);
});

test("evaluate() matches ground truth when the band agrees", async () => {
  const { matchesGroundTruth } = await provider.evaluate(
    { capability: CAPABILITY_ID, records: [record(16, 0)] },
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
