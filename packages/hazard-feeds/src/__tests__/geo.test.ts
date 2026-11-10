import { test } from "node:test";
import assert from "node:assert/strict";
import { CameraIndex, bearingDegrees, compassPoint, distanceKm } from "../geo.js";
import type { PublicCamera } from "../types.js";

const cam = (id: string, latitude: number, longitude: number): PublicCamera => ({
  id,
  providerId: "caltrans",
  name: id,
  latitude,
  longitude,
  imageUrl: `https://cwwp2.dot.ca.gov/${id}.jpg`,
  refreshMinutes: null,
});

test("distanceKm: known distances", () => {
  assert.equal(distanceKm(10, 10, 10, 10), 0);
  // London to Paris is about 344 km.
  assert.ok(Math.abs(distanceKm(51.5074, -0.1278, 48.8566, 2.3522) - 344) < 3);
  // One degree of latitude is about 111 km.
  assert.ok(Math.abs(distanceKm(0, 0, 1, 0) - 111.2) < 0.5);
  // Across the date line the short way round.
  assert.ok(distanceKm(0, 179.5, 0, -179.5) < 112);
});

test("bearingDegrees and compassPoint", () => {
  assert.ok(Math.abs(bearingDegrees(0, 0, 1, 0) - 0) < 0.01);
  assert.ok(Math.abs(bearingDegrees(0, 0, 0, 1) - 90) < 0.01);
  assert.ok(Math.abs(bearingDegrees(0, 0, -1, 0) - 180) < 0.01);
  assert.ok(Math.abs(bearingDegrees(0, 0, 0, -1) - 270) < 0.01);
  assert.equal(compassPoint(0), "N");
  assert.equal(compassPoint(359), "N");
  assert.equal(compassPoint(44), "NE");
  assert.equal(compassPoint(180), "S");
  assert.equal(compassPoint(-90), "W");
  assert.equal(compassPoint(315), "NW");
});

test("CameraIndex.near: nearest first, limited, inside the radius only", () => {
  const index = new CameraIndex([
    cam("far", 34.5, -118.24), // ~50 km north
    cam("near", 34.06, -118.24), // ~1 km
    cam("mid", 34.15, -118.24), // ~11 km
    cam("mid2", 34.2, -118.3), // ~18 km
  ]);
  const found = index.near(34.05, -118.24, { radiusKm: 25, limit: 3 });
  assert.deepEqual(
    found.map((f) => f.camera.id),
    ["near", "mid", "mid2"],
  );
  assert.ok(found[0] && found[0].distanceKm < 2);
  assert.ok(found[0] && Math.abs(found[0].bearingDegrees) < 1);
  assert.equal(index.near(34.05, -118.24, { radiusKm: 25, limit: 1 }).length, 1);
  assert.deepEqual(index.near(10, 10), []);
});

test("CameraIndex.near: finds cameras in the neighbouring grid cell and across the date line", () => {
  const edge = new CameraIndex([cam("east", 0.5, 179.9)]);
  assert.equal(edge.near(0.5, -179.95, { radiusKm: 25 })[0]?.camera.id, "east");
  const cells = new CameraIndex([cam("across-cell", 35.01, -118.99)]);
  assert.equal(cells.near(34.99, -119.01, { radiusKm: 10 }).length, 1);
});

test("CameraIndex.near: wide longitude search at high latitude", () => {
  const index = new CameraIndex([cam("fi", 66.5, 28.9)]);
  // 25 km east-west at 66.5 N spans more than one degree of longitude.
  assert.equal(index.near(66.5, 28.5, { radiusKm: 25 }).length, 1);
});
