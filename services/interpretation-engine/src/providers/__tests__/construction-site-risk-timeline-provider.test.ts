import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ConstructionSiteRiskTimelineProvider,
  CAPABILITY_ID,
} from "../construction-site-risk-timeline-provider.js";
import type { NormalizedDataRecord } from "@world-vitality/data-schemas";

const ISSUED_AT = new Date(Date.UTC(2026, 7, 16, 0, 0, 0)).toISOString();

function forecastRecord(
  metric: "T2M" | "WS2M",
  value: number,
  dayOffset: number,
): NormalizedDataRecord {
  const timestamp = new Date(Date.UTC(2026, 7, 16 + dayOffset, 12, 0, 0)).toISOString();
  return {
    id: `test:${metric}:${dayOffset}`,
    metric,
    value,
    unit: metric === "T2M" ? "°C" : "m/s",
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

const provider = new ConstructionSiteRiskTimelineProvider();

test("reports all-go when every forecast day is within normal thresholds", async () => {
  const records = [0, 1, 2].flatMap((d) => [
    forecastRecord("T2M", 20, d),
    forecastRecord("WS2M", 3, d),
  ]);
  const result = await provider.interpret({ capability: CAPABILITY_ID, records });
  assert.match(result.summary, /No caution or no-go days/);
  assert.equal(result.unableToAnswer, undefined);
});

test("flags specific dates with caution or no-go days", async () => {
  const records = [
    forecastRecord("T2M", 20, 0),
    forecastRecord("WS2M", 3, 0),
    forecastRecord("T2M", 1, 1), // cold pour day -> no-go
    forecastRecord("WS2M", 14, 1), // high wind -> no-go
  ];
  const result = await provider.interpret({ capability: CAPABILITY_ID, records });
  assert.match(result.summary, /1 of 2 day\(s\)/);
  assert.match(result.summary, /no-go/);
});

test("assigns high confidence when every day is short-range (<=3 days out)", async () => {
  const records = [0, 1, 2].flatMap((d) => [
    forecastRecord("T2M", 20, d),
    forecastRecord("WS2M", 3, d),
  ]);
  const result = await provider.interpret({ capability: CAPABILITY_ID, records });
  assert.equal(result.confidence, "high");
});

test("assigns low confidence when the furthest day is long-range (>7 days out)", async () => {
  const records = [0, 9].flatMap((d) => [
    forecastRecord("T2M", 20, d),
    forecastRecord("WS2M", 3, d),
  ]);
  const result = await provider.interpret({ capability: CAPABILITY_ID, records });
  assert.equal(result.confidence, "low");
});

test("still assesses a day with only temperature or only wind data", async () => {
  const records = [forecastRecord("T2M", 1, 0)]; // cold pour day, no wind data at all
  const result = await provider.interpret({ capability: CAPABILITY_ID, records });
  assert.equal(result.unableToAnswer, undefined);
  assert.match(result.explanation, /Concrete pour: no-go/);
});

test("ignores observed (non-forecast) records entirely", async () => {
  const observed: NormalizedDataRecord = {
    id: "observed:T2M:0",
    metric: "T2M",
    value: 1,
    unit: "°C",
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

test("returns unableToAnswer, never a fabricated timeline, when no forecast records exist", async () => {
  const result = await provider.interpret({ capability: CAPABILITY_ID, records: [] });
  assert.equal(result.confidence, "insufficient-data");
  assert.ok(result.unableToAnswer);
  assert.equal(result.contributingFactors.length, 0);
});

test("evaluate() matches ground truth when any day has a caution or no-go", async () => {
  const records = [forecastRecord("T2M", 1, 0), forecastRecord("WS2M", 3, 0)];
  const { matchesGroundTruth } = await provider.evaluate(
    { capability: CAPABILITY_ID, records },
    { anyRiskDay: true },
  );
  assert.equal(matchesGroundTruth, true);
});

test("rejects a request for a capability it doesn't support", async () => {
  await assert.rejects(
    () => provider.interpret({ capability: "not-a-real-capability", records: [] }),
    /does not support capability/,
  );
});
