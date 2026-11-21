# Browser checks (`tools/e2e`)

Opens the built web app in a real Chromium and checks what unit tests cannot: how a page is
laid out, what the 3D Globe does once it has drawn, how keyboard focus moves, what the help chat
sends. It runs against the **production build** of `apps/web`, with every outside service
answered from canned data, so it needs no network, no database and no keys.

This is a standalone npm project (it is not in the pnpm workspace, so it never changes
`pnpm-lock.yaml`), like `native/`.

## Run it

```sh
# once
cd tools/e2e && npm ci && npx playwright install chromium
# every time the app changes
pnpm --filter @world-vitality/web build
cd tools/e2e && node run.cjs              # everything (about 10 to 15 minutes)
node run.cjs landing                      # or just some specs: landing, ux, globe, help-chat
```

Screenshots and the site's own output land in `tools/e2e/.out/` (git-ignored). The runner exits
non-zero when any check fails.

## What is in it

| Spec                  | Checks                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `specs/landing.cjs`   | The five languages, the picker, the native-app prompt, and the spacing of the small links (a gap, one row each, one start edge) at desktop and phone width, left-to-right and right-to-left.                                                                                                                                                                                                                                                                                 |
| `specs/ux.cjs`        | Tab titles (English and Spanish); the 404 page in five languages (right-to-left for Arabic) and the error page; Help as a header button on a phone and Orbi in the corner on a wide screen; 44 px touch targets (links, the language picker, checkbox rows); the page area becoming one Tab stop when it scrolls and has nothing to focus; Explore's example places and the AI rail opening with the first result; the Disaster Monitoring Globe card; the sign-in landmark. |
| `specs/globe.cjs`     | `/globe` enters full view by itself once the 3D view has drawn; corner buttons; Escape peels one layer at a time; the events list by keyboard; focus returns; real Fullscreen API. Desktop and phone (Arabic).                                                                                                                                                                                                                                                               |
| `specs/help-chat.cjs` | The help chat with the outside assistant off, on, and misbehaving (fail, slow, wrong price, tool-call leak, not JSON): what is sent, what is never sent, the rate limit, the built-in fallback.                                                                                                                                                                                                                                                                              |

`harness/` holds the stand-ins: `mock-supabase.cjs` (auth and a few tables, run as its own
process) and `mock-fetch.cjs` (preloaded into the site's Node process with `--require`; answers
Open-Meteo, NASA, USGS, GDACS, the camera feeds and a fake Flow). Several of the fakes can be
steered with `MOCK_*` variables (see the comments in the file).

## Adding a check

Write `specs/<name>.cjs` using `harness/browser.cjs` (`launch`, `BASE`, `SHOTS`, `signedIn`) and
`harness/check.cjs` (`checker`, which prints one PASS/FAIL line per check), add it to `RUNS` in
`run.cjs`, and run it on its own with `node run.cjs <name>`.

WebGL has no graphics card in CI, so Chromium draws it in software
(`harness/browser.cjs`); the Globe checks wait for the page's own `data-immersive="true"` rather
than a fixed time.

## In CI

The `browser-checks` job in `.github/workflows/ci.yml` builds the site and runs `node run.cjs`.
It starts as **informational** (`continue-on-error: true`), like the dependency audit, until it has
run stably for a while; then flip it to blocking. Screenshots from the run are attached to the
workflow run as an artifact.
