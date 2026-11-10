import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CAMERA_PROVIDERS, CAMERA_PROVIDER_IDS, CAMERA_IMAGE_CSP_SOURCES } from "../providers.js";

// dist/__tests__/csp-sources.test.js → the web app's config is four levels up.
const config = readFileSync(
  new URL("../../../../apps/web/next.config.mjs", import.meta.url),
  "utf8",
);
const globeRule = config.slice(config.indexOf('source: "/globe"'));

test("the /globe Content-Security-Policy allows every camera host as an image source", () => {
  const imgSrc = /"img-src ([^"]+)"/.exec(globeRule)?.[1] ?? "";
  assert.ok(imgSrc, "found the /globe img-src line");
  const allowed = imgSrc.split(/\s+/);
  for (const source of CAMERA_IMAGE_CSP_SOURCES) {
    assert.ok(allowed.includes(source), `${source} is missing from the /globe img-src`);
  }
});

test("the /globe policy gives camera hosts image access only", () => {
  const policy = globeRule.slice(0, globeRule.indexOf("].join"));
  for (const id of CAMERA_PROVIDER_IDS) {
    const host = new URL(CAMERA_PROVIDERS[id].imageOrigin).hostname;
    const lines = policy.split("\n").filter((line) => line.includes(host));
    for (const line of lines) {
      if (line.trim().startsWith("//")) continue;
      assert.match(line, /img-src/, `${host} appears outside img-src: ${line.trim()}`);
    }
  }
});

test("every provider image origin is https and matches its CSP source", () => {
  for (const id of CAMERA_PROVIDER_IDS) {
    const info = CAMERA_PROVIDERS[id];
    assert.ok(info.imageOrigin.startsWith("https://"));
    assert.ok(
      info.imageOrigin.startsWith(info.cspImageSource),
      `${id}: ${info.imageOrigin} should start with ${info.cspImageSource}`,
    );
  }
});
