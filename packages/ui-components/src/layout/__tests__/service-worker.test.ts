import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { SAVED_COPY_META } from "../OfflineNotice.js";

/**
 * Runs the real, shipped `apps/web/public/sw.js` — not a copy — against a
 * small fake of the service-worker environment (an in-memory Cache API, a
 * scripted `fetch`, hand-built fetch events). The page-facing behaviour it
 * promises is what matters here: network first, a saved copy only when the
 * network fails, nothing saved that shouldn't be, and everything dropped
 * when the person leaves.
 */
const SW_URL = new URL("../../../../../apps/web/public/sw.js", import.meta.url);
const SW_SOURCE = readFileSync(SW_URL, "utf8");
const ORIGIN = "https://wv.test";
const DAY = 24 * 60 * 60 * 1000;

type FetchImpl = (request: unknown) => Promise<Response>;

class FakeCache {
  store = new Map<string, Response>();
  private key(input: unknown): string {
    return typeof input === "string" ? new URL(input, ORIGIN).href : (input as { url: string }).url;
  }
  async match(input: unknown) {
    return this.store.get(this.key(input))?.clone();
  }
  async put(input: unknown, response: Response) {
    this.store.set(this.key(input), response.clone());
  }
  async keys() {
    return [...this.store.keys()].map((url) => ({ url }));
  }
  async delete(input: unknown) {
    return this.store.delete(this.key(input));
  }
}

class FakeCaches {
  caches = new Map<string, FakeCache>();
  async open(name: string) {
    let cache = this.caches.get(name);
    if (!cache) {
      cache = new FakeCache();
      this.caches.set(name, cache);
    }
    return cache;
  }
  async keys() {
    return [...this.caches.keys()];
  }
  async delete(name: string) {
    return this.caches.delete(name);
  }
  get(name: string): FakeCache | undefined {
    return this.caches.get(name);
  }
}

function html(
  body: string,
  init: { status?: number; type?: string; redirected?: boolean; contentType?: string } = {},
) {
  const response = new Response(body, {
    status: init.status ?? 200,
    headers: {
      "content-type": init.contentType ?? "text/html; charset=utf-8",
      "cache-control": "private, no-store",
    },
  });
  Object.defineProperty(response, "type", { value: init.type ?? "basic" });
  if (init.redirected) Object.defineProperty(response, "redirected", { value: true });
  return response;
}

const PAGE =
  '<!DOCTYPE html><html lang="en"><head><meta charSet="utf-8"/><title>Dash</title></head><body>HELLO-DASHBOARD</body></html>';

interface Worker {
  caches: FakeCaches;
  setFetch(impl: FetchImpl): void;
  fetched: string[];
  setLanguage(tag: string): void;
  setSlowAfter(ms: number): void;
  claimed: () => boolean;
  skipped: () => boolean;
  install(): Promise<void>;
  activate(): Promise<void>;
  message(data: unknown): Promise<void>;
  /** Dispatches a fetch event. `responded` is undefined if the worker declined to handle it. */
  request(
    url: string,
    init?: { method?: string; mode?: string },
  ): Promise<{ responded: Response | undefined; settle: () => Promise<void> }>;
}

