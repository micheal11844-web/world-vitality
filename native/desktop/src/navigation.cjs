"use strict";

/**
 * Where the desktop window may go. Pure functions, no Electron, so the rules
 * that keep the window locked to the site are covered by ordinary tests
 * (test/navigation.test.cjs).
 */

const DEFAULT_APP_URL = "https://world-vitality.vercel.app";

/**
 * Where the site is. `raw` (from `WV_APP_URL`) exists so the app can be tried
 * against a test copy of the site; it only accepts https, or http on this
 * machine, so a typo can never point the window at an unencrypted address
 * elsewhere.
 */
function resolveAppUrl(raw) {
  const value = (raw || "").trim();
  if (!value) return new URL(DEFAULT_APP_URL);
  try {
    const url = new URL(value);
    const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (url.protocol === "https:" || (url.protocol === "http:" && local)) return url;
  } catch {
    // fall through to the default
  }
  return new URL(DEFAULT_APP_URL);
}

/** Addresses that start a Google sign-in, which an app window cannot complete. */
function isGoogleSignIn(value) {
  try {
    const url = new URL(value);
    if (url.hostname === "accounts.google.com") return true;
    // The site's own sign-in provider (Supabase) starts the Google flow here.
    return url.hostname.endsWith(".supabase.co") && url.pathname.startsWith("/auth/v1/authorize");
  } catch {
    return false;
  }
}

/** Only web and email links are ever handed to the computer. */
function isSafeExternal(value) {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "https:" || protocol === "mailto:";
  } catch {
    return false;
  }
}

/**
 * Where an address goes:
 *  - "inside":  the World Vitality site itself, stays in this window;
 *  - "google":  a Google sign-in, explained instead of attempted;
 *  - "browser": any other web or email link, opened in the person's browser;
 *  - "blocked": everything else (file:, javascript:, custom schemes, junk).
 */
function createRouter(appUrl) {
  const origin = appUrl.origin;
  const isAppUrl = (value) => {
    try {
      return new URL(value).origin === origin;
    } catch {
      return false;
    }
  };
  const route = (value) => {
    if (isAppUrl(value)) return "inside";
    if (isGoogleSignIn(value)) return "google";
    if (isSafeExternal(value)) return "browser";
    return "blocked";
  };
  return { origin, isAppUrl, route };
}

module.exports = { DEFAULT_APP_URL, resolveAppUrl, isGoogleSignIn, isSafeExternal, createRouter };
