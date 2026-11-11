import { test } from "node:test";
import assert from "node:assert/strict";
import {
  autoRefreshMinutes,
  cacheBustedImageUrl,
  caltransVideoStats,
  parseLtaTrafficImages,
  driveBcPartnerCredit,
  isUsableCoordinate,
  parseCaltransCctv,
  parseDigitrafficStations,
  parseDriveBcWebcams,
  parseNswCameras,
  parseTflJamCams,
  pinImageUrl,
} from "../cameras.js";

const CALTRANS = "https://cwwp2.dot.ca.gov/";

test("pinImageUrl: accepts the pinned host, upgrades http, rejects everything else", () => {
  assert.equal(
    pinImageUrl("https://cwwp2.dot.ca.gov/data/d7/cctv/image/tv102/tv102.jpg", CALTRANS),
    "https://cwwp2.dot.ca.gov/data/d7/cctv/image/tv102/tv102.jpg",
  );
  assert.equal(
    pinImageUrl("http://cwwp2.dot.ca.gov/data/a.jpg", CALTRANS),
    "https://cwwp2.dot.ca.gov/data/a.jpg",
  );
  for (const bad of [
    "https://cwwp2.dot.ca.gov.evil.example/data/a.jpg",
    "https://evil.example/cwwp2.dot.ca.gov/data/a.jpg",
    "https://user:pw@cwwp2.dot.ca.gov/data/a.jpg",
    "https://cwwp2.dot.ca.gov:8443/data/a.jpg",
    "https://cwwp2.dot.ca.gov/a/%2e%2e%2fb.jpg".replace("%2e%2e%2f", "..%2f"),
    "javascript:alert(1)",
    "data:image/png;base64,AAAA",
    "//cwwp2.dot.ca.gov/a.jpg",
    "",
    "not a url",
    null,
    42,
    undefined,
  ]) {
    assert.equal(pinImageUrl(bad, CALTRANS), null, String(bad));
  }
});

test("pinImageUrl: a path-pinned origin must match the path prefix", () => {
  const tfl = "https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/";
  assert.ok(pinImageUrl(`${tfl}0000100.jpg`, tfl));
  assert.equal(pinImageUrl("https://s3-eu-west-1.amazonaws.com/other-bucket/x.jpg", tfl), null);
  assert.equal(
    pinImageUrl("https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk.evil/x.jpg", tfl),
    null,
  );
});

test("isUsableCoordinate: range, finiteness, and the (0, 0) placeholder", () => {
  assert.equal(isUsableCoordinate(34.05, -118.24), true);
  assert.equal(isUsableCoordinate(0, 0), false);
  assert.equal(isUsableCoordinate(91, 10), false);
  assert.equal(isUsableCoordinate(10, 181), false);
  assert.equal(isUsableCoordinate(Number.NaN, 10), false);
  assert.equal(isUsableCoordinate("34", "-118"), false);
  assert.equal(isUsableCoordinate(null, null), false);
});

const caltransRow = (over: Record<string, unknown> = {}, loc: Record<string, unknown> = {}) => ({
  cctv: {
    index: "1",
    inService: "true",
    location: {
      locationName: "TV102 -- I-580 : Grand Avenue",
      nearbyPlace: "Oakland",
      latitude: "37.8123",
      longitude: "-122.2711",
      ...loc,
    },
    imageData: {
      static: {
        currentImageUpdateFrequency: "5",
        currentImageURL: "https://cwwp2.dot.ca.gov/data/d4/cctv/image/tv102/tv102.jpg",
      },
    },
    ...over,
  },
});

test("parseCaltransCctv: reads a camera and keeps the agency code as the id", () => {
  const [camera, ...rest] = parseCaltransCctv({ data: [caltransRow()] }, 4);
  assert.equal(rest.length, 0);
  assert.deepEqual(camera, {
    id: "caltrans-d4-tv102",
    providerId: "caltrans",
    name: "I-580 : Grand Avenue (Oakland)",
    latitude: 37.8123,
    longitude: -122.2711,
    imageUrl: "https://cwwp2.dot.ca.gov/data/d4/cctv/image/tv102/tv102.jpg",
    refreshMinutes: 5,
  });
});