function loadWorker(): Worker {
  const fakeCaches = new FakeCaches();
  const listeners = new Map<string, (event: unknown) => void>();
  let fetchImpl: FetchImpl = async () => {
    throw new TypeError("network down");
  };
  const fetched: string[] = [];
  const self = {
    location: new URL(ORIGIN),
    navigator: { language: "en-US" },
    clients: {
      claim: async () => {
        claimed = true;
      },
    },
    skipWaiting: async () => {
      skipped = true;
    },
    addEventListener: (type: string, fn: (event: unknown) => void) => listeners.set(type, fn),
  };
  let claimed = false;
  let skipped = false;

  const context = vm.createContext({
    self,
    caches: fakeCaches,
    fetch: (request: unknown) => {
      const url = typeof request === "string" ? request : (request as { url: string }).url;
      fetched.push(new URL(url, ORIGIN).pathname + new URL(url, ORIGIN).search);
      return fetchImpl(typeof request === "string" ? new URL(request, ORIGIN).href : request);
    },
    Response,
    Headers,
    Request,
    URL,
    Date,
    setTimeout,
    clearTimeout,
    String,
    Promise,
  });
  vm.runInContext(SW_SOURCE, context);

  function event(extra: Record<string, unknown>) {
    const waits: Promise<unknown>[] = [];
    let responded: Promise<Response> | undefined;
    return {
      ...extra,
      waitUntil: (p: Promise<unknown>) => void waits.push(Promise.resolve(p)),
      respondWith: (p: Promise<Response>) => {
        responded = p;
      },
      get responded() {
        return responded;
      },
      waits,
    };
  }

  const must = (type: string) => {
    const fn = listeners.get(type);
    assert.ok(fn, `worker registers a ${type} listener`);
    return fn;
  };

  return {
    caches: fakeCaches,
    fetched,
    setFetch: (impl) => {
      fetchImpl = impl;
    },
    setLanguage: (tag) => {
      self.navigator.language = tag;
    },
    setSlowAfter: (ms) => {
      (context as { SLOW_NETWORK_MS: number }).SLOW_NETWORK_MS = ms;
    },
    claimed: () => claimed,
    skipped: () => skipped,
    async install() {
      const e = event({});
      must("install")(e);
      await Promise.all(e.waits);
    },
    async activate() {
      const e = event({});
      must("activate")(e);
      await Promise.all(e.waits);
    },
    async message(data) {
      const e = event({ data });
      must("message")(e);
      await Promise.all(e.waits);
    },
    async request(url, init = {}) {
      const request = {
        url: new URL(url, ORIGIN).href,
        method: init.method ?? "GET",
        mode: init.mode ?? "navigate",
        headers: new Headers(),
      };
      const e = event({ request });
      must("fetch")(e);
      const promise = e.responded;
      const responded = promise ? await promise : undefined;
      return { responded, settle: async () => void (await Promise.all(e.waits)) };
    },
  };
}

const pages = (w: Worker) => w.caches.get("wv-pages-v1");

async function seedSaved(w: Worker, path: string, body: string, savedAt: Date) {
  const cache = await w.caches.open("wv-pages-v1");
  await cache.put(
    new URL(path, ORIGIN).href,
    new Response(body, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "x-wv-saved-at": savedAt.toISOString(),
      },
    }),
  );
}

// ---------------------------------------------------------------- contract

test("the meta tag name the worker injects is the one the page component reads", () => {
  const match = /var SAVED_COPY_META = "([^"]+)"/.exec(SW_SOURCE);
  assert.ok(match, "sw.js declares SAVED_COPY_META");
  assert.equal(match[1], SAVED_COPY_META);
});

// ---------------------------------------------------------------- install / activate

test("install saves one offline page per language and takes over without waiting", async () => {
  const w = loadWorker();
  w.setFetch(async (req) => html(`OFFLINE ${req as string}`));
  await w.install();
  const offline = await w.caches.open("wv-offline-v1");
  assert.deepEqual(
    [...offline.store.keys()].sort(),
    ["ar", "en", "es", "fr", "pt"].map((l) => `${ORIGIN}/offline?lang=${l}`),
  );
  assert.ok(w.skipped());
});

test("install still succeeds when the network is down at that moment", async () => {
  const w = loadWorker();
  await w.install(); // fetch rejects
  assert.ok(w.skipped());
});

test("activate removes the worker's own old caches only, then takes control of open pages", async () => {
  const w = loadWorker();
  await w.caches.open("wv-pages-v0");
  await w.caches.open("wv-pages-v1");
  await w.caches.open("some-other-app");
  await w.activate();
  assert.deepEqual((await w.caches.keys()).sort(), ["some-other-app", "wv-pages-v1"]);
  assert.ok(w.claimed());
});

// ---------------------------------------------------------------- saved copies

test("a page is fetched from the network first, and a copy is kept with the time it was saved", async () => {
  const w = loadWorker();
  w.setFetch(async () => html(PAGE));
  const { responded, settle } = await w.request("/dashboard");
  assert.ok(responded);
  assert.equal(await responded.text(), PAGE);
  await settle();
  const saved = await pages(w)?.match(`${ORIGIN}/dashboard`);
  assert.ok(saved, "a copy was saved");
  assert.equal(await saved.text(), PAGE);
  const at = Date.parse(saved.headers.get("x-wv-saved-at") ?? "");
  assert.ok(Math.abs(Date.now() - at) < 5000, "saved-at is now");
  assert.equal(saved.headers.get("cache-control"), null, "only the type and the time are kept");
});

