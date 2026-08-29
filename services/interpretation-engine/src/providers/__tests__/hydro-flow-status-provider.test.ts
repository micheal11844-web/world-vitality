import { test } from "node:test";
import assert from "node:assert/strict";
import {
  HydroFlowStatusProvider,
  CAPABILITY_ID,
  classifyStreamflow,
} from "../hydro-flow-status-provider.js";
import type { NormalizedDataRecord } from "@world-vitality/data-schemas";

function record(cfs: number, dayOffset: number): NormalizedDataRecord {
  const timestamp = new Date(Date.UTC(2026, 0, 1 + dayOffset)).toISOString();
  return {
    id: `test:STREAMFLOW_DISCHARGE:${dayOffset}`,
    metric: "STREAMFLOW_DISCHARGE",
    value: cfs,
    unit: "ft3/s",
    timestamp,
    provenance: {
      source: "test",
      sourceName: "Test Fixture",
      license: "Public Domain (US Government Work)",
      retrievedAt: timestamp,
      knownLimitations: [],
    },
  };
}

const provider = new HydroFlowStatusProvider();

test("classifies low flow correctly", async () => {
  const result = await provider.interpret({ capability: CAPABILITY_ID, records: [record(500, 0)] });
  assert.match(result.summary, /^Low flow/);
});

test("classifies moderate flow correctly", async () => {
  const result = await provider.interpret({ capability: CAPABILITY_ID, records: [record(3000, 0)] });
  assert.match(result.summary, /^Moderate flow/);
});

test("classifies high flow correctly", async () => {
  const result = await provider.interpret({ capability: CAPABILITY_ID, records: [record(6000, 0)] });
  assert.match(result.summary, /^High flow/);
});

test("reports high confidence with 5+ readings", async () => {
  const records = [3000, 3100, 2900, 3050, 2950].map((v, i) => record(v, i));
  const result = await provider.interpret({ capability: CAPABILITY_ID, records });
  assert.equal(result.confidence, "high");
});

test("reports low confidence with a single reading", async () => {
  const result = await provider.interpret({ capability: CAPABILITY_ID, records: [record(3000, 0)] });
  assert.equal(result.confidence, "low");
});

test("uses the most recent reading, not an average, when multiple readings are present", async () => {
  const records = [record(500, 0), record(6000, 1)];
  const result = await provider.interpret({ capability: CAPABILITY_ID, records });
  assert.match(result.summary, /^High flow/);
});

test("returns unableToAnswer, never a fabricated value, when no streamflow records exist", async () => {
  const result = await provider.interpret({ capability: CAPABILITY_ID, records: [] });
  assert.equal(result.confidence, "insufficient-data");
  assert.ok(result.unableToAnswer);
  assert.equal(result.contributingFactors.length, 0);
});

test("evaluate() matches ground truth when the band agrees", async () => {
  const { matchesGroundTruth } = await provider.evaluate(
    { capability: CAPABILITY_ID, records: [record(6000, 0)] },
    { band: "high" },
  );
  assert.equal(matchesGroundTruth, true);
});

test("evaluate() reports a mismatch when the band disagrees", async () => {
  const { matchesGroundTruth } = await provider.evaluate(
    { capability: CAPABILITY_ID, records: [record(500, 0)] },
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

test("classifyStreamflow exposes band boundaries correctly, exported for reuse", () => {
  assert.equal(classifyStreamflow(999).band, "low");
  assert.equal(classifyStreamflow(1000).band, "moderate");
  assert.equal(classifyStreamflow(4999).band, "moderate");
  assert.equal(classifyStreamflow(5000).band, "high");
});
