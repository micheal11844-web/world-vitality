"use strict";

// Run with: node --test sites/download/test/releases.test.cjs
// Checks the logic behind the downloads page (public/releases.js) with no browser.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const D = require("../public/releases.js");

const BASE = `https://github.com/${D.REPO}/releases/download`;

function asset(tag, name, size = 50_000_000) {
  return { name, size, browser_download_url: `${BASE}/${tag}/${name}` };
}

function fullRelease(version, publishedAt, extra = {}) {
  const tag = `native-v${version}`;
  return {
    tag_name: tag,
    draft: false,
    prerelease: version.startsWith("0."),
    published_at: publishedAt,
    html_url: `https://github.com/${D.REPO}/releases/tag/${tag}`,
    assets: [
      asset(tag, `World-Vitality-Setup-${version}.exe`, 121_400_000),
      asset(tag, `World-Vitality-${version}-arm64.dmg`, 104_000_000),
      asset(tag, `World-Vitality-${version}-x64.dmg`, 109_000_000),
      asset(tag, `World-Vitality-${version}.AppImage`, 112_000_000),
      asset(tag, `World-Vitality-${version}.apk`, 6_300_000),
      asset(tag, "SHA256SUMS.txt", 600),
    ],
    ...extra,
  };
}

test("the page loads its logic from the same file the tests check", () => {
  const html = fs.readFileSync(path.join(__dirname, "../public/index.html"), "utf8");
  assert.match(html, /<script src="releases\.js"><\/script>/);
  assert.match(html, /<script src="app\.js"><\/script>/);
  assert.ok(html.indexOf("releases.js") < html.indexOf("app.js"), "releases.js loads first");
});

test("the repository name matches the one the build workflow publishes to", () => {
  const workflow = fs.readFileSync(
    path.join(__dirname, "../../../.github/workflows/native-apps.yml"),
    "utf8",
  );
  assert.match(workflow, /native-v\$\{VERSION\}/);
  assert.equal(D.REPO, "micheal11844-web/world-vitality");
});

test("isTrustedDownloadUrl accepts only this repository's release files over https", () => {
  assert.equal(D.isTrustedDownloadUrl(`${BASE}/native-v0.1.0/World-Vitality-0.1.0.apk`), true);
  assert.equal(D.isTrustedDownloadUrl(`http://github.com/${D.REPO}/releases/download/x/y`), false);
  assert.equal(
    D.isTrustedDownloadUrl("https://github.com/other/repo/releases/download/x/y"),
    false,
  );
  assert.equal(
    D.isTrustedDownloadUrl(`https://evil.example/${D.REPO}/releases/download/x/y`),
    false,
  );
  assert.equal(
    D.isTrustedDownloadUrl(`https://github.com.evil.example/${D.REPO}/releases/download/x/y`),
    false,
  );
  assert.equal(D.isTrustedDownloadUrl(`https://github.com/${D.REPO}/archive/main.zip`), false);
  assert.equal(D.isTrustedDownloadUrl("javascript:alert(1)"), false);
  assert.equal(D.isTrustedDownloadUrl("not a url"), false);
  assert.equal(D.isTrustedDownloadUrl(undefined), false);
});

test("pickRelease finds the newest published app release", () => {
  const list = [
    fullRelease("0.1.0", "2026-11-01T10:00:00Z"),
    fullRelease("0.2.0", "2026-12-01T10:00:00Z"),
    fullRelease("0.1.5", "2026-11-20T10:00:00Z"),
  ];
  assert.equal(D.pickRelease(list).tag_name, "native-v0.2.0");
});

test("pickRelease ignores drafts, other tags and bad data", () => {
  const list = [
    fullRelease("0.3.0", "2027-01-01T00:00:00Z", { draft: true }),
    { ...fullRelease("0.9.0", "2027-02-01T00:00:00Z"), tag_name: "website-v9.0.0" },
    { ...fullRelease("0.9.1", "2027-02-02T00:00:00Z"), tag_name: "native-v0.9" },
    { ...fullRelease("0.9.2", "2027-02-03T00:00:00Z"), tag_name: "native-v0.9.2-beta" },
    { ...fullRelease("0.9.3", "not a date"), created_at: undefined },
    null,
    "nonsense",
    fullRelease("0.1.0", "2026-11-01T10:00:00Z"),
  ];
  assert.equal(D.pickRelease(list).tag_name, "native-v0.1.0");
});

test("pickRelease returns null when there is nothing to pick", () => {
  assert.equal(D.pickRelease([]), null);
  assert.equal(D.pickRelease(null), null);
  assert.equal(D.pickRelease({ message: "Not Found" }), null);
  assert.equal(
    D.pickRelease([fullRelease("0.1.0", "2026-11-01T00:00:00Z", { draft: true })]),
    null,
  );
});