test("offline with a saved copy: the copy is shown, tagged with when it was saved", async () => {
  const w = loadWorker();
  const savedAt = new Date(Date.now() - 2 * 60 * 60 * 1000);
  await seedSaved(w, "/dashboard", PAGE, savedAt);
  const { responded } = await w.request("/dashboard");
  assert.ok(responded);
  const text = await responded.text();
  assert.ok(
    text.includes(`<head><meta name="wv-saved-copy" content="${savedAt.toISOString()}">`),
    "tag is the first thing in <head>",
  );
  assert.ok(text.includes("HELLO-DASHBOARD"));
  assert.equal(responded.status, 200);
});

test("the tag is added to a <head> that has attributes, and ahead of everything when there is none", async () => {
  const w = loadWorker();
  await seedSaved(
    w,
    "/dashboard",
    '<html><head data-x="1"><title>t</title></head><body>b</body></html>',
    new Date(),
  );
  await seedSaved(w, "/notifications", "<p>no head here</p>", new Date());
  const a = await (await w.request("/dashboard")).responded?.text();
  const b = await (await w.request("/notifications")).responded?.text();
  assert.ok(a?.includes('<head data-x="1"><meta name="wv-saved-copy"'));
  assert.ok(b?.startsWith('<meta name="wv-saved-copy"'));
});

test("the network wins whenever it answers: a saved copy is never shown over a live page", async () => {
  const w = loadWorker();
  await seedSaved(w, "/dashboard", "OLD", new Date(Date.now() - DAY));
  w.setFetch(async () => html("NEW-LIVE"));
  const { responded, settle } = await w.request("/dashboard");
  assert.equal(await responded?.text(), "NEW-LIVE");
  await settle();
  assert.equal(
    await (await pages(w)?.match(`${ORIGIN}/dashboard`))?.text(),
    "NEW-LIVE",
    "and the copy is refreshed",
  );
});

test("a gateway error is not shown when a saved copy exists, but is passed through when it doesn't", async () => {
  const w = loadWorker();
  w.setFetch(async () => html("bad gateway", { status: 502 }));
  const none = await w.request("/dashboard");
  assert.equal(none.responded?.status, 502);
  assert.equal(
    await pages(w)?.match(`${ORIGIN}/dashboard`),
    undefined,
    "an error page is never saved",
  );

  await seedSaved(w, "/dashboard", PAGE, new Date());
  const withCopy = await w.request("/dashboard");
  assert.ok((await withCopy.responded?.text())?.includes("wv-saved-copy"));
});

test("a slow network falls back to the saved copy, and the late answer still refreshes it", async () => {
  const w = loadWorker();
  w.setSlowAfter(20);
  await seedSaved(w, "/dashboard", PAGE, new Date(Date.now() - 60_000));
  let finish: (r: Response) => void = () => {};
  w.setFetch(() => new Promise<Response>((resolve) => (finish = resolve)));
  const { responded, settle } = await w.request("/dashboard");
  assert.ok(
    (await responded?.text())?.includes("wv-saved-copy"),
    "served the saved copy after the wait",
  );
  finish(html("LATE-BUT-FRESH"));
  await settle();
  assert.equal(await (await pages(w)?.match(`${ORIGIN}/dashboard`))?.text(), "LATE-BUT-FRESH");
});

test("a copy older than a week is not shown, and is removed", async () => {
  const w = loadWorker();
  await seedSaved(w, "/dashboard", PAGE, new Date(Date.now() - 8 * DAY));
  const { responded } = await w.request("/dashboard");
  assert.ok(!(await responded?.text())?.includes("HELLO-DASHBOARD"), "the old copy was not shown");
  assert.equal(await pages(w)?.match(`${ORIGIN}/dashboard`), undefined);
});

test("a copy with no readable time is treated as too old to trust", async () => {
  const w = loadWorker();
  const cache = await w.caches.open("wv-pages-v1");
  await cache.put(
    `${ORIGIN}/dashboard`,
    new Response(PAGE, { headers: { "content-type": "text/html" } }),
  );
  const { responded } = await w.request("/dashboard");
  assert.ok(!(await responded?.text())?.includes("wv-saved-copy"));
  assert.equal(await cache.match(`${ORIGIN}/dashboard`), undefined);
});

test("only successful, same-site, non-redirected HTML pages are ever saved", async () => {
  const w = loadWorker();
  const tries: Array<[string, Response]> = [
    ["/dashboard", html(PAGE, { redirected: true })], // landed after a redirect (e.g. to sign-in)
    ["/notifications", html(PAGE, { status: 404 })],
    ["/workspaces/agriculture", html(PAGE, { status: 500 })],
    ["/explore", html("{}", { contentType: "application/json" })],
    ["/dashboard/x", html(PAGE, { type: "opaqueredirect" })],
    ["/dashboard/y", html(PAGE, { type: "cors" })],
  ];
  for (const [path, response] of tries) {
    w.setFetch(async () => response);
    const { settle } = await w.request(path);
    await settle();
  }
  assert.equal(pages(w)?.store.size ?? 0, 0);
});

