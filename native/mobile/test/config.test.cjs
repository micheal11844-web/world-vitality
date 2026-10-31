"use strict";

// Guards for the parts of the phone app that cannot be built on every machine:
// they read the project's files and fail if a setting that matters has drifted.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const config = JSON.parse(read("capacitor.config.json"));
const pkg = JSON.parse(read("package.json"));
const manifest = read("android/app/src/main/AndroidManifest.xml");
const gradle = read("android/app/build.gradle");
const res = "android/app/src/main/res";

test("the app only ever loads the site over https and keeps its address in one place", () => {
  const url = new URL(config.server.url);
  assert.equal(url.protocol, "https:");
  assert.equal(config.server.cleartext, false);
  assert.deepEqual(config.server.allowNavigation, [url.hostname]);
  assert.equal(config.android.allowMixedContent, false);
  assert.equal(config.android.webContentsDebuggingEnabled, false);
});

test("the offline page's Try again button goes to the site", () => {
  const html = read("www/offline.html");
  const href = /id="retry"[^>]*href="([^"]+)"/.exec(html);
  assert.ok(href, "retry link present");
  assert.equal(new URL(href[1]).origin, new URL(config.server.url).origin);
  assert.equal(config.server.errorPath, "offline.html");
  assert.ok(!/<script/i.test(html), "no script on the offline page");
});

test("the site can tell it is inside the app, and the version agrees everywhere", () => {
  const token = /^WorldVitalityApp\/(\d+\.\d+\.\d+)$/.exec(config.android.appendUserAgent);
  assert.ok(token, "user agent token");
  assert.equal(token[1], pkg.version);
  assert.ok(gradle.includes(`"WV_VERSION_NAME") ?: "${pkg.version}"`), "gradle default version");
});

test("the Android app asks for the internet and nothing else, and is not backed up", () => {
  const permissions = [...manifest.matchAll(/<uses-permission[^>]*android:name="([^"]+)"/g)].map(
    (m) => m[1],
  );
  assert.deepEqual(permissions, ["android.permission.INTERNET"]);
  assert.match(manifest, /android:allowBackup="false"/);
  assert.match(manifest, /android:usesCleartextTraffic="false"/);
});

test("signing keys come from the build machine, never from the repository", () => {
  assert.match(gradle, /System\.getenv\("WV_KEYSTORE_FILE"\)/);
  assert.ok(!/storePassword\s+["'][^"']/.test(gradle), "no literal password");
  const tracked = fs
    .readdirSync(path.join(root, "android/app"))
    .filter((f) => /\.(jks|keystore)$/.test(f));
  assert.deepEqual(tracked, []);
});

// The width and height of a PNG are the 4-byte numbers at offsets 16 and 20.
const size = (p) => {
  const b = fs.readFileSync(path.join(root, p));
  assert.equal(b.subarray(1, 4).toString(), "PNG", `${p} is a PNG`);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
};

test("the launcher icons exist at every size and are the app's own", () => {
  const sizes = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
  for (const [name, scale] of Object.entries(sizes)) {
    const dir = `${res}/mipmap-${name}`;
    assert.deepEqual(size(`${dir}/ic_launcher.png`), [48 * scale, 48 * scale]);
    assert.deepEqual(size(`${dir}/ic_launcher_round.png`), [48 * scale, 48 * scale]);
    assert.deepEqual(size(`${dir}/ic_launcher_foreground.png`), [108 * scale, 108 * scale]);
  }
  const [w] = size(`${res}/drawable-nodpi/splash_logo.png`);
  assert.ok(w >= 300 && w <= 600, "splash logo is a sensible size");
  for (const leftover of ["drawable-v24", "drawable-port-mdpi", "drawable-land-mdpi"]) {
    assert.ok(!fs.existsSync(path.join(root, res, leftover)), `${leftover} (default art) removed`);
  }
});

test("the website recognises the word this app adds to its user agent", () => {
  const source = fs.readFileSync(path.join(root, "../../apps/web/lib/pwa/native-shell.ts"), "utf8");
  const found = /const NATIVE_SHELL = \/(.+)\/;/.exec(source);
  assert.ok(found, "pattern found in native-shell.ts");
  const pattern = new RegExp(found[1]);
  assert.ok(pattern.test(`Mozilla/5.0 (Linux; Android 14) ${config.android.appendUserAgent}`));
  assert.ok(!pattern.test("Mozilla/5.0 (Linux; Android 14) Chrome/130"));
});
