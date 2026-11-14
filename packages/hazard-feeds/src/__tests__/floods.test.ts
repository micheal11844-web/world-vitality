import { test } from "node:test";
import assert from "node:assert/strict";
import {
  GdacsFormatError,
  gdacsFloodListUrl,
  parseGdacsDate,
  parseGdacsFloods,
  FLOOD_MAX_AGE_DAYS,
  MAX_FLOODS,
} from "../floods.js";

// A feature shaped like the ones read from the live GDACS list on 2026-11-13
// (field names and value types as seen there; not a byte-for-byte copy).
function feature(over: Record<string, unknown> = {}, coordinates: unknown = [78.6099, 11.3324]) {
  return {
    type: "Feature",
    bbox: [78.6099, 11.3324, 78.6099, 11.3324],
    geometry: { type: "Point", coordinates },
    properties: {
      eventtype: "FL",
      eventid: 1104121,
      episodeid: 22,
      eventname: "",
      glide: "FL-2026-000165-IND",
      name: "Flood in India",
      description: "Flood in India",
      alertlevel: "Orange",
      alertscore: 2,
      episodealertlevel: "Green",
      episodealertscore: 0.5,
      istemporary: "false",
      iscurrent: "false",
      country: "India",
      fromdate: "2026-11-02T01:00:00",
      todate: "2026-11-09T01:00:00",
      datemodified: "2026-11-10T06:51:33",
      iso3: "IND",
      source: "GLOFAS",
      affectedcountries: [{ iso2: "IN", iso3: "IND", countryname: "India" }],
      severitydata: { severity: 0.0, severitytext: "", severityunit: "" },
      url: {
        report: "https://www.gdacs.org/report.aspx?eventid=1104121&episodeid=22&eventtype=FL",
      },
      ...over,
    },
  };
}

const drought = {
  type: "Feature",
  geometry: { type: "Point", coordinates: [31.76, 9.405] },
  properties: {
    eventtype: "DR",
    eventid: 1027450,
    episodeid: 13,
    alertlevel: "Orange",
    iscurrent: "false",
    fromdate: "2026-05-21T00:00:00",
    todate: "2026-11-12T08:29:24",
  },
};

const NOW = new Date("2026-11-13T12:00:00Z");
const collection = (...features: unknown[]) => ({ type: "FeatureCollection", features });

test("parseGdacsFloods: picks only flood events out of a mixed list", () => {
  const result = parseGdacsFloods(collection(drought, feature(), { ...drought }), { now: NOW });
  assert.equal(result.features, 3);
  assert.equal(result.floodEvents, 1);
  assert.equal(result.floods.length, 1);
  const flood = result.floods[0]!;
  assert.equal(flood.id, "1104121");
  assert.equal(flood.name, "Flood in India");
  assert.equal(flood.country, "India");
  assert.equal(flood.countryCode, "IN");
  assert.equal(flood.alert, "orange");
  // Longitude first, then latitude, as GeoJSON has it.
  assert.equal(flood.longitude, 78.6099);
  assert.equal(flood.latitude, 11.3324);
  assert.equal(flood.ongoing, false);
});

test("parseGdacsFloods: dates without a zone are read as UTC", () => {
  const flood = parseGdacsFloods(collection(feature()), { now: NOW }).floods[0]!;
  assert.equal(flood.startedAt, "2026-11-02T01:00:00.000Z");
  assert.equal(flood.endedAt, "2026-11-09T01:00:00.000Z");
  assert.equal(parseGdacsDate("2026-11-12T08:29:24"), Date.UTC(2026, 10, 12, 8, 29, 24));
  assert.equal(parseGdacsDate("2026-11-12T08:29:24Z"), Date.UTC(2026, 10, 12, 8, 29, 24));
  assert.equal(parseGdacsDate("2026-11-12T09:29:24+01:00"), Date.UTC(2026, 10, 12, 8, 29, 24));
  assert.equal(parseGdacsDate("12 Nov 2026"), null);
  assert.equal(parseGdacsDate(""), null);
  assert.equal(parseGdacsDate(null), null);
  assert.equal(parseGdacsDate(20261112), null);
});

