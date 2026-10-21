/*
 * World Vitality service worker.
 *
 * What it does, and — just as important — what it refuses to do:
 *
 * 1. OFFLINE PAGE. If a page can't be reached and there's nothing saved for
 *    it, show a plain "you're offline" page (one pre-saved copy per
 *    supported language, picked from the language the app last said the
 *    person uses, else the browser's) instead of the
 *    browser's error screen.
 *
 * 2. SAVED COPIES. The last successful copy of a few read-oriented pages
 *    (dashboard, notifications, workspaces, the public Explorer) is kept on
 *    this device, so a phone with no signal can still open what it opened
 *    before. The network always goes first; the saved copy is used only if
 *    the network fails, answers with a gateway error, or takes longer than
 *    SLOW_NETWORK_MS. A copy served this way carries a
 *    `<meta name="wv-saved-copy" content="<ISO time it was saved>">` so the
 *    page can say, in words, that it is old and how old
 *    (`OfflineNotice` in `@world-vitality/ui-components` reads that tag).
 *
 * 3. BUILD FILES. Next's content-hashed files (`/_next/static/…`) are kept
 *    so a saved page can still run its scripts offline, and the brand
 *    images are refreshed in the background.
 *
 * What it will NOT do: touch `/api/`, `/auth/`, form posts, or the app's
 * own data requests; cache another site's responses; or keep anything after
 * the person leaves. Saved copies are real pages with the person's own data
 * on them, so they are deleted when the sign-out request is sent, when the
 * sign-in page is opened and when a sign-in link lands (see the fetch
 * handler), they expire after MAX_SAVED_AGE_MS whatever happens, and the app
 * can ask for them to be dropped at any time with `{ type: "wv-clear-saved" }`.
 * (Clearing the browser's site data clears them too; a session that merely
 * expires leaves them until one of those things happens.)
 * Only a copy of a *successful, non-redirected* page is ever saved — a
 * redirect to sign-in, an error page, or a page for a different account's
 * session can't end up in the cache.
 *
 * Plain JavaScript on purpose: this file is served as-is from `public/` (no
 * build step), and its behaviour is tested by running this exact file
 * against a fake worker environment
 * (`packages/ui-components/src/offline/__tests__/service-worker.test.ts`).
 */
"use strict";

var VERSION = "v1";
var OFFLINE_CACHE = "wv-offline-" + VERSION;
var PAGES_CACHE = "wv-pages-" + VERSION;
var ASSETS_CACHE = "wv-assets-" + VERSION;
var CURRENT_CACHES = [OFFLINE_CACHE, PAGES_CACHE, ASSETS_CACHE];

/** Languages that have a pre-saved offline page (`/offline?lang=…`). */
var OFFLINE_LANGUAGES = ["en", "es", "fr", "pt", "ar"];
/** Where the language the person chose in the app is kept (see `rememberLanguage`). */
var LANGUAGE_KEY = "/__wv-language";

/** Pages worth keeping a copy of. Settings and search are left out on purpose. */
var SAVED_PATHS = [
  /^\/dashboard(\/|$)/,
  /^\/notifications$/,
  /^\/workspaces(\/|$)/,
  /^\/explore(\/|$)/,
];

var MAX_SAVED_PAGES = 25;
var MAX_ASSETS = 300;
var SLOW_NETWORK_MS = 8000;
/** A saved copy older than this is treated as not saved (and removed). */
var MAX_SAVED_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** Read by `OfflineNotice`; keep in step with it (a test checks they agree). */
var SAVED_COPY_META = "wv-saved-copy";
var SAVED_AT_HEADER = "x-wv-saved-at";

self.addEventListener("install", function (event) {
  event.waitUntil(
    saveOfflinePages().then(function () {
      return self.skipWaiting();
    }),
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (names) {
        return Promise.all(
          names
            .filter(function (name) {
              return name.indexOf("wv-") === 0 && CURRENT_CACHES.indexOf(name) === -1;
            })
            .map(function (name) {
              return caches.delete(name);
            }),
        );
      })
      .then(function () {
        return self.clients.claim();
      }),
  );
});

