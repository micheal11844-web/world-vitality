import { test } from "node:test";
import assert from "node:assert/strict";
import { heatNearPlaces, parseGlobeFocus, type WatchedPlace } from "../heat-near.js";
import { distanceKm } from "../geo.js";
import type { FireConfidence, FireDetectionPoint } from "../types.js";

const NOW = new Date("2026-11-12T12:00:00Z");

const KANO: WatchedPlace = { id: "home", label: "Kano, Nigeria", latitude: 12.0, longitude: 8.52 };
const FARM: WatchedPlace = {
  id: "agriculture-1",
  label: "North field",
  latitude: 7.4,
  longitude: 3.9,
};

function detection(
  latitude: number,
  longitude: number,
  { hoursAgo = 2, confidence = "nominal" }: { hoursAgo?: number; confidence?: FireConfidence } = {},
): FireDetectionPoint {
  return {
    latitude,
    longitude,
    acquiredAt: new Date(NOW.getTime() - hoursAgo * 3_600_000).toISOString(),
    satellite: "N20",
    confidence,
    frp: 4,
  };
}

test("a detection a few kilometres away is found, with its distance and time", () => {
  const near = detection(12.03, 8.52);
  const result = heatNearPlaces([near], [KANO], { now: NOW });
  assert.equal(result.length, 1);
  assert.equal(result[0]?.place.id, "home");
  assert.equal(result[0]?.detections, 1);
  assert.ok(Math.abs((result[0]?.nearestKm ?? 0) - distanceKm(12, 8.52, 12.03, 8.52)) < 0.01);
  assert.equal(result[0]?.nearest.acquiredAt, near.acquiredAt);
});

test("the radius is a real distance: 9 km counts, 11 km does not", () => {
  // One degree of latitude is about 111 km.
  const nine = detection(12 + 9 / 111.2, 8.52);
  const eleven = detection(12 + 11 / 111.2, 8.52);
  assert.equal(heatNearPlaces([nine], [KANO], { now: NOW }).length, 1);
  assert.equal(heatNearPlaces([eleven], [KANO], { now: NOW }).length, 0);
  assert.equal(heatNearPlaces([eleven], [KANO], { now: NOW, radiusKm: 15 }).length, 1);
});

test("east-west distance accounts for the shrinking of longitude away from the equator", () => {
  const high: WatchedPlace = { id: "high", label: "North", latitude: 60, longitude: 10 };
  // 0.25° of longitude at 60°N is about 13.9 km: outside 10 km, though only 0.25° away.
  assert.equal(heatNearPlaces([detection(60, 10.25)], [high], { now: NOW }).length, 0);
  // 0.15° is about 8.3 km: inside.
  assert.equal(heatNearPlaces([detection(60, 10.15)], [high], { now: NOW }).length, 1);
});

test("a place near the date line sees detections across it", () => {
  const fiji: WatchedPlace = { id: "fj", label: "Taveuni", latitude: -16.9, longitude: 179.98 };
  assert.equal(heatNearPlaces([detection(-16.9, -179.98)], [fiji], { now: NOW }).length, 1);
});

test("low-confidence, old and future-dated detections never raise an alert", () => {
  const places = [KANO];
  assert.equal(
    heatNearPlaces([detection(12.01, 8.52, { confidence: "low" })], places, { now: NOW }).length,
    0,
  );
  assert.equal(
    heatNearPlaces([detection(12.01, 8.52, { hoursAgo: 30 })], places, { now: NOW }).length,
    0,
  );
  assert.equal(
    heatNearPlaces([detection(12.01, 8.52, { hoursAgo: -3 })], places, { now: NOW }).length,
    0,
  );
  const bad = { ...detection(12.01, 8.52), acquiredAt: "not a time" };
  assert.equal(heatNearPlaces([bad], places, { now: NOW }).length, 0);
  // High and nominal both count.
  assert.equal(
    heatNearPlaces([detection(12.01, 8.52, { confidence: "high" })], places, { now: NOW }).length,
    1,
  );
});

test("each place reports its own nearest detection and its own count", () => {
  const points = [
    detection(12.05, 8.52),
    detection(12.02, 8.52),
    detection(12.06, 8.56),
    detection(7.41, 3.9),
    detection(30, 30),
  ];
  const result = heatNearPlaces(points, [KANO, FARM], { now: NOW });
  assert.deepEqual(
    result.map((r) => [r.place.id, r.detections]),
    [
      ["home", 3],
      ["agriculture-1", 1],
    ],
  );
  assert.equal(result[0]?.nearest.latitude, 12.02);
});

test("a place with nothing near is left out, and bad places or an empty feed give nothing", () => {
  assert.deepEqual(heatNearPlaces([detection(30, 30)], [KANO], { now: NOW }), []);
  assert.deepEqual(heatNearPlaces([], [KANO], { now: NOW }), []);
  assert.deepEqual(heatNearPlaces([detection(12, 8.52)], [], { now: NOW }), []);
  const broken: WatchedPlace = { id: "x", label: "x", latitude: Number.NaN, longitude: 0 };
  const outOfRange: WatchedPlace = { id: "y", label: "y", latitude: 95, longitude: 0 };
  assert.deepEqual(heatNearPlaces([detection(12, 8.52)], [broken, outOfRange], { now: NOW }), []);
});

test("a day of world detections against a few places is quick", () => {
  const points: FireDetectionPoint[] = [];
  for (let i = 0; i < 300_000; i += 1) {
    points.push(detection(-60 + (i % 1200) / 10, -180 + (i % 3600) / 10));
  }
  const started = Date.now();
  heatNearPlaces(points, [KANO, FARM], { now: NOW });
  assert.ok(Date.now() - started < 1500, "took longer than 1.5 s");
});

test("a heat alert's link is read into a point, and nothing else is", () => {
  assert.deepEqual(parseGlobeFocus("7.412,3.906"), { latitude: 7.412, longitude: 3.906 });
  assert.deepEqual(parseGlobeFocus("-16.9,-179.98"), { latitude: -16.9, longitude: -179.98 });
  assert.deepEqual(parseGlobeFocus("0,0"), { latitude: 0, longitude: 0 });
  for (const bad of [
    undefined,
    null,
    "",
    "7.4",
    "7.4,3.9,1",
    "7.4, 3.9",
    "a,b",
    "91,0",
    "0,181",
    "7.4,3.9<script>",
    "1e2,3",
    "7.4,3.1234567",
    ["7.4,3.9"],
    "NaN,NaN",
  ]) {
    assert.equal(parseGlobeFocus(bad as string | null | undefined), null, String(bad));
  }
});
