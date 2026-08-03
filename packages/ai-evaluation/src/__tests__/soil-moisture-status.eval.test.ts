import { test } from "node:test";
import { runEvaluationSuite, assertAllPassed, type EvaluationCase } from "../framework.js";
import {
  SoilMoistureStatusProvider,
  SOIL_MOISTURE_CAPABILITY_ID,
} from "@world-vitality/interpretation-engine";
import type { NormalizedDataRecord } from "@world-vitality/data-schemas";

function record(value: number, dayOffset: number): NormalizedDataRecord {
  const timestamp = new Date(Date.UTC(2024, 0, 1 + dayOffset)).toISOString();
  return {
    id: `ground-truth:GWETROOT:${dayOffset}`,
    metric: "GWETROOT",
    value,
    unit: "fraction",
    timestamp,
    provenance: {
      source: "ground-truth-fixture",
      sourceName: "Hand-labeled evaluation case",
      license: "CC-BY-4.0",
      retrievedAt: timestamp,
      knownLimitations: [],
    },
  };
}

/**
 * Hand-labeled ground-truth cases for `SoilMoistureStatusProvider`
 * (BUILD_PLAN ticket 4.2). Each `groundTruth.band` is what a correct
 * classification should produce given POWER's documented GWETROOT scale
 * (0=dry, 1=saturated) — these are direct readings of the documented
 * scale, not independently-sourced ground truth from a different
 * instrument. A stronger ground-truth set (e.g. compared against
 * in-situ soil sensor readings) is future work; this validates the
 * *classification logic* is internally consistent with what POWER's own
 * parameter documentation says, which is the bar ticket 4.2 asks for
 * before Stage 4's first capability is user-facing.
 */
const CASES: EvaluationCase[] = [
  {
    name: "very dry reading classifies as very-dry",
    request: { capability: SOIL_MOISTURE_CAPABILITY_ID, records: [record(0.05, 0)] },
    groundTruth: { band: "very-dry" },
  },
  {
    name: "dry reading classifies as dry",
    request: { capability: SOIL_MOISTURE_CAPABILITY_ID, records: [record(0.3, 0)] },
    groundTruth: { band: "dry" },
  },
  {
    name: "mid-range reading classifies as moderate",
    request: { capability: SOIL_MOISTURE_CAPABILITY_ID, records: [record(0.5, 0)] },
    groundTruth: { band: "moderate" },
  },
  {
    name: "high reading classifies as moist",
    request: { capability: SOIL_MOISTURE_CAPABILITY_ID, records: [record(0.7, 0)] },
    groundTruth: { band: "moist" },
  },
  {
    name: "near-1.0 reading classifies as saturated",
    request: { capability: SOIL_MOISTURE_CAPABILITY_ID, records: [record(0.98, 0)] },
    groundTruth: { band: "saturated" },
  },
  {
    name: "band boundary (exactly 0.2) falls into very-dry, not dry",
    request: { capability: SOIL_MOISTURE_CAPABILITY_ID, records: [record(0.2, 0)] },
    groundTruth: { band: "very-dry" },
  },
  {
    name: "most recent of multiple readings determines the band, not the average",
    request: {
      capability: SOIL_MOISTURE_CAPABILITY_ID,
      records: [record(0.9, 0), record(0.1, 1)],
    },
    groundTruth: { band: "very-dry" },
  },
];

test("soil-moisture-status-v1 passes its full ground-truth evaluation suite", async () => {
  const provider = new SoilMoistureStatusProvider();
  const summary = await runEvaluationSuite(provider, CASES);
  assertAllPassed(summary);
});
