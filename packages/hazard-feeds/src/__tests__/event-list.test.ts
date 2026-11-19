import { test } from "node:test";
import assert from "node:assert/strict";
import { rankFires, rankFloods } from "../event-list.js";
import type { GlobeFire } from "../fire-watch.js";
import type { FloodAlert, GlobeFlood } from "../floods.js";

function flood(id: string, alert: FloodAlert, startedAt: string): GlobeFlood {
  return {
    id,
    name: `Flood ${id}`,
    country: null,
    countryCode: null,
    latitude: 0,
    longitude: 0,
    alert,
    startedAt,
    endedAt: null,
    ongoing: true,
    reportUrl: `https://www.gdacs.org/report.aspx?eventid=${id}`,
  };
}

function fire(id: string, count: number, maxFrp: number | null): GlobeFire {
  return {
    id,
    latitude: 0,
    longitude: 0,
    count,
    maxFrp,
    confidence: "nominal",
    latestAcquiredAt: "2026-11-18T10:00:00Z",
    satellite: "N",
    nearby: [],
  };
}

test("floods: red before orange before green, newest first within a level", () => {
  const ranked = rankFloods([
    flood("1", "green", "2026-11-17T00:00:00Z"),
    flood("2", "red", "2026-11-10T00:00:00Z"),
    flood("3", "orange", "2026-11-12T00:00:00Z"),
    flood("4", "red", "2026-11-15T00:00:00Z"),
    flood("5", "green", "2026-11-18T00:00:00Z"),
  ]);
  assert.deepEqual(
    ranked.map((f) => f.id),
    ["4", "2", "3", "5", "1"],
  );
});

test("floods: a tie in level and start is broken by id so the order never jumps between refreshes", () => {
  const same = "2026-11-15T00:00:00Z";
  const a = rankFloods([flood("20", "red", same), flood("10", "red", same)]);
  const b = rankFloods([flood("10", "red", same), flood("20", "red", same)]);
  assert.deepEqual(
    a.map((f) => f.id),
    ["10", "20"],
  );
  assert.deepEqual(
    b.map((f) => f.id),
    ["10", "20"],
  );
});

test("fires: strongest heat first, an unknown output last, more detections break a tie", () => {
  const ranked = rankFires(
    [
      fire("a", 3, null),
      fire("b", 1, 40),
      fire("c", 9, 40),
      fire("d", 2, 120),
      fire("e", 50, null),
    ],
    10,
  );
  assert.deepEqual(
    ranked.map((f) => f.id),
    ["d", "c", "b", "e", "a"],
  );
});

test("fires: only the first `max` are kept, and a zero or negative max keeps none", () => {
  const many = Array.from({ length: 40 }, (_, i) => fire(`f${i}`, 1, i));
  const top = rankFires(many, 15);
  assert.equal(top.length, 15);
  assert.equal(top[0]!.id, "f39");
  assert.equal(rankFires(many, 0).length, 0);
  assert.equal(rankFires(many, -3).length, 0);
});

test("neither function changes the list it was given", () => {
  const floods = [
    flood("1", "green", "2026-11-17T00:00:00Z"),
    flood("2", "red", "2026-11-10T00:00:00Z"),
  ];
  const fires = [fire("a", 1, 1), fire("b", 1, 2)];
  rankFloods(floods);
  rankFires(fires, 5);
  assert.deepEqual(
    floods.map((f) => f.id),
    ["1", "2"],
  );
  assert.deepEqual(
    fires.map((f) => f.id),
    ["a", "b"],
  );
});