test("parseGdacsFloods: the recency rule is ours, not the request window's", () => {
  const ended = (todate: string, datemodified: string, extra: Record<string, unknown> = {}) =>
    feature({ eventid: 1, todate, datemodified, fromdate: "2026-08-09T01:00:00", ...extra });
  // Ended 37 days ago and last updated 33 days ago: gone (these were in the real answer).
  assert.equal(
    parseGdacsFloods(collection(ended("2026-10-07T01:00:00", "2026-10-11T06:51:33")), { now: NOW })
      .floods.length,
    0,
  );
  // Ended 13 days ago: kept; 15 days ago: gone.
  assert.equal(
    parseGdacsFloods(collection(ended("2026-10-31T12:00:00", "2026-10-31T12:00:00")), { now: NOW })
      .floods.length,
    1,
  );
  assert.equal(
    parseGdacsFloods(collection(ended("2026-10-29T11:00:00", "2026-10-29T11:00:00")), { now: NOW })
      .floods.length,
    0,
  );
  // An old end date but a fresh update still counts as recent.
  assert.equal(
    parseGdacsFloods(collection(ended("2026-10-07T01:00:00", "2026-11-12T06:00:00")), { now: NOW })
      .floods.length,
    1,
  );
  // Still going stays, however long ago it started.
  const going = parseGdacsFloods(
    collection(ended("2026-10-07T01:00:00", "2026-10-11T06:51:33", { iscurrent: "true" })),
    { now: NOW },
  );
  assert.equal(going.floods.length, 1);
  assert.equal(going.floods[0]!.ongoing, true);
  assert.equal(FLOOD_MAX_AGE_DAYS, 14);
});

test("parseGdacsFloods: a real boolean for iscurrent works, an odd string does not", () => {
  const old = { todate: "2026-09-01T00:00:00", datemodified: "2026-09-01T00:00:00" };
  assert.equal(
    parseGdacsFloods(collection(feature({ ...old, iscurrent: true })), { now: NOW }).floods.length,
    1,
  );
  assert.equal(
    parseGdacsFloods(collection(feature({ ...old, iscurrent: "yes" })), { now: NOW }).floods.length,
    0,
  );
});

test("parseGdacsFloods: events that start more than a day ahead are not shown", () => {
  const future = feature({ fromdate: "2026-11-20T00:00:00", todate: "2026-11-25T00:00:00" });
  assert.equal(parseGdacsFloods(collection(future), { now: NOW }).floods.length, 0);
});

test("parseGdacsFloods: unusable events are skipped and counted, never thrown", () => {
  const result = parseGdacsFloods(
    collection(
      feature({ eventid: 11 }, [200, 10]), // longitude out of range
      feature({ eventid: 12 }, [10]), // one number
      feature({ eventid: 13 }, "10,20"), // not an array
      feature({ eventid: 14, alertlevel: "Purple" }),
      feature({ eventid: 15, fromdate: "yesterday" }),
      feature({ eventid: "abc" }),
      feature({ eventid: 16 }, [10, 20]), // fine
      { geometry: null, properties: { eventtype: "FL" } },
      "not a feature",
      null,
    ),
    { now: NOW },
  );
  assert.deepEqual(
    result.floods.map((f) => f.id),
    ["16"],
  );
  // Eight flood events (the one with no geometry counts); seven of them unusable.
  assert.equal(result.floodEvents, 8);
  assert.equal(result.skipped, 7);
  assert.equal(result.features, 10);
});

test("parseGdacsFloods: a feature that is not a point is skipped", () => {
  const polygon = feature({ eventid: 21 });
  polygon.geometry = { type: "Polygon", coordinates: [[[0, 0]]] } as never;
  const result = parseGdacsFloods(collection(polygon), { now: NOW });
  assert.equal(result.floods.length, 0);
  assert.equal(result.skipped, 1);
});

test("parseGdacsFloods: a changed answer is a failure, not an empty map", () => {
  for (const body of [null, "x", 5, [], {}, { features: "no" }, { type: "FeatureCollection" }]) {
    assert.throws(() => parseGdacsFloods(body, { now: NOW }), GdacsFormatError);
  }
  // A well-formed list with no floods in it is a normal, quiet answer.
  const quiet = parseGdacsFloods(collection(drought), { now: NOW });
  assert.deepEqual(quiet.floods, []);
  assert.equal(quiet.floodEvents, 0);
});

test("parseGdacsFloods: the report link is built from ids, never taken from the answer", () => {
  const sneaky = feature({
    eventid: 31,
    episodeid: 4,
    url: { report: "https://evil.example/report?x=1" },
  });
  const flood = parseGdacsFloods(collection(sneaky), { now: NOW }).floods[0]!;
  assert.equal(
    flood.reportUrl,
    "https://www.gdacs.org/report.aspx?eventtype=FL&eventid=31&episodeid=4",
  );
  const noEpisode = parseGdacsFloods(collection(feature({ eventid: 32, episodeid: "x;DROP" })), {
    now: NOW,
  }).floods[0]!;
  assert.equal(noEpisode.reportUrl, "https://www.gdacs.org/report.aspx?eventtype=FL&eventid=32");
});