test("pickRelease falls back to created_at when published_at is missing", () => {
  const release = fullRelease("0.1.0", null, { created_at: "2026-11-01T00:00:00Z" });
  assert.equal(D.pickRelease([release]).tag_name, "native-v0.1.0");
});

test("classifyAssets sorts the five files and the checksums", () => {
  const files = D.classifyAssets(fullRelease("0.1.0", "2026-11-01T00:00:00Z").assets);
  assert.deepEqual(Object.keys(files).sort(), [
    "android",
    "checksums",
    "linux",
    "macArm",
    "macIntel",
    "windows",
  ]);
  assert.equal(files.windows.name, "World-Vitality-Setup-0.1.0.exe");
  assert.equal(files.macArm.name, "World-Vitality-0.1.0-arm64.dmg");
  assert.equal(files.macIntel.name, "World-Vitality-0.1.0-x64.dmg");
  assert.equal(files.linux.name, "World-Vitality-0.1.0.AppImage");
  assert.equal(files.android.name, "World-Vitality-0.1.0.apk");
  assert.equal(files.windows.size, 121_400_000);
  assert.equal(files.android.url, `${BASE}/native-v0.1.0/World-Vitality-0.1.0.apk`);
});

test("classifyAssets ignores unknown names, wrong hosts and malformed entries", () => {
  const tag = "native-v0.1.0";
  const files = D.classifyAssets([
    asset(tag, "World-Vitality-Setup-0.1.0.exe.blockmap"),
    asset(tag, "latest.yml"),
    asset(tag, "World-Vitality-Setup-0.1.0.exe.zip"),
    asset(tag, "notes.txt"),
    {
      name: "World-Vitality-Setup-0.1.0.exe",
      size: 1,
      browser_download_url: "https://evil.example/World-Vitality-Setup-0.1.0.exe",
    },
    { name: "World-Vitality-0.1.0.apk", size: 1 },
    { size: 1, browser_download_url: `${BASE}/${tag}/x` },
    null,
  ]);
  assert.deepEqual(files, {});
  assert.deepEqual(D.classifyAssets(undefined), {});
});

test("classifyAssets keeps the first file of a kind and tolerates a missing size", () => {
  const tag = "native-v0.1.0";
  const first = asset(tag, "World-Vitality-0.1.0.apk");
  delete first.size;
  const second = asset(tag, "World-Vitality-0.1.0.apk", 999);
  const files = D.classifyAssets([first, second]);
  assert.equal(files.android.size, null);
});

test("describeRelease gives the version, date, notes link and files", () => {
  const info = D.describeRelease(fullRelease("0.1.0", "2026-11-01T10:00:00Z"));
  assert.equal(info.version, "0.1.0");
  assert.equal(info.firstVersion, true);
  assert.equal(info.publishedAt, "2026-11-01T10:00:00Z");
  assert.equal(info.notesUrl, `https://github.com/${D.REPO}/releases/tag/native-v0.1.0`);
  assert.ok(info.files.windows && info.files.checksums);
});

test("describeRelease treats 1.0 and later as not a first version", () => {
  assert.equal(D.describeRelease(fullRelease("1.0.0", "2027-01-01T00:00:00Z")).firstVersion, false);
  assert.equal(
    D.describeRelease(fullRelease("10.2.3", "2027-01-01T00:00:00Z")).firstVersion,
    false,
  );
});

test("describeRelease refuses a release with no usable files", () => {
  assert.equal(D.describeRelease(null), null);
  const onlySums = fullRelease("0.1.0", "2026-11-01T00:00:00Z");
  onlySums.assets = onlySums.assets.filter((a) => a.name === "SHA256SUMS.txt");
  assert.equal(D.describeRelease(onlySums), null);
  assert.equal(D.describeRelease({ ...onlySums, assets: [] }), null);
});

test("describeRelease drops a notes link that does not point at GitHub", () => {
  const release = fullRelease("0.1.0", "2026-11-01T00:00:00Z", {
    html_url: "https://evil.example/notes",
  });
  assert.equal(D.describeRelease(release).notesUrl, null);
});

test("latestUsable skips a newer release that has no usable files", () => {
  const empty = fullRelease("0.2.0", "2026-12-01T00:00:00Z", { assets: [] });
  const good = fullRelease("0.1.0", "2026-11-01T00:00:00Z");
  const found = D.latestUsable([empty, good]);
  assert.equal(found.info.version, "0.1.0");
  assert.equal(found.release, good);
});

test("latestUsable returns null for no list, no releases, or nothing usable", () => {
  assert.equal(D.latestUsable(null), null);
  assert.equal(D.latestUsable([]), null);
  assert.equal(
    D.latestUsable([fullRelease("0.2.0", "2026-12-01T00:00:00Z", { assets: [] })]),
    null,
  );
});