test("parseCaltransCctv: skips out-of-service, off-host, positionless and duplicate cameras", () => {
  const offHost = caltransRow({
    imageData: { static: { currentImageURL: "https://evil.example/x.jpg" } },
  });
  const cameras = parseCaltransCctv(
    {
      data: [
        caltransRow({ inService: "false" }),
        offHost,
        caltransRow({}, { latitude: "", longitude: "" }),
        caltransRow({}, { latitude: "0", longitude: "0" }),
        caltransRow(),
        caltransRow(),
        { cctv: null },
        null,
        "junk",
      ],
    },
    4,
  );
  assert.equal(cameras.length, 1);
});

test("parseCaltransCctv: junk payloads give an empty list", () => {
  for (const payload of [null, undefined, 5, "x", [], {}, { data: "no" }]) {
    assert.deepEqual(parseCaltransCctv(payload, 1), []);
  }
});

test("parseCaltransCctv: strips control characters and caps the name length", () => {
  const long = `TV9 -- ${"A".repeat(500)}\u0007\n`;
  const [camera] = parseCaltransCctv({ data: [caltransRow({}, { locationName: long })] }, 1);
  assert.ok(camera);
  assert.ok(camera.name.length <= 140);
  assert.ok(![...camera.name].some((ch) => ch.charCodeAt(0) < 32 || ch.charCodeAt(0) === 127));
});

const tflPlace = (props: Record<string, string>, over: Record<string, unknown> = {}) => ({
  id: "JamCams_00001.01251",
  commonName: "Oxford Circus",
  lat: 51.5152,
  lon: -0.1419,
  additionalProperties: Object.entries(props).map(([key, value]) => ({ key, value })),
  ...over,
});

test("parseTflJamCams: keeps available cameras with a TfL-hosted picture", () => {
  const good = tflPlace({
    available: "true",
    imageUrl: "https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.01251.jpg",
  });
  const cameras = parseTflJamCams([
    good,
    tflPlace({
      available: "false",
      imageUrl: "https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/a.jpg",
    }),
    tflPlace({ available: "true", imageUrl: "https://evil.example/a.jpg" }),
    tflPlace({ available: "true" }),
    tflPlace(
      {
        available: "true",
        imageUrl: "https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/b.jpg",
      },
      { id: "JamCams_../../etc" },
    ),
  ]);
  assert.equal(cameras.length, 1);
  assert.equal(cameras[0]?.id, "tfl-00001.01251");
  assert.equal(cameras[0]?.name, "Oxford Circus");
  assert.equal(cameras[0]?.refreshMinutes, null);
  assert.deepEqual(parseTflJamCams({ not: "an array" }), []);
});

const nswFeature = (props: Record<string, unknown>, over: Record<string, unknown> = {}) => ({
  id: "abc123",
  geometry: { type: "Point", coordinates: [151.2093, -33.8688] },
  properties: props,
  ...over,
});

test("parseNswCameras: reads a camera; uses a short view as the name, a long one never", () => {
  const href =
    "https://webcams.transport.nsw.gov.au/livetraffic-webcams/cameras/harbour_bridge.jpg";
  const cameras = parseNswCameras({
    features: [
      nswFeature({ href, view: "Harbour Bridge southbound", title: "Sydney" }),
      nswFeature({ href, view: `Works ${"x".repeat(300)}`, title: "Fallback title" }, { id: "b" }),
      nswFeature({ href: "https://evil.example/a.jpg" }, { id: "c" }),
      nswFeature({ href }, { id: "d", geometry: { coordinates: [null, null] } }),
      nswFeature({ href }, { id: "e/../x" }),
    ],
  });
  assert.equal(cameras.length, 2);
  assert.equal(cameras[0]?.name, "Harbour Bridge southbound");
  assert.equal(cameras[0]?.latitude, -33.8688);
  assert.equal(cameras[0]?.longitude, 151.2093);
  assert.equal(cameras[1]?.name, "Fallback title");
});

