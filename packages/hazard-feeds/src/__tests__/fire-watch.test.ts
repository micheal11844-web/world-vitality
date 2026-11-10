import { test } from "node:test";
import assert from "node:assert/strict";
import { buildFireWatch } from "../fire-watch.js";
import type { FireDetectionPoint, PublicCamera } from "../types.js";

const detection = (
  latitude: number,
  longitude: number,
  over: Partial<FireDetectionPoint> = {},
): FireDetectionPoint => ({
  latitude,
  longitude,
  acquiredAt: "2026-11-09T10:00:00.000Z",
  satellite: "N",
  confidence: "nominal",
  frp: 5,
  ...over,
});

const camera = (id: string, latitude: number, longitude: number): PublicCamera => ({
  id,
  providerId: "caltrans",
  name: id,
  latitude,
  longitude,
  imageUrl: "https://cwwp2.dot.ca.gov/x.jpg",
  refreshMinutes: null,
});

test("buildFireWatch: attaches nearby cameras and keeps camera-covered fires through the cap", () => {
  const points = [
    detection(34.0, -118.0, { frp: 1 }), // weak, but a camera is close
    detection(10, 10, { frp: 90, confidence: "high" }),
    detection(20, 20, { frp: 80, confidence: "high" }),
    detection(-30, 120, { frp: 70, confidence: "high" }),
  ];
  const watch = buildFireWatch(points, [camera("near", 34.05, -118.0), camera("far", 40, -100)], {
    maxFires: 2,
  });
  assert.equal(watch.totalClusters, 4);
  assert.equal(watch.totalDetections, 4);
  assert.equal(watch.fires.length, 2);
  const withCamera = watch.fires.find((f) => f.nearby.length > 0);
  assert.ok(withCamera, "the camera-covered fire survived the cap");
  assert.equal(withCamera.nearby[0]?.camera.id, "near");
  assert.ok((withCamera.nearby[0]?.distanceKm ?? 99) < 10);
  assert.ok(watch.fires.some((f) => f.maxFrp === 90));
});

test("buildFireWatch: low-confidence detections are not counted; no cameras still works", () => {
  const watch = buildFireWatch(
    [detection(1, 1, { confidence: "low" }), detection(2, 2), detection(2.01, 2.01)],
    [],
  );
  assert.equal(watch.totalDetections, 2);
  assert.equal(watch.fires.length, 1);
  assert.deepEqual(watch.fires[0]?.nearby, []);
  assert.deepEqual(buildFireWatch([], []), { fires: [], totalDetections: 0, totalClusters: 0 });
});