test("parseGdacsFloods: a country code is given only for a single country", () => {
  const two = feature({
    eventid: 41,
    country: "Niger, Nigeria",
    affectedcountries: [
      { iso2: "NE", iso3: "NER", countryname: "Niger" },
      { iso2: "NG", iso3: "NGA", countryname: "Nigeria" },
    ],
  });
  const same = feature({
    eventid: 42,
    affectedcountries: [
      { iso2: "ng", iso3: "NGA" },
      { iso2: "NG", iso3: "NGA" },
    ],
  });
  const none = feature({ eventid: 43, affectedcountries: undefined });
  const junk = feature({ eventid: 44, affectedcountries: [{ iso2: "N1" }, 5, null] });
  const byId = new Map(
    parseGdacsFloods(collection(two, same, none, junk), { now: NOW }).floods.map((f) => [f.id, f]),
  );
  assert.equal(byId.get("41")!.countryCode, null);
  assert.equal(byId.get("41")!.country, "Niger, Nigeria");
  assert.equal(byId.get("42")!.countryCode, "NG");
  assert.equal(byId.get("43")!.countryCode, null);
  assert.equal(byId.get("44")!.countryCode, null);
});

test("parseGdacsFloods: names are cleaned and capped, with a fallback", () => {
  const long = "x".repeat(300);
  const result = parseGdacsFloods(
    collection(
      feature({ eventid: 51, name: "  Flood\u0000 in\n  Peru  " }),
      feature({ eventid: 52, name: long }),
      feature({ eventid: 53, name: "", eventname: "Mekong-2026" }),
      feature({ eventid: 54, name: 7, eventname: null }),
    ),
    { now: NOW },
  );
  const byId = new Map(result.floods.map((f) => [f.id, f]));
  assert.equal(byId.get("51")!.name, "Flood in Peru");
  assert.equal(byId.get("52")!.name.length, 120);
  assert.ok(byId.get("52")!.name.endsWith("…"));
  assert.equal(byId.get("53")!.name, "Mekong-2026");
  assert.equal(byId.get("54")!.name, "Flood");
});

test("parseGdacsFloods: one row per event, the latest update wins", () => {
  const result = parseGdacsFloods(
    collection(
      feature({
        eventid: 61,
        episodeid: 1,
        datemodified: "2026-11-08T00:00:00",
        alertlevel: "Green",
      }),
      feature({
        eventid: 61,
        episodeid: 3,
        datemodified: "2026-11-12T00:00:00",
        alertlevel: "Red",
      }),
      feature({
        eventid: 61,
        episodeid: 2,
        datemodified: "2026-11-10T00:00:00",
        alertlevel: "Orange",
      }),
    ),
    { now: NOW },
  );
  assert.equal(result.floods.length, 1);
  assert.equal(result.floods[0]!.alert, "red");
  assert.ok(result.floods[0]!.reportUrl.endsWith("episodeid=3"));
});

test("parseGdacsFloods: red first, then orange, then green; going before ended; newer before older", () => {
  const result = parseGdacsFloods(
    collection(
      feature({ eventid: 71, alertlevel: "Green" }),
      feature({ eventid: 72, alertlevel: "Orange", todate: "2026-11-05T00:00:00" }),
      feature({ eventid: 73, alertlevel: "Orange", todate: "2026-11-09T00:00:00" }),
      feature({
        eventid: 74,
        alertlevel: "Orange",
        iscurrent: "true",
        todate: "2026-11-01T00:00:00",
      }),
      feature({ eventid: 75, alertlevel: "Red", todate: "2026-11-03T00:00:00" }),
    ),
    { now: NOW },
  );
  assert.deepEqual(
    result.floods.map((f) => f.id),
    ["75", "74", "73", "72", "71"],
  );
});

test("parseGdacsFloods: the list is capped", () => {
  const many = Array.from({ length: MAX_FLOODS + 50 }, (_, i) => feature({ eventid: 1000 + i }));
  const result = parseGdacsFloods(collection(...many), { now: NOW });
  assert.equal(result.floods.length, MAX_FLOODS);
  assert.equal(result.floodEvents, MAX_FLOODS + 50);
});

test("gdacsFloodListUrl: asks for flood events over the last 30 days", () => {
  assert.equal(
    gdacsFloodListUrl(NOW),
    "https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=FL&alertlevel=Green;Orange;Red&fromdate=2026-10-14&todate=2026-11-13",
  );
});