test("latestUsable does not change the list it was given", () => {
  const list = [
    fullRelease("0.2.0", "2026-12-01T00:00:00Z", { assets: [] }),
    fullRelease("0.1.0", "2026-11-01T00:00:00Z"),
  ];
  D.latestUsable(list);
  assert.equal(list.length, 2);
});

test("detectOs recognises the common browsers", () => {
  const cases = [
    [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      0,
      "windows",
    ],
    [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0",
      0,
      "windows",
    ],
    [
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15",
      0,
      "mac",
    ],
    ["Mozilla/5.0 (X11; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0", 0, "linux"],
    [
      "Mozilla/5.0 (X11; Ubuntu; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      0,
      "linux",
    ],
    [
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
      5,
      "android",
    ],
    [
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1",
      5,
      "ios",
    ],
    [
      "Mozilla/5.0 (iPad; CPU OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1",
      5,
      "ios",
    ],
    [
      "Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      10,
      "chromeos",
    ],
  ];
  for (const [ua, touch, expected] of cases) {
    assert.equal(D.detectOs(ua, touch), expected, ua);
  }
});

test("detectOs sees an iPad that asks for the desktop site as an iPad, not a Mac", () => {
  const ua =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15";
  assert.equal(D.detectOs(ua, 5), "ios");
  assert.equal(D.detectOs(ua, 0), "mac");
  assert.equal(D.detectOs(ua, undefined), "mac");
});

test("detectOs says unknown for empty or odd input", () => {
  assert.equal(D.detectOs("", 0), "unknown");
  assert.equal(D.detectOs(undefined), "unknown");
  assert.equal(D.detectOs("SomeBot/1.0"), "unknown");
});

test("formatSize quotes decimal megabytes", () => {
  assert.equal(D.formatSize(121_400_000), "121 MB");
  assert.equal(D.formatSize(6_300_000), "6.3 MB");
  assert.equal(D.formatSize(104_000_000), "104 MB");
  assert.equal(D.formatSize(450_000), "450 KB");
  assert.equal(D.formatSize(600), "1 KB");
  assert.equal(D.formatSize(1_000_000), "1 MB");
  assert.equal(D.formatSize(9_960_000), "10 MB");
});

test("formatSize returns nothing for a size it cannot use", () => {
  assert.equal(D.formatSize(null), "");
  assert.equal(D.formatSize(undefined), "");
  assert.equal(D.formatSize(0), "");
  assert.equal(D.formatSize(-5), "");
  assert.equal(D.formatSize(NaN), "");
  assert.equal(D.formatSize("12"), "");
});

test("formatDate writes the date the same way for everyone", () => {
  assert.equal(D.formatDate("2026-11-01T10:00:00Z"), "1 November 2026");
  assert.equal(D.formatDate("2026-12-31T23:59:59Z"), "31 December 2026");
  assert.equal(D.formatDate("2027-01-01T00:00:00Z"), "1 January 2027");
  assert.equal(D.formatDate("nonsense"), "");
  assert.equal(D.formatDate(undefined), "");
});

test("the page names every file kind the logic knows, and links nowhere untrusted", () => {
  const html = fs.readFileSync(path.join(__dirname, "../public/index.html"), "utf8");
  for (const kind of ["windows", "macArm", "macIntel", "linux", "android"]) {
    assert.match(html, new RegExp(`data-file="${kind}"`), kind);
    assert.match(html, new RegExp(`data-meta="${kind}"`), kind);
  }
  // Every external link on the page is the website or this repository.
  const hrefs = [...html.matchAll(/href="(https?:\/\/[^"]+)"/g)].map((m) => m[1]);
  for (const href of hrefs) {
    assert.ok(
      href === "https://world-vitality.vercel.app" ||
        href.startsWith(`https://github.com/${D.REPO}/`),
      href,
    );
  }
  assert.doesNotMatch(html, /\sstyle="/, "no inline styles: the policy forbids them");
  assert.doesNotMatch(html, /<script(?![^>]*\ssrc=)/, "no inline scripts: the policy forbids them");
});

test("vercel.json has the policy that lets the page work and nothing more", () => {
  const config = JSON.parse(fs.readFileSync(path.join(__dirname, "../vercel.json"), "utf8"));
  const all = config.headers.find((h) => h.source === "/(.*)").headers;
  const csp = all.find((h) => h.key === "Content-Security-Policy").value;
  assert.match(csp, /default-src 'none'/);
  assert.match(csp, /script-src 'self'(;|$)/);
  assert.match(csp, /style-src 'self'(;|$)/);
  assert.match(csp, /connect-src https:\/\/api\.github\.com(;|$)/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.doesNotMatch(csp, /unsafe-/);
  assert.equal(config.outputDirectory, "public");
});
