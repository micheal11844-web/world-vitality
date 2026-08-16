import { test } from "node:test";
import assert from "node:assert/strict";
import { parseOpenMeteoResponse } from "../open-meteo-connector.js";

/**
 * A realistic Open-Meteo daily forecast response, shaped per the
 * documented API contract (daily.time[] aligned with
 * daily.temperature_2m_max[]/temperature_2m_min[] by index).
 *
 * Same honest caveat as the NASA connector's fixture: this sandbox
 * cannot reach api.open-meteo.com directly (outside its network
 * allowlist), so this is built from Open-Meteo's own published
 * documentation and response examples, not a live call. Re-running
 * against the live API from an environment with outbound access is
 * the remaining step to fully verify this end to end.
 */
const SAMPLE_RESPONSE = {
  daily: {
    time: ["2026-08-16", "2026-08-17", "2026-08-18"],
    temperature_2m_max: [28.4, 29.1, 27.0],
    temperature_2m_min: [18.2, 19.0, 17.5],
    wind_speed_10m_max: [4.2, 9.5, 14.1],
  },
  daily_units: { temperature_2m_max: "°C", wind_speed_10m_max: "m/s" },
};

const LOCATION = { id: "test-location", latitude: 7.3775, longitude: 3.947 };

test("normalizes daily high/low into a single averaged forecast record per day", () => {
  const { records } = parseOpenMeteoResponse("open-meteo", "Open-Meteo", LOCATION, SAMPLE_RESPONSE);

  const tempRecords = records.filter((r) => r.metric === "T2M");
  assert.equal(tempRecords.length, 3);
  const day1 = tempRecords.find((r) => r.timestamp.startsWith("2026-08-16"));
  assert.ok(day1);
  assert.equal(day1?.value, (28.4 + 18.2) / 2);
  assert.equal(day1?.unit, "°C");
});

test("also normalizes daily max wind speed into a WS2M forecast record per day, in m/s", () => {
  const { records } = parseOpenMeteoResponse("open-meteo", "Open-Meteo", LOCATION, SAMPLE_RESPONSE);

  const windRecords = records.filter((r) => r.metric === "WS2M");
  assert.equal(windRecords.length, 3);
  const day2 = windRecords.find((r) => r.timestamp.startsWith("2026-08-17"));
  assert.ok(day2);
  assert.equal(day2?.value, 9.5);
  assert.equal(day2?.unit, "m/s");
  assert.equal(day2?.recordType, "forecast");
});

test("does not produce a wind record, and does not report a gap, when wind data is absent", () => {
  const { records, gaps } = parseOpenMeteoResponse("open-meteo", "Open-Meteo", LOCATION, {
    daily: {
      time: ["2026-08-16"],
      temperature_2m_max: [28.4],
      temperature_2m_min: [18.2],
      // no wind_speed_10m_max at all — a temperature-only caller's shape
    },
    daily_units: { temperature_2m_max: "°C" },
  });
  assert.equal(records.filter((r) => r.metric === "WS2M").length, 0);
  assert.equal(gaps.length, 0);
});

test("every record is tagged recordType: forecast with a forecastIssuedAt", () => {
  const { records } = parseOpenMeteoResponse("open-meteo", "Open-Meteo", LOCATION, SAMPLE_RESPONSE);
  for (const r of records) {
    assert.equal(r.recordType, "forecast");
    assert.ok(r.forecastIssuedAt, "expected forecastIssuedAt to be set");
  }
});

test("records carry real provenance including the non-commercial-use limitation", () => {
  const { records } = parseOpenMeteoResponse("open-meteo", "Open-Meteo", LOCATION, SAMPLE_RESPONSE);
  const record = records[0]!;
  assert.equal(record.provenance.source, "open-meteo");
  assert.equal(record.provenance.license, "CC-BY-4.0");
  assert.ok(
    record.provenance.knownLimitations.some((l) => l.includes("non-commercial")),
    "expected a known limitation flagging the non-commercial-use license restriction",
  );
});

test("a day missing either high or low becomes an explicit gap, never a fabricated value", () => {
  const { records, gaps } = parseOpenMeteoResponse("open-meteo", "Open-Meteo", LOCATION, {
    daily: {
      time: ["2026-08-16", "2026-08-17"],
      temperature_2m_max: [28.4], // second day's high missing
      temperature_2m_min: [18.2, 19.0],
    },
    daily_units: { temperature_2m_max: "°C" },
  });
  assert.equal(records.length, 1);
  assert.equal(gaps.length, 1);
  assert.match(gaps[0]!.description, /2026-08-17/);
});

test("an API error response produces a gap, not a thrown exception or fabricated records", () => {
  const { records, gaps } = parseOpenMeteoResponse("open-meteo", "Open-Meteo", LOCATION, {
    error: true,
    reason: "Cannot initialize WeatherVariable from invalid parameter",
  });
  assert.equal(records.length, 0);
  assert.equal(gaps.length, 1);
  assert.match(gaps[0]!.description, /invalid parameter/);
});