self.addEventListener("message", function (event) {
  var data = event.data;
  if (!data) return;
  if (data.type === "wv-clear-saved") {
    event.waitUntil(clearSavedPages());
  } else if (data.type === "wv-language" && OFFLINE_LANGUAGES.indexOf(data.language) !== -1) {
    event.waitUntil(rememberLanguage(data.language));
  }
});

self.addEventListener("fetch", function (event) {
  var request = event.request;
  var url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Changing hands: the sign-out request, the sign-in page, and the page an
  // emailed sign-in link or Google lands on all mean that whoever is here
  // is not (or is no longer) necessarily the person the saved copies
  // belong to. Drop them, then carry on as normal.
  if (url.pathname === "/auth/signout" && request.method === "POST") {
    event.waitUntil(clearSavedPages());
    return;
  }
  if (
    request.mode === "navigate" &&
    (url.pathname === "/login" || url.pathname === "/auth/callback")
  ) {
    event.waitUntil(clearSavedPages());
  }

  if (request.method !== "GET") return;
  if (url.pathname.indexOf("/api/") === 0 || url.pathname.indexOf("/auth/") === 0) return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(event, url));
    return;
  }

  if (url.pathname.indexOf("/_next/static/") === 0) {
    event.respondWith(cacheFirst(event));
    return;
  }

  if (url.pathname.indexOf("/brand/") === 0 || url.pathname.indexOf("/icons/") === 0) {
    event.respondWith(staleWhileRevalidate(event));
  }
});

function isSavedPath(url) {
  for (var i = 0; i < SAVED_PATHS.length; i++) {
    if (SAVED_PATHS[i].test(url.pathname)) return true;
  }
  return false;
}

function isSavableResponse(response) {
  var type = response.headers.get("content-type") || "";
  return (
    response.status === 200 &&
    response.type === "basic" &&
    !response.redirected &&
    type.indexOf("text/html") !== -1
  );
}

function isGatewayError(response) {
  return response.status >= 502 && response.status <= 504;
}

async function handleNavigation(event, url) {
  var request = event.request;
  var savable = isSavedPath(url);
  var saved = savable ? await readSavedPage(url) : undefined;

  var network = fetch(request).then(async function (response) {
    if (savable && isSavableResponse(response)) {
      await savePage(url, response.clone());
    }
    return response;
  });
  // Keep the worker alive until the network answer (and its save) is done,
  // even when a saved copy was served first. Attached here, while the
  // event is still active, so it can never be a late `waitUntil`.
  event.waitUntil(network.catch(function () {}));

  if (!saved) {
    try {
      return await network;
    } catch {
      return offlineResponse();
    }
  }

  var timer;
  var tooSlow = new Promise(function (resolve) {
    timer = setTimeout(function () {
      resolve(null);
    }, SLOW_NETWORK_MS);
  });
  try {
    var first = await Promise.race([network, tooSlow]);
    if (first && !isGatewayError(first)) return first;
  } catch {
    // Offline: fall through to the saved copy.
  } finally {
    clearTimeout(timer);
  }
  return markSavedCopy(saved);
}

async function readSavedPage(url) {
  var cache = await caches.open(PAGES_CACHE);
  var saved = await cache.match(url.href);
  if (!saved) return undefined;
  var age = Date.now() - Date.parse(saved.headers.get(SAVED_AT_HEADER) || "");
  // An unreadable or too-old timestamp means the copy can't be vouched for.
  if (!(age >= 0 && age <= MAX_SAVED_AGE_MS)) {
    await cache.delete(url.href);
    return undefined;
  }
  return saved;
}

async function savePage(url, response) {
  var body = await response.text();
  var headers = new Headers();
  headers.set("content-type", response.headers.get("content-type") || "text/html; charset=utf-8");
  headers.set(SAVED_AT_HEADER, new Date().toISOString());
  var cache = await caches.open(PAGES_CACHE);
  await cache.put(url.href, new Response(body, { status: 200, headers: headers }));
  await trim(cache, MAX_SAVED_PAGES);
}

