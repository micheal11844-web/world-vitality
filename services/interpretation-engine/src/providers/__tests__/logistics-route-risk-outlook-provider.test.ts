import { test } from "node:test";
import assert from "node:assert/strict";
import {
  LogisticsRouteRiskOutlookProvider,
  CAPABILITY_ID,
} from "../logistics-route-risk-outlook-provider.js";
import type { NormalizedDataRecord } from "@world-vitality/data-schemas";

const ISSUED_AT = new Date(Date.UTC(2026, 7, 16, 0, 0, 0)).toISOString();

function forecastRecord(windMs: number, dayOffset: number): NormalizedDataRecord {
  const timestamp = new Date(Date.UTC(2026, 7, 16 + dayOffset, 12, 0, 0)).toISOString();
  return {
    id: `test:WS2M:${dayOffset}`,
    metric: "WS2M",
    value: windMs,
    unit: "m/s",
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

const provider = new LogisticsRouteRiskOutlookProvider();

test("summarizes a severe-risk-heavy outlook", async () => {
  const records = [0, 1, 2].map((d) => forecastRecord(22, d));
  const result = await provider.interpret({ capability: CAPABILITY_ID, records });
  assert.match(result.summary, /3 day\(s\) at severe risk/);
});

test("flags severe days distinctly from clear days", async () => {
  const records = [forecastRecord(22, 0), forecastRecord(3, 1)];
  const result = await provider.interpret({ capability: CAPABILITY_ID, records });
  assert.match(result.summary, /1 day\(s\) at severe risk/);
  assert.match(result.summary, /1 day\(s\) clear/);
});

test("assigns high confidence when every day is short-range", async () => {
  const records = [0, 1, 2].map((d) => forecastRecord(10, d));
  const result = await provider.interpret({ capability: CAPABILITY_ID, records });
  assert.equal(result.confidence, "high");
});

test("assigns low confidence when the furthest day is long-range", async () => {
  const records = [forecastRecord(10, 0), forecastRecord(10, 9)];
  const result = await provider.interpret({ capability: CAPABILITY_ID, records });
  assert.equal(result.confidence, "low");
});

test("ignores observed (non-forecast) records entirely, never mixing them into the outlook", async () => {
  const observed: NormalizedDataRecord = {
    id: "observed:WS2M:0",
    metric: "WS2M",
    value: 5,
    unit: "m/s",
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

test("evaluate() matches ground truth when any day hits severe risk", async () => {
  const { matchesGroundTruth } = await provider.evaluate(
    { capability: CAPABILITY_ID, records: [forecastRecord(22, 0)] },
    { anySevere: true },
  );
  assert.equal(matchesGroundTruth, true);
});

test("rejects a request for a capability it doesn't support", async () => {
  await assert.rejects(
    () => provider.interpret({ capability: "not-a-real-capability", records: [] }),
    /does not support capability/,
  );
});