test("parseDigitrafficStations: one camera per collected preset, URL built from the id", () => {
  const station = (over: Record<string, unknown> = {}, presets?: unknown[]) => ({
    geometry: { type: "Point", coordinates: [24.9, 60.2, 0] },
    properties: {
      id: "C01503",
      name: "tie_4_Helsinki",
      collectionStatus: "GATHERING",
      presets: presets ?? [
        { id: "C0150301", inCollection: true },
        { id: "C0150302", inCollection: false },
        { id: "C9999901", inCollection: true },
        { id: "../etc", inCollection: true },
      ],
      ...over,
    },
  });
  const cameras = parseDigitrafficStations({
    features: [
      station(),
      station({ collectionStatus: "REMOVED_TEMPORARILY" }),
      station({ id: "x" }),
    ],
  });
  assert.equal(cameras.length, 1);
  assert.equal(cameras[0]?.id, "digitraffic-c0150301");
  assert.equal(cameras[0]?.imageUrl, "https://weathercam.digitraffic.fi/C0150301.jpg");
  assert.equal(cameras[0]?.name, "tie 4 Helsinki");
});

test("parseDriveBcWebcams: kept only when on and shown; credit only for partner courtesy lines", () => {
  const row = (over: Record<string, unknown> = {}) => ({
    id: 12,
    name: "Highway 1 at Hope",
    is_on: true,
    should_appear: true,
    location: { type: "Point", coordinates: [-121.44, 49.38] },
    credit: "",
    ...over,
  });
  const cameras = parseDriveBcWebcams([
    row(),
    row({ id: 13, credit: "Image courtesy of Parks Canada" }),
    row({ id: 14, credit: "Camera offline for maintenance until further notice" }),
    row({ id: 15, is_on: false }),
    row({ id: 16, should_appear: false }),
    row({ id: "17" }),
    row({ id: -3 }),
    row({ id: 18, location: { coordinates: [0, 0] } }),
  ]);
  assert.deepEqual(
    cameras.map((c) => c.id),
    ["drivebc-12", "drivebc-13", "drivebc-14"],
  );
  assert.equal(cameras[0]?.imageUrl, "https://www.drivebc.ca/images/12.jpg");
  assert.equal(cameras[0]?.credit, undefined);
  assert.equal(cameras[1]?.credit, "Image courtesy of Parks Canada");
  assert.equal(cameras[2]?.credit, undefined);
});

test("driveBcPartnerCredit: removes markup", () => {
  assert.equal(
    driveBcPartnerCredit('<a href="https://x.example">Image courtesy of City of Kelowna</a>'),
    "Image courtesy of City of Kelowna",
  );
  assert.equal(driveBcPartnerCredit(null), "");
});

test("a cache-busted picture address keeps its host and path and only changes the wv value", () => {
  const a = cacheBustedImageUrl("https://weathercam.digitraffic.fi/C0150101.jpg", 100);
  const b = cacheBustedImageUrl("https://weathercam.digitraffic.fi/C0150101.jpg", 101);
  assert.equal(a, "https://weathercam.digitraffic.fi/C0150101.jpg?wv=100");
  assert.notEqual(a, b);
  // A query the agency already uses is kept; ours is set once, not stacked.
  assert.equal(
    cacheBustedImageUrl("https://cwwp2.dot.ca.gov/x.jpg?size=big&wv=5", 7.9),
    "https://cwwp2.dot.ca.gov/x.jpg?size=big&wv=7",
  );
  // Not an address: handed back untouched rather than thrown on.
  assert.equal(cacheBustedImageUrl("not a url", 1), "not a url");
});

test("autoRefreshMinutes follows the agency's rhythm, kept between 1 and 5 minutes", () => {
  assert.equal(autoRefreshMinutes(null), 5);
  assert.equal(autoRefreshMinutes(1), 1);
  assert.equal(autoRefreshMinutes(0.2), 1);
  assert.equal(autoRefreshMinutes(3), 3);
  assert.equal(autoRefreshMinutes(60), 5);
  assert.equal(autoRefreshMinutes(2.6), 3);
});

