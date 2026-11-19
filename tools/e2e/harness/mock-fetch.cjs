// Preload for `next start` (NODE_OPTIONS=--require): the server-side calls to outside services
// (Open-Meteo, NASA POWER and FIRMS, USGS, FEMA, GDACS, the public camera feeds and a fake Flow at
// https://flow.test) are answered from canned data, so the browser checks need no network and no keys.
// Each section can be steered with a MOCK_* variable (see the section comments). Test-only.
const real = globalThis.fetch;
const day = (d) =>
  `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
globalThis.fetch = async (input, init) => {
  const url = new URL(typeof input === "string" ? input : (input.url ?? String(input)));
  if (/geocoding-api\.open-meteo\.com$/.test(url.hostname)) {
    const name = (url.searchParams.get("name") || "").toLowerCase();
    if (name === "failcity") return new Response("boom", { status: 500 });
    if (name.includes("nowhere")) return Response.json({});
    return Response.json({
      results: [
        { name: "Ibadan", country: "Nigeria", admin1: "Oyo", latitude: 7.3775, longitude: 3.947 },
      ],
    });
  }
  if (url.hostname === "power.larc.nasa.gov") {
    if (Number(url.searchParams.get("latitude")) === 13.13)
      return new Response("down", { status: 503 });
    const t2m = {};
    for (let i = 8; i >= 1; i--) {
      const d = new Date(Date.now() - i * 86400000);
      t2m[day(d)] = i === 4 ? -999 : 26 + (i % 3);
    }
    return Response.json({
      properties: { parameter: { T2M: t2m } },
      header: { fill_value: -999 },
      parameters: { T2M: { units: "C", longname: "Temperature at 2 Meters" } },
    });
  }
  return real(input, init);
};

// --- Globe live layers ---
const prevFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = new URL(typeof input === "string" ? input : (input.url ?? String(input)));
  const delay = Number(process.env.MOCK_LAYER_DELAY_MS || 0);
  const slow = () => new Promise((r) => setTimeout(r, delay));
  if (url.hostname.includes("usgs.gov") && /referencepoints/.test(url.pathname)) {
    await slow();
    if (process.env.MOCK_FLOODS_FAIL) return new Response("down", { status: 503 });
    if (/count\/state/.test(url.pathname)) return Response.json({ state_id: 6 });
    return Response.json([
      {
        id: 1,
        name: "Test River at Bridge",
        state_id: 6,
        latitude: 34.2,
        longitude: -118.1,
        is_flooding: true,
      },
    ]);
  }
  if (/hifld_open|nccs\.nasa\.gov/.test(url.hostname + url.pathname)) {
    await slow();
    return Response.json({
      features: [
        {
          attributes: {
            objectid: 7,
            name: "Test High School Shelter",
            address: "1 Main St",
            evac_cap: 300,
          },
          geometry: { x: -118.3, y: 34.0 },
        },
      ],
    });
  }
  if (url.hostname === "firms.modaps.eosdis.nasa.gov") {
    await slow();
    return new Response(
      "latitude,longitude,acq_date,acq_time,satellite,confidence,frp,daynight\n34.1,-118.4,2026-11-08,1030,N,high,12.5,D\n33.9,-118.0,2026-11-08,1030,N,nominal,3.1,D\n",
    );
  }
  return prevFetch(input, init);
};

// --- Globe worldwide fires + public cameras ---
const prevFetch2 = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = new URL(typeof input === "string" ? input : (input.url ?? String(input)));
  const failList = (process.env.MOCK_CAMERAS_FAIL || "").split(",").filter(Boolean);
  const delay = Number(process.env.MOCK_FIRES_DELAY_MS || 0);
  if (url.hostname === "firms.modaps.eosdis.nasa.gov" && /\/world\//.test(url.pathname)) {
    if (delay) await new Promise((r) => setTimeout(r, delay));
    if (process.env.MOCK_FIRES_FAIL) return new Response("Invalid MAP_KEY.", { status: 200 });
    const t = new Date(Date.now() - 3 * 3600 * 1000);
    const d = t.toISOString().slice(0, 10);
    const hm = t.toISOString().slice(11, 16).replace(":", "");
    const rows = [
      [34.1, -118.4, "high", 42.5], // Los Angeles: California cameras within 25 km
      [34.11, -118.41, "nominal", 8.1],
      [-33.86, 151.21, "nominal", 15.0], // Sydney: NSW camera
      [9.08, 7.4, "high", 60.0], // Nigeria: no cameras
      [9.1, 7.42, "nominal", 5.0],
      [51.5, -0.12, "high", 9.0], // London
      ...(process.env.MOCK_LTA ? [[1.36, 103.82, "high", 20.0]] : []), // Singapore: LTA camera within 25 km
      ...(process.env.MOCK_HEAT_NEAR
        ? [
            [7.4, 3.96, "high", 30.0],
            [7.381, 3.951, "low", 50.0],
          ]
        : []), // ~2.5 km from the Ibadan field; the low one must not count
      [10, 10, "low", 99], // low confidence: must not appear
    ];
    return new Response(
      "latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight\n" +
        rows
          .map(
            (r) =>
              `${r[0]},${r[1]},330,0.4,0.4,${d},${hm},N,VIIRS,${r[2] === "high" ? "h" : r[2] === "nominal" ? "n" : "l"},2.0NRT,290,${r[3]},D`,
          )
          .join("\n") +
        "\n",
    );
  }
  const maybeFail = (id) => failList.includes(id);
  if (url.hostname === "cwwp2.dot.ca.gov") {
    if (maybeFail("caltrans") || !/cctvStatusD07/.test(url.pathname))
      return new Response("nope", { status: maybeFail("caltrans") ? 503 : 404 });
    const cam = (code, name, lat, lon) => ({
      cctv: {
        index: code,
        inService: "true",
        location: {
          locationName: `${code} -- ${name}`,
          nearbyPlace: "Los Angeles",
          latitude: String(lat),
          longitude: String(lon),
        },
        imageData: {
          static: {
            currentImageUpdateFrequency: "5",
            currentImageURL: `https://cwwp2.dot.ca.gov/data/d7/cctv/image/${code.toLowerCase()}/${code.toLowerCase()}.jpg`,
          },
        },
      },
    });
    return Response.json({
      data: [
        cam("TV101", "I-405 : Sunset Blvd", 34.095, -118.41),
        cam("TV102", "US-101 : Vermont", 34.1, -118.29),
        cam("TV103", "I-10 : far away", 34.05, -117.2),
      ],
    });
  }
  if (url.hostname === "api.tfl.gov.uk") {
    if (maybeFail("tfl")) return new Response("x", { status: 500 });
    return Response.json([
      {
        id: "JamCams_00001.01251",
        commonName: "Strand / Waterloo Bridge",
        lat: 51.5112,
        lon: -0.1198,
        additionalProperties: [
          { key: "available", value: "true" },
          {
            key: "imageUrl",
            value: "https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.01251.jpg",
          },
        ],
      },
    ]);
  }
  if (url.hostname === "data.livetraffic.com") {
    if (maybeFail("nsw")) return new Response("x", { status: 500 });
    return Response.json({
      type: "FeatureCollection",
      features: [
        {
          id: "harbour1",
          geometry: { type: "Point", coordinates: [151.2093, -33.8523] },
          properties: {
            href: "https://webcams.transport.nsw.gov.au/livetraffic-webcams/cameras/harbour_bridge.jpg",
            view: "Harbour Bridge southbound",
            title: "Sydney",
          },
        },
      ],
    });
  }
  if (url.hostname === "tie.digitraffic.fi") {
    return Response.json({
      type: "FeatureCollection",
      features: [
        {
          geometry: { type: "Point", coordinates: [24.94, 60.17, 0] },
          properties: {
            id: "C01503",
            name: "tie_4_Helsinki",
            collectionStatus: "GATHERING",
            presets: [{ id: "C0150301", inCollection: true }],
          },
        },
      ],
    });
  }
  if (url.hostname === "api.data.gov.sg") {
    if (!process.env.MOCK_LTA) return Response.json({ items: [], api_info: { status: "healthy" } });
    globalThis.__ltaCalls = (globalThis.__ltaCalls || 0) + 1;
    const n = globalThis.__ltaCalls;
    console.log("MOCK lta call " + n);
    return Response.json({
      items: [
        {
          timestamp: new Date().toISOString(),
          cameras: [
            {
              timestamp: new Date().toISOString(),
              image: "https://images.data.gov.sg/api/traffic-images/2026/11/uuid-" + n + ".jpg",
              location: { latitude: 1.3601, longitude: 103.8201 },
              camera_id: "2701",
              image_metadata: { height: 1080, width: 1920, md5: "x" },
            },
          ],
        },
      ],
      api_info: { status: "healthy" },
    });
  }
  if (url.hostname === "www.drivebc.ca") {
    return Response.json([
      {
        id: 12,
        name: "Highway 1 at Hope",
        is_on: true,
        should_appear: true,
        location: { type: "Point", coordinates: [-121.44, 49.38] },
        credit: "",
      },
    ]);
  }
  return prevFetch2(input, init);
};

