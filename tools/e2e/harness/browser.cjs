// Shared browser set-up for the specs: where the site is, where screenshots go, and a Chromium
// that can draw WebGL without a graphics card (software rendering, needed for the 3D Globe).
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const BASE = process.env.BASE_URL || "http://localhost:3100";
const SHOTS = process.env.E2E_SHOTS || path.join(__dirname, "..", ".out");
fs.mkdirSync(SHOTS, { recursive: true });

const WEBGL_ARGS = [
  "--use-gl=angle",
  "--use-angle=swiftshader",
  "--enable-unsafe-swiftshader",
  "--ignore-gpu-blocklist",
  "--enable-webgl",
];

/** `webgl: true` for the pages that draw the 3D globe. */
const launch = ({ webgl = false } = {}) => chromium.launch(webgl ? { args: WEBGL_ARGS } : {});

/** The mock auth accepts any session cookie. */
const signedIn = (extra = []) => [{ name: "wv_session", value: "abc", url: BASE }, ...extra];

module.exports = { BASE, SHOTS, launch, signedIn };
