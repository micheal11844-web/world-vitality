import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePowerResponse } from "../nasa-power-connector.js";

/**
 * A realistic POWER "daily point" JSON response, shaped per the documented
 * API contract (properties.parameter[METRIC][YYYYMMDD] = value, header
 * .fill_value as the missing-data sentinel, parameters[METRIC].units).
 * Includes one deliberately missing day (2024-01-02's T2M) to exercise
 * gap detection.
 *
 * This is what actually validates the ingestion → schema pipeline end to
 * end (BUILD_PLAN ticket 2.3): the sandbox this was built in cannot reach
 * power.larc.nasa.gov directly (outside its network allowlist), so this
 * fixture — built from NASA's published API documentation and response
 * examples rather than a live call — is what stands in for it. Re-running
 * this connector against the live API from an environment with outbound
 * access (e.g. via Claude Code) is the remaining step to fully close out
 * 2.3.
 */
const SAMPLE_RESPONSE = {
  properties: {
    parameter: {
      T2M: {
        "20240101": 21.43,
        "20240102": -999, // fill value — no data for this day
      },
      RH2M: {
        "20240101": 62.1,
        "20240102": 58.9,
      },
    },
  },
  header: { fill_value: -999 },
  parameters: {
    T2M: { units: "C", longname: "Temperature at 2 Meters" },
    RH2M: { units: "%", longname: "Relative Humidity at 2 Meters" },
  },
} as const;

const LOCATION = { id: "test-farm", latitude: -27.48, longitude: 151.81 };

test("normalizes real-shaped POWER values into NormalizedDataRecords with full provenance", () => {
  const { records } = parsePowerResponse("nasa-power", "NASA POWER", LOCATION, SAMPLE_RESPONSE);

  const t2mJan1 = records.find((r) => r.metric === "T2M" && r.timestamp.startsWith("2024-01-01"));
  assert.ok(t2mJan1, "expected a T2M record for 2024-01-01");
  assert.equal(t2mJan1?.value, 21.43);
  assert.equal(t2mJan1?.unit, "C");
  assert.equal(t2mJan1?.provenance.source, "nasa-power");
  assert.equal(t2mJan1?.provenance.license, "public-domain");
  assert.ok(t2mJan1?.provenance.knownLimitations.length);
  assert.equal(t2mJan1?.location?.latitude, LOCATION.latitude);
});

test("treats the fill-value sentinel as an explicit gap, never a fabricated value", () => {
  const { records, gaps } = parsePowerResponse(
    "nasa-power",
    "NASA POWER",
    LOCATION,
    SAMPLE_RESPONSE,
  );

  const t2mJan2 = records.find((r) => r.metric === "T2M" && r.timestamp.startsWith("2024-01-02"));
  assert.equal(t2mJan2, undefined, "fill-value day must not produce a record");

  const gap = gaps.find((g) => g.description.includes("T2M") && g.description.includes("20240102"));
  assert.ok(gap, "expected an explicit gap for the fill-value day");
  assert.equal(gap?.reason, "field-missing-at-source");
});

test("does not create gaps or records for metrics/days with real values", () => {
  const { records, gaps } = parsePowerResponse(
    "nasa-power",
    "NASA POWER",
    LOCATION,
    SAMPLE_RESPONSE,
  );

  // 3 real values total (T2M/01-01, RH2M/01-01, RH2M/01-02) + 1 gap (T2M/01-02)
  assert.equal(records.length, 3);
  assert.equal(gaps.length, 1);
});