test("pages outside the saved list (settings, search, sign-in, home) are never saved", async () => {
  const w = loadWorker();
  w.setFetch(async () => html(PAGE));
  for (const path of ["/settings", "/search?q=flood", "/login", "/", "/welcome", "/globe"]) {
    const { settle } = await w.request(path);
    await settle();
  }
  assert.equal(pages(w)?.store.size ?? 0, 0);
});

test("the saved list covers the dashboard, notifications, workspaces and the public Explorer", async () => {
  const w = loadWorker();
  w.setFetch(async () => html(PAGE));
  const saved = [
    "/dashboard",
    "/notifications",
    "/workspaces/agriculture/map",
    "/explore",
    "/explore?place=x",
  ];
  for (const path of saved) await (await w.request(path)).settle();
  assert.deepEqual(
    [...(pages(w)?.store.keys() ?? [])].sort(),
    saved.map((p) => `${ORIGIN}${p}`).sort(),
  );
});

test("only the newest 25 copies are kept", async () => {
  const w = loadWorker();
  w.setFetch(async () => html(PAGE));
  for (let i = 0; i < 27; i++) await (await w.request(`/workspaces/w${i}`)).settle();
  const keys = [...(pages(w)?.store.keys() ?? [])];
  assert.equal(keys.length, 25);
  assert.ok(!keys.includes(`${ORIGIN}/workspaces/w0`) && !keys.includes(`${ORIGIN}/workspaces/w1`));
  assert.ok(keys.includes(`${ORIGIN}/workspaces/w26`));
});

// ---------------------------------------------------------------- the offline page

test("offline with nothing saved: the offline page in the browser's language", async () => {
  const w = loadWorker();
  w.setFetch(async (req) => html(`OFFLINE-PAGE ${String(req)}`));
  await w.install();
  w.setFetch(async () => {
    throw new TypeError("offline");
  });

  for (const [language, expected] of [
    ["es-MX", "es"],
    ["fr", "fr"],
    ["pt-BR", "pt"],
    ["ar-EG", "ar"],
    ["de-DE", "en"],
    ["en-GB", "en"],
  ] as const) {
    w.setLanguage(language);
    const { responded } = await w.request("/settings");
    assert.equal(
      await responded?.text(),
      `OFFLINE-PAGE ${ORIGIN}/offline?lang=${expected}`,
      language,
    );
  }
});

test("the language the app last reported wins over the browser's, and survives a restart", async () => {
  const w = loadWorker();
  w.setFetch(async (req) => html(`OFFLINE-PAGE ${String(req)}`));
  await w.install();
  w.setFetch(async () => {
    throw new TypeError("offline");
  });
  w.setLanguage("en-US");
  await w.message({ type: "wv-language", language: "ar" });
  const { responded } = await w.request("/settings");
  assert.equal(await responded?.text(), `OFFLINE-PAGE ${ORIGIN}/offline?lang=ar`);

  // Changing language in the app replaces it.
  await w.message({ type: "wv-language", language: "fr" });
  assert.equal(
    await (await w.request("/settings")).responded?.text(),
    `OFFLINE-PAGE ${ORIGIN}/offline?lang=fr`,
  );
});

test("a language the worker has no offline page for is ignored", async () => {
  const w = loadWorker();
  w.setFetch(async (req) => html(`OFFLINE-PAGE ${String(req)}`));
  await w.install();
  w.setFetch(async () => {
    throw new TypeError("offline");
  });
  w.setLanguage("pt-BR");
  await w.message({ type: "wv-language", language: "de" });
  await w.message({ type: "wv-language", language: "../../evil" });
  await w.message({ type: "wv-language" });
  const { responded } = await w.request("/settings");
  assert.equal(
    await responded?.text(),
    `OFFLINE-PAGE ${ORIGIN}/offline?lang=pt`,
    "browser language is used",
  );
});

test("if even the offline page was never saved, a bare built-in message is shown rather than an error", async () => {
  const w = loadWorker();
  const { responded } = await w.request("/dashboard");
  assert.equal(responded?.status, 200);
  assert.ok((await responded?.text())?.includes("You’re offline"));
});