// --- GDACS flood list. MOCK_GDACS = fail | empty | badshape | (unset = a normal mixed list) ---
const prevFetch3 = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = new URL(typeof input === "string" ? input : (input.url ?? String(input)));
  if (url.hostname !== "www.gdacs.org") return prevFetch3(input, init);
  globalThis.__gdacsRequests = (globalThis.__gdacsRequests || []).concat(url.pathname + url.search);
  console.log("MOCK gdacs request: " + url.pathname + url.search);
  const mode = process.env.MOCK_GDACS || "";
  if (mode === "fail") return new Response("down", { status: 503 });
  if (mode === "badshape") return Response.json({ result: "moved" });
  const iso = (daysAgo) => new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 19); // GDACS style: no zone
  const base = (type, id, name, alert, from, to, extra = {}, coordinates = [0, 0]) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates },
    properties: {
      eventtype: type,
      eventid: id,
      episodeid: 7,
      eventname: "",
      name,
      alertlevel: alert,
      episodealertlevel: alert,
      iscurrent: "false",
      fromdate: iso(from),
      todate: iso(to),
      datemodified: iso(to),
      source: "GLOFAS",
      severitydata: { severity: 0.0, severitytext: "", severityunit: "" },
      url: { report: "https://evil.example/x" },
      ...extra,
    },
  });
  const features =
    mode === "empty"
      ? [base("DR", 1027450, "Drought in South Sudan", "Orange", 90, 1, {}, [31.76, 9.405])]
      : [
          base("DR", 1027450, "Drought in South Sudan", "Orange", 90, 1, {}, [31.76, 9.405]),
          base("EQ", 1500001, "Earthquake in Chile", "Green", 2, 2, {}, [-70.5, -33.4]),
          base(
            "FL",
            1104001,
            "Flood in Nigeria",
            "Orange",
            6,
            0,
            {
              iscurrent: "true",
              country: "Nigeria",
              affectedcountries: [{ iso2: "NG", iso3: "NGA", countryname: "Nigeria" }],
            },
            [6.74, 7.8],
          ),
          base(
            "FL",
            1104002,
            "Flood in India, Bangladesh",
            "Red",
            9,
            3,
            {
              country: "India, Bangladesh",
              affectedcountries: [
                { iso2: "IN", iso3: "IND", countryname: "India" },
                { iso2: "BD", iso3: "BGD", countryname: "Bangladesh" },
              ],
            },
            [89.2, 24.1],
          ),
          base(
            "FL",
            1104003,
            "Flood in Australia",
            "Green",
            5,
            1,
            {
              country: "Australia",
              affectedcountries: [{ iso2: "AU", iso3: "AUS", countryname: "Australia" }],
            },
            [146.1, -34.9],
          ),
          base(
            "FL",
            1104004,
            "Flood in Peru (ended long ago)",
            "Orange",
            70,
            40,
            {
              country: "Peru",
              affectedcountries: [{ iso2: "PE", iso3: "PER", countryname: "Peru" }],
            },
            [-75.0, -9.2],
          ),
          base(
            "FL",
            1104005,
            "Flood with bad point",
            "Red",
            4,
            1,
            { country: "Nowhere" },
            [500, 500],
          ),
        ];
  return Response.json({ type: "FeatureCollection", features });
};

