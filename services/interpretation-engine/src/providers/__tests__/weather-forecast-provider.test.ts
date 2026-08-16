import { test } from "node:test";
import assert from "node:assert/strict";
import { WeatherForecastProvider, CAPABILITY_ID } from "../weather-forecast-provider.js";
import type { NormalizedDataRecord } from "@world-vitality/data-schemas";

function forecastRecord(value: number, leadDays: number, issuedAt: string): NormalizedDataRecord {
  const timestamp = new Date(
    new Date(issuedAt).getTime() + leadDays * 24 * 60 * 60 * 1000,
  ).toISOString();
  return {
    id: `test:T2M:${leadDays}`,
    metric: "T2M",
    value,
    unit: "C",
    timestamp,
    recordType: "forecast",
    forecastIssuedAt: issuedAt,
    provenance: {
      source: "test",
      sourceName: "Test Fixture",
      license: "CC-BY-4.0",
      retrievedAt: issuedAt,
      knownLimitations: [],
    },
  };
}

const provider = new WeatherForecastProvider();
const ISSUED = "2026-08-15T00:00:00.000Z";

test("a short-range-only forecast (<=3 days) gets high confidence", async () => {
  const records = [1, 2, 3].map((d) => forecastRecord(25, d, ISSUED));
  const result = await provider.interpret({ capability: CAPABILITY_ID, records });
  assert.equal(result.confidence, "high");
});

test("a forecast extending past 7 days gets low confidence, driven by the furthest-out day", async () => {
  const records = [1, 2, 10].map((d) => forecastRecord(25, d, ISSUED));
  const result = await provider.interpret({ capability: CAPABILITY_ID, records });
  assert.equal(result.confidence, "low");
  assert.match(result.summary, /indicative only/);
});

test("a forecast up to exactly 7 days gets moderate confidence", async () => {
  const records = [4, 7].map((d) => forecastRecord(25, d, ISSUED));
  const result = await provider.interpret({ capability: CAPABILITY_ID, records });
  assert.equal(result.confidence, "moderate");
});

test("detects a rising trend from first to last day", async () => {
  const records = [forecastRecord(20, 1, ISSUED), forecastRecord(28, 5, ISSUED)];
  const result = await provider.interpret({ capability: CAPABILITY_ID, records });
  assert.match(result.summary, /rising/);
});

test("detects a falling trend from first to last day", async () => {
  const records = [forecastRecord(28, 1, ISSUED), forecastRecord(20, 5, ISSUED)];
  const result = await provider.interpret({ capability: CAPABILITY_ID, records });
  assert.match(result.summary, /falling/);
});

test("ignores observed (non-forecast) records entirely, never mixing them into the gradient", async () => {
  const observed: NormalizedDataRecord = {
    id: "test:observed",
    metric: "T2M",
    value: 99, // deliberately extreme, to prove it's excluded rather than skewing the trend
    unit: "C",
    timestamp: ISSUED,
    provenance: {
      source: "test",
      sourceName: "Test",
      license: "CC-BY-4.0",
      retrievedAt: ISSUED,
      knownLimitations: [],
    },
  };
  const records = [observed, forecastRecord(20, 1, ISSUED), forecastRecord(21, 2, ISSUED)];
  const result = await provider.interpret({ capability: CAPABILITY_ID, records });
  assert.match(result.summary, /steady/);
});

test("returns unableToAnswer, never a fabricated trend, when no forecast records exist", async () => {
  const result = await provider.interpret({ capability: CAPABILITY_ID, records: [] });
  assert.equal(result.confidence, "insufficient-data");
  assert.ok(result.unableToAnswer);
});

test("rejects requests for a capability it doesn't support", async () => {
  await assert.rejects(
    () => provider.interpret({ capability: "something-else", records: [] }),
    /does not support capability/,
  );
});