// ---------------------------------------------------------------- leaving

test("signing out deletes every saved copy, and the request itself is left alone", async () => {
  const w = loadWorker();
  await seedSaved(w, "/dashboard", PAGE, new Date());
  const { responded, settle } = await w.request("/auth/signout", { method: "POST" });
  await settle();
  assert.equal(responded, undefined, "the worker doesn't touch the sign-out request");
  assert.equal(pages(w), undefined, "copies are gone");
});

test("arriving at the sign-in page, or on a sign-in link's landing, deletes saved copies too", async () => {
  for (const path of ["/login", "/auth/callback?code=abc"]) {
    const w = loadWorker();
    await seedSaved(w, "/dashboard", PAGE, new Date());
    const { settle } = await w.request(path);
    await settle();
    assert.equal(pages(w), undefined, path);
  }
});

test("the app can ask for saved copies to be dropped", async () => {
  const w = loadWorker();
  await seedSaved(w, "/dashboard", PAGE, new Date());
  await w.message({ type: "wv-clear-saved" });
  assert.equal(pages(w), undefined);
  await seedSaved(w, "/dashboard", PAGE, new Date());
  await w.message({ type: "something-else" });
  assert.ok(pages(w), "other messages do nothing");
});

// ---------------------------------------------------------------- what it must not touch

test("data requests, form posts, other sites and the app's own background fetches are left alone", async () => {
  const w = loadWorker();
  w.setFetch(async () => html(PAGE));
  const untouched: Array<[string, { method?: string; mode?: string }]> = [
    ["/api/notifications/summary", { mode: "cors" }],
    ["/api/notifications/summary", { mode: "navigate" }],
    ["/auth/signout", { mode: "navigate" }], // a GET to an auth route
    ["/dashboard", { method: "POST" }],
    ["/dashboard", { mode: "cors" }], // the framework's own page-data fetch
    ["https://tile.openstreetmap.org/1/1/1.png", { mode: "cors" }],
    ["/settings/export", { mode: "cors" }],
  ];
  for (const [url, init] of untouched) {
    const { responded } = await w.request(url, init);
    assert.equal(
      responded,
      undefined,
      `${init.method ?? "GET"} ${url} (${init.mode ?? "navigate"})`,
    );
  }
  assert.equal(w.fetched.length, 0, "and nothing was fetched on their behalf");
});

// ---------------------------------------------------------------- build files and brand images

test("hashed build files are served from storage after the first load", async () => {
  const w = loadWorker();
  let calls = 0;
  w.setFetch(async () => {
    calls++;
    return html("console.log(1)", { contentType: "application/javascript" });
  });
  const first = await w.request("/_next/static/chunks/app-abc.js", { mode: "no-cors" });
  assert.equal(await first.responded?.text(), "console.log(1)");
  await first.settle();
  const second = await w.request("/_next/static/chunks/app-abc.js", { mode: "no-cors" });
  assert.equal(await second.responded?.text(), "console.log(1)");
  assert.equal(calls, 1, "the second request never reached the network");
});

test("a failed build-file request is not stored", async () => {
  const w = loadWorker();
  w.setFetch(async () => html("nope", { status: 404 }));
  const { responded, settle } = await w.request("/_next/static/chunks/gone.js", {
    mode: "no-cors",
  });
  assert.equal(responded?.status, 404);
  await settle();
  assert.equal(w.caches.get("wv-assets-v1")?.store.size ?? 0, 0);
});

test("brand images show the stored copy at once and refresh it in the background", async () => {
  const w = loadWorker();
  const cache = await w.caches.open("wv-assets-v1");
  await cache.put(`${ORIGIN}/brand/world-vitality-mark.png`, new Response("OLD-IMAGE"));
  w.setFetch(async () => html("NEW-IMAGE", { contentType: "image/png" }));
  const { responded, settle } = await w.request("/brand/world-vitality-mark.png", {
    mode: "no-cors",
  });
  assert.equal(await responded?.text(), "OLD-IMAGE");
  await settle();
  assert.equal(
    await (await cache.match(`${ORIGIN}/brand/world-vitality-mark.png`))?.text(),
    "NEW-IMAGE",
  );
});

test("a brand image that was never stored and can't be fetched fails like any missing image", async () => {
  const w = loadWorker();
  const { responded } = await w.request("/icons/icon-192.png", { mode: "no-cors" });
  assert.equal(responded?.type, "error");
});