// --- Open-Meteo forecast: MOCK_FORECAST=fail makes it fail ---
const prevFetchForecast = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = new URL(typeof input === "string" ? input : (input.url ?? String(input)));
  if (/^(customer-)?api\.open-meteo\.com$/.test(url.hostname)) {
    if (process.env.MOCK_FORECAST === "fail") return new Response("down", { status: 503 });
    const days = Number(url.searchParams.get("forecast_days") || 7);
    const time = [],
      tmax = [],
      tmin = [],
      wind = [],
      sun = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(Date.now() + i * 86400000);
      time.push(d.toISOString().slice(0, 10));
      tmax.push(31 + (i % 3));
      tmin.push(23 + (i % 2));
      wind.push(4 + i);
      sun.push(18 + i);
    }
    return Response.json({
      daily: {
        time,
        temperature_2m_max: tmax,
        temperature_2m_min: tmin,
        wind_speed_10m_max: wind,
        shortwave_radiation_sum: sun,
      },
      daily_units: { temperature_2m_max: "°C", wind_speed_10m_max: "m/s" },
    });
  }
  return prevFetchForecast(input, init);
};

// --- A fake Flow (https://flow.test/api/chat) for the help-chat assistant tests.
// MOCK_FLOW = fail | slow | price | leak | boss | json | (unset = a plain reply). Every request is logged (body + header names, never values).
const prevFetchFlow = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = new URL(typeof input === "string" ? input : (input.url ?? String(input)));
  if (url.hostname !== "flow.test") return prevFetchFlow(input, init);
  const body = JSON.parse(init?.body ?? "{}");
  const headerNames = Object.keys(init?.headers ?? {});
  console.log(
    "MOCK flow request: " +
      JSON.stringify({
        path: url.pathname,
        headerNames,
        auth: init?.headers?.Authorization ? "present" : "absent",
        keys: Object.keys(body).sort(),
        audience: body.audience,
        disableTools: body.disableTools,
        roles: (body.messages || []).map((m) => m.role),
        redirect: init?.redirect,
      }),
  );
  console.log("MOCK flow messages: " + JSON.stringify(body.messages));
  const mode = process.env.MOCK_FLOW || "";
  if (mode === "fail")
    return new Response(JSON.stringify({ error: "all providers failed" }), { status: 502 });
  if (mode === "slow") {
    await new Promise((resolve, reject) => {
      const t = setTimeout(resolve, 12000);
      init?.signal?.addEventListener("abort", () => {
        clearTimeout(t);
        reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
      });
    });
  }
  if (mode === "json") return new Response("not json at all", { status: 200 });
  const last = (body.messages || []).filter((m) => m.role === "user").at(-1)?.content ?? "";
  const reply =
    mode === "price"
      ? "The Pro plan costs $9 a month."
      : mode === "leak"
        ? '<tool_call>{"name":"send_message"}</tool_call>'
        : mode === "boss"
          ? "Sure thing, Boss."
          : `**Plans** are on the Plans and billing page. You asked: "${String(last).slice(0, 40)}" (${(body.messages || []).length} messages sent).`;
  return Response.json({ reply, intent: "chat" });
};
