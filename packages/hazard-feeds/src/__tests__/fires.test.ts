import { test } from "node:test";
import assert from "node:assert/strict";
import {
  capClusters,
  clusterFires,
  parseAcquiredAt,
  parseConfidence,
  parseFirmsCsv,
} from "../fires.js";
import type { FireDetectionPoint } from "../types.js";

const HEADER =
  "latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight";

test("parseConfidence: VIIRS letters, words, MODIS numbers, junk", () => {
  assert.equal(parseConfidence("h"), "high");
  assert.equal(parseConfidence("N"), "nominal");
  assert.equal(parseConfidence("l"), "low");
  assert.equal(parseConfidence("High"), "high");
  assert.equal(parseConfidence("85"), "high");
  assert.equal(parseConfidence("50"), "nominal");
  assert.equal(parseConfidence("10"), "low");
  assert.equal(parseConfidence(""), "low");
  assert.equal(parseConfidence("???"), "low");
});

test("parseAcquiredAt: pads the time, validates the date", () => {
  assert.equal(parseAcquiredAt("2026-11-09", "1304"), "2026-11-09T13:04:00.000Z");
  assert.equal(parseAcquiredAt("2026-11-09", "53"), "2026-11-09T00:53:00.000Z");
  assert.equal(parseAcquiredAt("2026-11-09", "0"), "2026-11-09T00:00:00.000Z");
  assert.equal(parseAcquiredAt("2026-02-31", "1200"), null);
  assert.equal(parseAcquiredAt("2026-11-09", "2460"), null);
  assert.equal(parseAcquiredAt("2026-11-09", "ab"), null);
  assert.equal(parseAcquiredAt("09/11/2026", "1200"), null);
  assert.equal(parseAcquiredAt("", ""), null);
});

test("parseFirmsCsv: reads rows by header name, tolerates CRLF and extra columns", () => {
  const csv = [
    HEADER,
    "34.1,-118.2,330.1,0.4,0.4,2026-11-09,1304,N,VIIRS,h,2.0NRT,290.2,12.5,D",
    "-33.9,151.2,320.0,0.4,0.4,2026-11-09,215,N,VIIRS,n,2.0NRT,290.2,,N",
    "",
  ].join("\r\n");
  const points = parseFirmsCsv(csv);
  assert.equal(points.length, 2);
  assert.deepEqual(points[0], {
    latitude: 34.1,
    longitude: -118.2,
    acquiredAt: "2026-11-09T13:04:00.000Z",
    satellite: "N",
    confidence: "high",
    frp: 12.5,
  });
  assert.equal(points[1]?.frp, null);
  assert.equal(points[1]?.acquiredAt, "2026-11-09T02:15:00.000Z");
});

test("parseFirmsCsv: different column order still works", () => {
  const csv = "confidence,acq_time,acq_date,longitude,latitude\nh,1200,2026-11-09,10.5,20.5";
  assert.equal(parseFirmsCsv(csv)[0]?.latitude, 20.5);
});

test("parseFirmsCsv: skips unreadable rows (empty coordinates are not 0, 0)", () => {
  const csv = [
    HEADER,
    ",,330,0.4,0.4,2026-11-09,1304,N,VIIRS,h,2.0NRT,290,1,D",
    "95,-118,330,0.4,0.4,2026-11-09,1304,N,VIIRS,h,2.0NRT,290,1,D",
    "34,-118,330,0.4,0.4,bad-date,1304,N,VIIRS,h,2.0NRT,290,1,D",
    "34,-118,330,0.4,0.4,2026-11-09,1304,N,VIIRS,h,2.0NRT,290,-5,D",
  ].join("\n");
  const points = parseFirmsCsv(csv);
  assert.equal(points.length, 1);
  assert.equal(points[0]?.frp, null);
});

test("parseFirmsCsv: a header with no rows is 'no detections'; anything else is an error", () => {
  assert.deepEqual(parseFirmsCsv(HEADER), []);
  assert.deepEqual(parseFirmsCsv(`${HEADER}\n`), []);
  assert.throws(() => parseFirmsCsv("Invalid MAP_KEY."));
  assert.throws(() => parseFirmsCsv(""));
  assert.throws(() => parseFirmsCsv("<html>Too many requests</html>"));
});

const point = (over: Partial<FireDetectionPoint> = {}): FireDetectionPoint => ({
  latitude: 34.05,
  longitude: -118.24,
  acquiredAt: "2026-11-09T10:00:00.000Z",
  satellite: "N",
  confidence: "nominal",
  frp: 5,
  ...over,
});

test("clusterFires: drops low confidence, folds a cell into one point", () => {
  const clusters = clusterFires([
    point({ latitude: 34.01, longitude: -118.21, frp: 5 }),
    point({ latitude: 34.03, longitude: -118.23, frp: 20, confidence: "high" }),
    point({ latitude: 34.02, longitude: -118.22, frp: 2, acquiredAt: "2026-11-09T12:00:00.000Z" }),
    point({ latitude: 34.02, longitude: -118.22, confidence: "low", frp: 99 }),
  ]);
  assert.equal(clusters.length, 1);
  const [c] = clusters;
  assert.ok(c);
  assert.equal(c.count, 3);
  assert.equal(c.maxFrp, 20);
  assert.equal(c.confidence, "high");
  assert.equal(c.latestAcquiredAt, "2026-11-09T12:00:00.000Z");
  assert.ok(Math.abs(c.latitude - 34.02) < 0.001);
  assert.ok(Math.abs(c.longitude - -118.22) < 0.001);
  assert.match(c.id, /^fire-\d+_\d+$/);
});

test("clusterFires: separate cells stay separate; order is strongest first; ids are stable", () => {
  const input = [
    point({ latitude: 10, longitude: 10, frp: 3 }),
    point({ latitude: 20, longitude: 20, frp: 50, confidence: "high" }),
    point({ latitude: 30, longitude: 30, frp: 80 }),
  ];
  const a = clusterFires(input);
  const b = clusterFires([...input].reverse());
  assert.deepEqual(
    a.map((c) => c.id),
    b.map((c) => c.id),
  );
  assert.deepEqual(
    a.map((c) => c.confidence),
    ["high", "nominal", "nominal"],
  );
  assert.equal(a[1]?.maxFrp, 80);
  assert.equal(clusterFires([]).length, 0);
});

test("clusterFires: handles points at the edges of the map", () => {
  const clusters = clusterFires([
    point({ latitude: 90, longitude: 180 }),
    point({ latitude: -90, longitude: -180 }),
  ]);
  assert.equal(clusters.length, 2);
});

test("capClusters: must-keep clusters survive the cap, the rest fill by strength", () => {
  const input = clusterFires([
    point({ latitude: 1, longitude: 1, frp: 100, confidence: "high" }),
    point({ latitude: 2, longitude: 2, frp: 90, confidence: "high" }),
    point({ latitude: 3, longitude: 3, frp: 1 }),
    point({ latitude: 4, longitude: 4, frp: 2 }),
  ]);
  const weakNearCamera = (c: { latitude: number }) => Math.round(c.latitude) === 3;
  const capped = capClusters(input, 2, weakNearCamera);
  assert.equal(capped.length, 2);
  assert.ok(capped.some((c) => Math.round(c.latitude) === 3));
  assert.ok(capped.some((c) => Math.round(c.latitude) === 1));
  assert.equal(capClusters(input, 10).length, 4);
  assert.equal(capClusters(input, 0).length, 0);
  assert.equal(capClusters(input, 1, () => true).length, 1);
});
