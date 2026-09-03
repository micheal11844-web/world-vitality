import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ConstructionRiskStatusProvider,
  CAPABILITY_ID,
} from "../construction-risk-status-provider.js";
import type { NormalizedDataRecord } from "@world-vitality/data-schemas";

function record(value: number, dayOffset: number, metric: "T2M" | "WS2M" | "PRECTOTCORR"): NormalizedDataRecord {
  const timestamp = new Date(Date.UTC(2024, 0, 1 + dayOffset)).toISOString();
  return {
    id: `test:${metric}:${dayOffset}`,
    metric,
    value,
    unit: metric === "T2M" ? "C" : metric === "WS2M" ? "m/s" : "mm/day",
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

const provider = new ConstructionRiskStatusProvider();

test("returns go for all activities under normal temperature and wind", async () => {
  const result = await provider.interpret({
    capability: CAPABILITY_ID,
    records: [record(20, 0, "T2M"), record(3, 0, "WS2M")],
  });
  assert.match(result.summary, /Concrete pour: go/);
  assert.match(result.summary, /Crane operation: go/);
  assert.match(result.summary, /Roofing work: go/);
  assert.equal(result.unableToAnswer, undefined);
});

test("flags concrete pour as no-go below the cold threshold", async () => {
  const result = await provider.interpret({
    capability: CAPABILITY_ID,
    records: [record(1, 0, "T2M"), record(3, 0, "WS2M")],
  });
  assert.match(result.summary, /Concrete pour: no-go/);
});

test("flags concrete pour as caution above the hot threshold", async () => {
  const result = await provider.interpret({
    capability: CAPABILITY_ID,
    records: [record(35, 0, "T2M"), record(3, 0, "WS2M")],
  });
  assert.match(result.summary, /Concrete pour: caution/);
});

test("flags crane operation and roofing work as no-go under high wind", async () => {
  const result = await provider.interpret({
    capability: CAPABILITY_ID,
    records: [record(20, 0, "T2M"), record(14, 0, "WS2M")],
  });
  assert.match(result.summary, /Crane operation: no-go/);
  assert.match(result.summary, /Roofing work: no-go/);
});

test("flags crane operation and roofing work as caution under elevated wind", async () => {
  const result = await provider.interpret({
    capability: CAPABILITY_ID,
    records: [record(20, 0, "T2M"), record(9, 0, "WS2M")],
  });
  assert.match(result.summary, /Crane operation: caution/);
  assert.match(result.summary, /Roofing work: caution/);
});

test("still assesses temperature-based activities when wind data is missing, and notes the gap", async () => {
  const result = await provider.interpret({
    capability: CAPABILITY_ID,
    records: [record(20, 0, "T2M")],
  });
  assert.match(result.summary, /Concrete pour: go/);
  assert.doesNotMatch(result.summary, /Crane operation/);
  assert.match(result.summary, /no wind speed data available/);
});

test("returns unableToAnswer, never a fabricated recommendation, when neither metric is present", async () => {
  const result = await provider.interpret({
    capability: CAPABILITY_ID,
    records: [record(0.5, 0, "T2M" as never)].slice(0, 0), // no records at all
  });
  assert.equal(result.confidence, "insufficient-data");
  assert.ok(result.unableToAnswer);
  assert.equal(result.contributingFactors.length, 0);
});

test("uses the most recent reading, not an average, when multiple days are present", async () => {
  const records = [record(1, 0, "T2M"), record(35, 1, "T2M"), record(3, 0, "WS2M")];
  const result = await provider.interpret({ capability: CAPABILITY_ID, records });
  assert.match(result.summary, /Concrete pour: caution/);
});

test("reports high confidence with 5+ readings of both metrics", async () => {
  const temps = [20, 21, 19, 20.5, 19.5].map((v, i) => record(v, i, "T2M"));
  const winds = [3, 4, 3.5, 2, 3].map((v, i) => record(v, i, "WS2M"));
  const result = await provider.interpret({
    capability: CAPABILITY_ID,
    records: [...temps, ...winds],
  });
  assert.equal(result.confidence, "high");
});

test("evaluate() matches ground truth when any activity is no-go", async () => {
  const { matchesGroundTruth } = await provider.evaluate(
    { capability: CAPABILITY_ID, records: [record(20, 0, "T2M"), record(14, 0, "WS2M")] },
    { anyNoGo: true },
  );
  assert.equal(matchesGroundTruth, true);
});

test("evaluate() reports a mismatch when ground truth disagrees", async () => {
  const { matchesGroundTruth } = await provider.evaluate(
    { capability: CAPABILITY_ID, records: [record(20, 0, "T2M"), record(3, 0, "WS2M")] },
    { anyNoGo: true },
  );
  assert.equal(matchesGroundTruth, false);
});

test("assesses excavation as go under normal precipitation", async () => {
  const result = await provider.interpret({
    capability: CAPABILITY_ID,
    records: [record(2, 0, "PRECTOTCORR")],
  });
  assert.match(result.summary, /Excavation \(flash-flood risk\): go/);
});

test("assesses excavation as caution under elevated precipitation", async () => {
  const result = await provider.interpret({
    capability: CAPABILITY_ID,
    records: [record(15, 0, "PRECTOTCORR")],
  });
  assert.match(result.summary, /Excavation \(flash-flood risk\): caution/);
});

test("assesses excavation as no-go under heavy precipitation", async () => {
  const result = await provider.interpret({
    capability: CAPABILITY_ID,
    records: [record(30, 0, "PRECTOTCORR")],
  });
  assert.match(result.summary, /Excavation \(flash-flood risk\): no-go/);
});

test("assesses excavation alongside temperature and wind activities when all three metrics are present", async () => {
  const result = await provider.interpret({
    capability: CAPABILITY_ID,
    records: [record(20, 0, "T2M"), record(3, 0, "WS2M"), record(2, 0, "PRECTOTCORR")],
  });
  assert.match(result.summary, /Concrete pour: go/);
  assert.match(result.summary, /Crane operation: go/);
  assert.match(result.summary, /Roofing work: go/);
  assert.match(result.summary, /Excavation \(flash-flood risk\): go/);
  assert.equal(result.unableToAnswer, undefined);
});

test("still assesses precipitation-only excavation risk when temperature and wind are both missing", async () => {
  const result = await provider.interpret({
    capability: CAPABILITY_ID,
    records: [record(30, 0, "PRECTOTCORR")],
  });
  assert.match(result.summary, /Excavation \(flash-flood risk\): no-go/);
  assert.doesNotMatch(result.summary, /Concrete pour/);
  assert.match(result.summary, /no temperature data available/);
  assert.match(result.summary, /no wind speed data available/);
  assert.equal(result.unableToAnswer, undefined);
});

test("rejects a request for a capability it doesn't support", async () => {
  await assert.rejects(
    () => provider.interpret({ capability: "not-a-real-capability", records: [] }),
    /does not support capability/,
  );
});