test("caltransVideoStats counts only real web addresses and reports their hosts and endings", () => {
  const row = (inService: string, video: unknown, lat = "37.7", lon = "-122.4") => ({
    cctv: {
      inService,
      location: { latitude: lat, longitude: lon, locationName: "TV1 -- I-80" },
      imageData: {
        streamingVideoURL: video,
        static: { currentImageURL: "https://cwwp2.dot.ca.gov/a.jpg" },
      },
    },
  });
  const stats = caltransVideoStats({
    data: [
      row("true", "https://wzmedia.dot.ca.gov/D4/I80_x.stream/playlist.m3u8"),
      row("true", "https://wzmedia.dot.ca.gov/D4/I80_y.stream/playlist.m3u8"),
      row("true", "Not Reported"),
      row("true", ""),
      row("true", "ftp://example.test/live.mp4"),
      row("true", 5),
      row("false", "https://wzmedia.dot.ca.gov/D4/off.stream/playlist.m3u8"),
      row("true", "https://wzmedia.dot.ca.gov/D4/nowhere.stream/playlist.m3u8", "x", "y"),
    ],
  });
  assert.deepEqual(stats, {
    cameras: 6,
    withVideo: 2,
    hosts: ["wzmedia.dot.ca.gov"],
    extensions: ["m3u8"],
  });
  assert.deepEqual(caltransVideoStats(null), {
    cameras: 0,
    withVideo: 0,
    hosts: [],
    extensions: [],
  });
});

// A real response from the Singapore feed (shortened), pasted by the owner on 2026-11-11.
const LTA_SAMPLE = {
  items: [
    {
      timestamp: "2026-11-12T03:27:35+08:00",
      cameras: [
        {
          timestamp: "2026-11-12T03:25:35+08:00",
          image:
            "https://images.data.gov.sg/api/traffic-images/2026/11/0bab8eaf-a95c-42f4-9e16-7c318a6e2b03.jpg",
          location: { latitude: 1.447023728, longitude: 103.7716543 },
          camera_id: "2701",
          image_metadata: { height: 1080, width: 1920, md5: "d3cbb34609e09b65690f4b154a3d37f2" },
        },
        {
          timestamp: "2026-11-12T03:25:35+08:00",
          image:
            "https://images.data.gov.sg/api/traffic-images/2026/11/7b9d4e1f-d57a-4120-8434-ffcc40bfaa5b.jpg",
          location: { latitude: 1.26027777363278, longitude: 103.823888890049 },
          camera_id: "4799",
          image_metadata: { height: 1080, width: 1920, md5: "27169231d2d16559c3961a8cacc9722a" },
        },
      ],
    },
  ],
  api_info: { status: "healthy" },
};

test("parseLtaTrafficImages reads the real Singapore sample", () => {
  const cameras = parseLtaTrafficImages(LTA_SAMPLE);
  assert.equal(cameras.length, 2);
  assert.deepEqual(cameras[0], {
    id: "lta-2701",
    providerId: "lta",
    name: "Singapore road camera 2701",
    latitude: 1.447023728,
    longitude: 103.7716543,
    imageUrl:
      "https://images.data.gov.sg/api/traffic-images/2026/11/0bab8eaf-a95c-42f4-9e16-7c318a6e2b03.jpg",
    refreshMinutes: 1,
    takenAt: "2026-11-11T19:25:35.000Z",
    freshAddress: true,
  });
  assert.equal(cameras[1]?.id, "lta-4799");
});

test("parseLtaTrafficImages skips unsafe or unreadable records and keeps the rest", () => {
  const good = LTA_SAMPLE.items[0]!.cameras[0]!;
  const bad = (change: Record<string, unknown>) => ({ ...good, camera_id: "9", ...change });
  const cameras = parseLtaTrafficImages({
    items: [
      {
        cameras: [
          good,
          good, // the same camera twice: kept once
          bad({ image: "https://images.data.gov.sg.evil.example/api/traffic-images/a.jpg" }),
          bad({ image: "https://evil.example/images.data.gov.sg/api/traffic-images/a.jpg" }),
          bad({ image: "https://images.data.gov.sg/other/a.jpg" }),
          bad({ image: 5 }),
          bad({ camera_id: "../x" }),
          bad({ camera_id: "" }),
          bad({ location: { latitude: 0, longitude: 0 } }),
          bad({ location: { latitude: "1.3", longitude: 103.8 } }),
          bad({ location: null }),
          null,
          "text",
          bad({ timestamp: "not a time" }), // kept, without a picture time
        ],
      },
    ],
  });
  assert.deepEqual(
    cameras.map((c) => [c.id, c.takenAt === undefined]),
    [
      ["lta-2701", false],
      ["lta-9", true],
    ],
  );
  for (const input of [null, undefined, 5, "x", [], {}, { items: "x" }, { items: [{}] }]) {
    assert.deepEqual(parseLtaTrafficImages(input), []);
  }
});
