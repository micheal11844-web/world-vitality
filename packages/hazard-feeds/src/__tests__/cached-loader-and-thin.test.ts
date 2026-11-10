import { test } from "node:test";
import assert from "node:assert/strict";
import { cachedLoader } from "../cached-loader.js";
import { thinCameras } from "../geo.js";
import type { PublicCamera } from "../types.js";

test("cachedLoader: reuses a good answer until it expires", async () => {
  let clock = 0;
  let calls = 0;
  const get = cachedLoader(async () => ++calls, 1000, { now: () => clock });
  assert.equal(await get(), 1);
  clock = 999;
  assert.equal(await get(), 1);
  clock = 1000;
  assert.equal(await get(), 2);
});

test("cachedLoader: callers during a load share it", async () => {
  let calls = 0;
  let release: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => (release = resolve));
  const get = cachedLoader(async () => {
    calls += 1;
    await gate;
    return "ok";
  }, 1000);
  const both = Promise.all([get(), get(), get()]);
  release();
  assert.deepEqual(await both, ["ok", "ok", "ok"]);
  assert.equal(calls, 1);
});

test("cachedLoader: a failure is not cached, and a stale answer beats an error", async () => {
  let clock = 0;
  let mode: "ok" | "fail" = "fail";
  const stale: unknown[] = [];
  const get = cachedLoader(
    async () => {
      if (mode === "fail") throw new Error("down");
      return "fresh";
    },
    1000,
    { now: () => clock, onStale: (err) => stale.push(err) },
  );
  await assert.rejects(get(), /down/);
  mode = "ok";
  assert.equal(await get(), "fresh");
  clock = 5000;
  mode = "fail";
  assert.equal(await get(), "fresh");
  assert.equal(stale.length, 1);
});

const cam = (
  id: string,
  providerId: PublicCamera["providerId"],
  lat: number,
  lon: number,
): PublicCamera => ({
  id,
  providerId,
  name: id,
  latitude: lat,
  longitude: lon,
  imageUrl: "https://cwwp2.dot.ca.gov/x.jpg",
  refreshMinutes: null,
});

test("thinCameras: one per cell, per-provider cap spread evenly, nothing altered", () => {
  const cluster = [cam("a", "tfl", 51.5101, -0.12), cam("b", "tfl", 51.5102, -0.121)];
  assert.equal(thinCameras(cluster).length, 1);

  const many: PublicCamera[] = [];
  for (let i = 0; i < 200; i += 1) many.push(cam(`c${i}`, "caltrans", 30 + i * 0.1, -120));
  const thinned = thinCameras(many, { maxPerProvider: 50 });
  assert.equal(thinned.length, 50);
  // Spread over the whole list, not just its start.
  assert.ok(thinned.some((c) => Number(c.id.slice(1)) >= 150));
  assert.ok(thinned.every((c) => many.includes(c)));
  assert.equal(thinCameras([]).length, 0);
});
