import { test } from "node:test";
import assert from "node:assert/strict";
import { parseNwisResponse, STREAMFLOW_METRIC } from "../usgs-streamflow-connector.js";

/**
 * A realistic USGS NWIS Instantaneous Values (IV) JSON response, shaped
 * per the service's documented WaterML-JSON contract (one time series,
 * sourceInfo.geoLocation for the real station coordinates, variable.unit
 * for the reported unit, values[0].value[] for the observations, each
 * carrying its own qualifier codes — "A" for approved, "P" for
 * provisional). Same "built from documented API shape, not a live call"
 * caveat as `nasa-power-connector.test.ts`'s fixture — this sandbox
 * cannot reach waterservices.usgs.gov directly.
 */
const SAMPLE_RESPONSE = {
  value: {
    timeSeries: [
      {
        sourceInfo: {
          geoLocation: { geogLocation: { latitude: 38.94974, longitude: -77.12786 } },
        },
        variable: { unit: { unitCode: "ft3/s" } },
        values: [
          {
            value: [
              { value: "4170.0", qualifiers: ["A"], dateTime: "2026-08-01T04:00:00.000-04:00" },
              { value: "4250.0", qualifiers: ["P"], dateTime: "2026-08-01T04:15:00.000-04:00" },
            ],
          },
        ],
      },
    ],
  },
};

const STATION = { id: "potomac-little-falls", siteNumber: "01646500", latitude: 0, longitude: 0 };

test("normalizes real-shaped NWIS values into NormalizedDataRecords with full provenance", () => {
  const { records } = parseNwisResponse("usgs-nwis-streamflow", "USGS NWIS", STATION, SAMPLE_RESPONSE);

  assert.equal(records.length, 2);
  const first = records[0]!;
  assert.equal(first.metric, STREAMFLOW_METRIC);
  assert.equal(first.value, 4170.0);
  assert.equal(first.unit, "ft3/s");
  assert.equal(first.provenance.source, "usgs-nwis-streamflow");
  assert.equal(first.provenance.license, "Public Domain (US Government Work)");
  assert.ok(first.provenance.knownLimitations.length);
});

test("uses the response's own reported station coordinates, not the configured fallback", () => {
  const { records } = parseNwisResponse("usgs-nwis-streamflow", "USGS NWIS", STATION, SAMPLE_RESPONSE);
  assert.equal(records[0]?.location?.latitude, 38.94974);
  assert.equal(records[0]?.location?.longitude, -77.12786);
});

test("marks a provisional (qualifier 'P') value's limitation honestly, never silently upgraded", () => {
  const { records } = parseNwisResponse("usgs-nwis-streamflow", "USGS NWIS", STATION, SAMPLE_RESPONSE);
  const provisional = records.find((r) => r.value === 4250.0);
  assert.ok(provisional?.provenance.knownLimitations.some((l) => l.includes("provisional")));
  const approved = records.find((r) => r.value === 4170.0);
  assert.ok(!approved?.provenance.knownLimitations.some((l) => l.includes("provisional")));
});

test("falls back to the configured lat/lon when the response has no geoLocation", () => {
  const responseWithoutGeo = {
    value: {
      timeSeries: [
        {
          variable: { unit: { unitCode: "ft3/s" } },
          values: [{ value: [{ value: "100.0", qualifiers: ["A"], dateTime: "2026-08-01T00:00:00Z" }] }],
        },
      ],
    },
  };
  const { records } = parseNwisResponse(
    "usgs-nwis-streamflow",
    "USGS NWIS",
    { id: "fallback-station", siteNumber: "00000000", latitude: 12.3, longitude: 45.6 },
    responseWithoutGeo,
  );
  assert.equal(records[0]?.location?.latitude, 12.3);
  assert.equal(records[0]?.location?.longitude, 45.6);
});

test("reports an explicit gap, never a fabricated record, when no time series data exists", () => {
  const { records, gaps } = parseNwisResponse("usgs-nwis-streamflow", "USGS NWIS", STATION, {
    value: { timeSeries: [] },
  });
  assert.equal(records.length, 0);
  assert.equal(gaps.length, 1);
  assert.equal(gaps[0]?.reason, "field-missing-at-source");
});

test("reports a gap for a non-numeric value rather than a fabricated one", () => {
  const malformed = {
    value: {
      timeSeries: [
        {
          variable: { unit: { unitCode: "ft3/s" } },
          values: [{ value: [{ value: "Eqp", qualifiers: ["A"], dateTime: "2026-08-01T00:00:00Z" }] }],
        },
      ],
    },
  };
  const { records, gaps } = parseNwisResponse("usgs-nwis-streamflow", "USGS NWIS", STATION, malformed);
  assert.equal(records.length, 0);
  assert.equal(gaps.length, 1);
  assert.equal(gaps[0]?.reason, "malformed-response");
});
