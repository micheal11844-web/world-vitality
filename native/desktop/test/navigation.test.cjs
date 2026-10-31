"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  DEFAULT_APP_URL,
  resolveAppUrl,
  isGoogleSignIn,
  isSafeExternal,
  createRouter,
} = require("../src/navigation.cjs");

test("the site address defaults to the live site", () => {
  assert.equal(resolveAppUrl(undefined).href, `${DEFAULT_APP_URL}/`);
  assert.equal(resolveAppUrl("").href, `${DEFAULT_APP_URL}/`);
  assert.equal(resolveAppUrl("   ").href, `${DEFAULT_APP_URL}/`);
});

test("a test address is accepted only over https, or http on this machine", () => {
  assert.equal(resolveAppUrl("https://staging.example.com").origin, "https://staging.example.com");
  assert.equal(resolveAppUrl("http://localhost:3107").origin, "http://localhost:3107");
  assert.equal(resolveAppUrl("http://127.0.0.1:3000").origin, "http://127.0.0.1:3000");
  // Anything else falls back to the live site rather than an unencrypted or odd address.
  assert.equal(resolveAppUrl("http://staging.example.com").href, `${DEFAULT_APP_URL}/`);
  assert.equal(resolveAppUrl("ftp://example.com").href, `${DEFAULT_APP_URL}/`);
  assert.equal(resolveAppUrl("file:///etc/passwd").href, `${DEFAULT_APP_URL}/`);
  assert.equal(resolveAppUrl("not a url").href, `${DEFAULT_APP_URL}/`);
});

test("Google sign-in addresses are recognised, including the site's own provider's start page", () => {
  assert.equal(isGoogleSignIn("https://accounts.google.com/o/oauth2/v2/auth?x=1"), true);
  assert.equal(
    isGoogleSignIn("https://abcdefgh.supabase.co/auth/v1/authorize?provider=google"),
    true,
  );
  assert.equal(isGoogleSignIn("https://abcdefgh.supabase.co/rest/v1/profiles"), false);
  assert.equal(isGoogleSignIn("https://www.google.com/search?q=weather"), false);
  assert.equal(isGoogleSignIn("not a url"), false);
});

test("only web and email links may be handed to the computer", () => {
  assert.equal(isSafeExternal("https://example.com/a"), true);
  assert.equal(isSafeExternal("mailto:someone@example.com"), true);
  assert.equal(isSafeExternal("http://example.com"), false);
  assert.equal(isSafeExternal("file:///etc/passwd"), false);
  assert.equal(isSafeExternal("javascript:alert(1)"), false);
  assert.equal(isSafeExternal("smb://server/share"), false);
  assert.equal(isSafeExternal("ms-msdt:/id PCWDiagnostic"), false);
  assert.equal(isSafeExternal(""), false);
});

test("addresses are routed to this window, the browser, an explanation, or nowhere", () => {
  const router = createRouter(new URL("https://world-vitality.vercel.app"));
  assert.equal(router.route("https://world-vitality.vercel.app/settings?x=1"), "inside");
  assert.equal(router.route("https://world-vitality.vercel.app"), "inside");
  assert.equal(router.route("https://accounts.google.com/signin"), "google");
  assert.equal(
    router.route("https://abcdefgh.supabase.co/auth/v1/authorize?provider=google"),
    "google",
  );
  assert.equal(router.route("https://example.com"), "browser");
  assert.equal(router.route("mailto:help@example.com"), "browser");
  assert.equal(router.route("file:///C:/Windows/System32/calc.exe"), "blocked");
  assert.equal(router.route("javascript:alert(1)"), "blocked");
  assert.equal(router.route("data:text/html,<script>1</script>"), "blocked");
  assert.equal(router.route("whatever"), "blocked");
});

test("look-alike hosts are not the site", () => {
  const router = createRouter(new URL("https://world-vitality.vercel.app"));
  assert.equal(router.route("https://world-vitality.vercel.app.evil.com/"), "browser");
  assert.equal(router.route("https://evil.com/world-vitality.vercel.app"), "browser");
  assert.equal(router.route("http://world-vitality.vercel.app/"), "blocked");
  assert.equal(router.route("https://world-vitality.vercel.app:8443/"), "browser");
  assert.equal(router.route("https://user@evil.com@world-vitality.vercel.app/"), "inside");
});

test("the website recognises the word this app adds to its user agent", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const web = fs.readFileSync(
    path.join(__dirname, "../../../apps/web/lib/pwa/native-shell.ts"),
    "utf8",
  );
  const found = /const NATIVE_SHELL = \/(.+)\/;/.exec(web);
  assert.ok(found, "pattern found in native-shell.ts");
  const pattern = new RegExp(found[1]);
  const main = fs.readFileSync(path.join(__dirname, "../src/main.cjs"), "utf8");
  assert.match(main, /WorldVitalityDesktop\/\$\{app\.getVersion\(\)\}/);
  const { version } = require("../package.json");
  assert.ok(pattern.test(`Mozilla/5.0 Electron/38 WorldVitalityDesktop/${version}`));
  assert.ok(!pattern.test("Mozilla/5.0 (X11; Linux x86_64) Chrome/130"));
});