/** The saved copy, with a tag in its <head> saying when it was saved. */
async function markSavedCopy(saved) {
  var savedAt = saved.headers.get(SAVED_AT_HEADER) || "";
  var html = await saved.text();
  var tag = '<meta name="' + SAVED_COPY_META + '" content="' + escapeAttribute(savedAt) + '">';
  var head = /<head(\s[^>]*)?>/i.exec(html);
  var marked = head
    ? html.slice(0, head.index + head[0].length) + tag + html.slice(head.index + head[0].length)
    : tag + html;
  return new Response(marked, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function escapeAttribute(value) {
  return String(value).replace(/[&"<>]/g, function (c) {
    return { "&": "&amp;", '"': "&quot;", "<": "&lt;", ">": "&gt;" }[c];
  });
}

/**
 * The app tells the worker which language the person is using
 * (`{ type: "wv-language" }`, sent by every translated page), because that —
 * not the browser's language — is what their menus and messages are in.
 * Until it has been told, the browser's language is the best guess.
 */
async function rememberLanguage(language) {
  var cache = await caches.open(OFFLINE_CACHE);
  await cache.put(
    LANGUAGE_KEY,
    new Response(language, { headers: { "content-type": "text/plain" } }),
  );
}

async function pickLanguage() {
  var cache = await caches.open(OFFLINE_CACHE);
  var stored = await cache.match(LANGUAGE_KEY);
  if (stored) {
    var language = await stored.text();
    if (OFFLINE_LANGUAGES.indexOf(language) !== -1) return language;
  }
  var tag = String((self.navigator && self.navigator.language) || "en").toLowerCase();
  var base = tag.split("-")[0];
  return OFFLINE_LANGUAGES.indexOf(base) !== -1 ? base : "en";
}

async function offlineResponse() {
  var cache = await caches.open(OFFLINE_CACHE);
  var page =
    (await cache.match("/offline?lang=" + (await pickLanguage()))) ||
    (await cache.match("/offline?lang=en"));
  if (page) return page;
  return new Response(
    '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>Offline</title><body style="font-family:system-ui,sans-serif;padding:2rem">' +
      "<h1>You’re offline</h1><p>World Vitality can’t reach the internet right now.</p>",
    { status: 200, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

async function saveOfflinePages() {
  var cache = await caches.open(OFFLINE_CACHE);
  // One at a time and individually forgiving: a language that fails to save
  // must not stop the worker from installing.
  for (var i = 0; i < OFFLINE_LANGUAGES.length; i++) {
    var path = "/offline?lang=" + OFFLINE_LANGUAGES[i];
    try {
      var response = await fetch(path);
      if (response.status === 200) await cache.put(path, response);
    } catch {
      // Offline during install; the generic fallback above still works.
    }
  }
}

function clearSavedPages() {
  return caches.delete(PAGES_CACHE);
}

/** Drops the oldest entries (the cache lists keys oldest first). */
async function trim(cache, max) {
  var keys = await cache.keys();
  for (var i = 0; i < keys.length - max; i++) {
    await cache.delete(keys[i]);
  }
}

async function cacheFirst(event) {
  var cache = await caches.open(ASSETS_CACHE);
  var hit = await cache.match(event.request);
  if (hit) return hit;
  var response = await fetch(event.request);
  if (response.ok && response.type === "basic") {
    event.waitUntil(
      cache.put(event.request, response.clone()).then(function () {
        return trim(cache, MAX_ASSETS);
      }),
    );
  }
  return response;
}

async function staleWhileRevalidate(event) {
  var cache = await caches.open(ASSETS_CACHE);
  var hit = await cache.match(event.request);
  var refresh = fetch(event.request)
    .then(function (response) {
      if (response.ok && response.type === "basic") {
        return cache.put(event.request, response.clone()).then(function () {
          return response;
        });
      }
      return response;
    })
    .catch(function () {
      return undefined;
    });
  event.waitUntil(refresh);
  if (hit) return hit;
  var fresh = await refresh;
  return fresh || Response.error();
}
