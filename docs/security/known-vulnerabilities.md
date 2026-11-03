# Known, Accepted Vulnerabilities

Tracked here rather than silently ignored, per Engineering Blueprint
Section 14 (security audits, maintenance). Reviewed whenever
`.github/workflows/ci.yml`'s `dependency-audit` job output changes, and
whenever `next` is upgraded. Last checked against a fresh
`pnpm audit` on **2026-11-03**: 15 findings (0 critical, 9 high,
6 moderate), every one reasoned about below.

## Fixed on 2026-11-03 (maplibre-gl 4.7.1 to 6.16.0)

The one critical finding left, in the map library. It was not reachable here
(every map builds its own style with a fixed attribution, and popups use
`setText`), but it was a critical advisory on a direct dependency, so it went.
Audit: **16 findings down to 15, and no critical ones remain**.

It is a two-major jump on a rendering library, so the maps were looked at in a
real browser (headless Chromium with WebGL2, under the site's own
Content-Security-Policy) before and after, on all five map components:
marker count, colours and positions (within 0.5 px), popups, zoom buttons,
mouse-wheel zoom, drag, compass, attribution, overlay toggles, and a
screenshot comparison. Identical, with no script errors and no policy
violations.

What the upgrade needed, so the next person is not surprised:

- **Imports.** Version 6 is ES-module only and has no default export, so the
  maps now `import * as maplibregl`. All five go through one small module,
  `apps/web/lib/maps/maplibre.ts`, rather than importing the library each.
- **The background worker.** Version 6 ships its worker as a separate file
  (`maplibre-gl-worker.mjs`) and finds it from its own address, which means
  nothing inside a bundle. Left alone it logs "Worker failed to load", and
  the visible maps still look fine (markers and raster tiles never use it),
  so this is easy to miss. `apps/web/scripts/copy-maplibre-worker.mjs`
  (`predev` and `prebuild`, like the globe's assets; generated, not committed)
  copies it to `public/maplibre/`, and `lib/maps/maplibre.ts` points the
  library at it with the library version in the address. It is on the site's
  own address, so `worker-src 'self'` already covers it. The script fails the
  build if the address in `maplibre.ts` and the copy destination disagree.
  A browser check that parses a GeoJSON layer (which does need the worker)
  is the proof that it really starts.

## Fixed on 2026-11-01 (Next.js 15.5.22 to 15.5.28)

A fresh audit that day showed 30 findings, 5 of them critical, and this
document had drifted from it. Upgrading `next` within 15.5.x (a patch
upgrade, nothing else moved) and refreshing two transitive packages
closed 14 of them:

- **Next.js** (15.5.22, now 15.5.28): unauthenticated remote code execution
  in the Image Optimization API (two advisories), remote code execution on
  Windows-hosted servers, denial of service through Server Actions, and
  cache poisoning of statically generated pages. The site uses the Image
  Optimization endpoint (the logo), so the first of these applied.
- **sharp** (0.34.5, now 0.35.5; optional dependency of `next`): three
  image-library advisories (libvips, libheif, librsvg).
- **dompurify** (3.4.14, now 3.4.17; inside `cesium`): one critical, one
  high, three low. Refreshed within `cesium`'s own allowed range.

Checked after the upgrade: 623 tests, lint, format and type checks; a
production build; all 18 main pages load with no script errors (including
the globe); the logo is still served through the image endpoint; the billing,
organisation, admin and plan-feature browser checks pass.

## Currently accepted

| Package         | Installed     | Patched             | Severity               | Where it comes from                  |
| --------------- | ------------- | ------------------- | ---------------------- | ------------------------------------ |
| postcss         | 8.4.31        | >=8.5.23            | High (2), Moderate (2) | Pinned exactly inside `next@15.5.28` |
| nanoid          | 3.3.17        | >=3.3.18            | High                   | Inside `next` (through `postcss`)    |
| source-map-js   | 1.2.1         | >=1.2.2             | High                   | Inside `next` (through `postcss`)    |
| zod             | 3.25.76       | >=4.6.6 (one major) | High                   | Direct dependency (`data-schemas`)   |
| brace-expansion | 1.1.18, 5.0.9 | >=1.1.21, >=5.0.12  | High (4), Moderate (2) | Dev tooling: ESLint and its plugins  |
| minimatch       | 10.2.6, 3.1.5 | >=11.0.1            | Moderate               | Dev tooling: ESLint and its plugins  |

Why each is accepted for now:

- **postcss, nanoid, source-map-js** (all inside `next`): used at build time
  to process CSS; no user-supplied CSS is ever processed at runtime. Next
  pins `postcss` to exactly 8.4.31 even in 15.5.28, so only a newer Next
  closes them. An override was tried before and reverted (~300 lockfile lines
  changed, an unrelated major jump in ESLint); not worth the risk for a
  build-time-only path.
- **zod** ([GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)):
  memory exhaustion when validating oversized collections that have size
  limits. `data-schemas` validates responses from the weather, soil and
  alert providers the app calls itself; an attacker cannot choose what those
  send. Zod 3 to 4 is a major change touching every schema, so it waits for
  its own change with its own tests.
- **brace-expansion, minimatch**: pulled in by ESLint and its plugins, which
  run on developers' machines and in CI over this repository's own files,
  never on user input and never in the deployed site. They would only matter
  if someone linted a file with a hostile glob pattern in it.

**Do not** treat `dependency-audit`'s `continue-on-error: true` in CI as
"vulnerabilities don't matter". It exists so real, currently-unfixable
findings do not get lost in a wall of expected noise, and so a _new,
actually-fixable_ finding is still visible in every CI run even though it
will not block the merge. Revisit whether it should block merges once this
list is empty.

## Process: how this document drifted, and how not to let it again

It went about two months (since the 2026-09-02 audit) without being compared to a fresh audit while new
advisories were published against `next`, `sharp`, `dompurify` and others.
`dependency-audit` goes red in CI whenever there is any finding, but a red
job that is allowed to fail is easy to stop looking at. Until this list is
empty, do this each time a `next` patch release appears (they are frequent)
and at least monthly:

1. `pnpm audit` and compare with the table above.
2. Upgrade `next` and `@next/eslint-plugin-next` to the newest 15.5.x
   (`pnpm install`, then `pnpm update sharp --depth Infinity -r` so the
   image library follows).
3. Run the checks (`pnpm test`, lint, a production build) and look at the
   main pages in a browser.
4. Update the table and the date at the top.
