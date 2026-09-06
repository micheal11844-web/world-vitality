/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace packages ship pre-built dist/ output (see each package's
  // package.json) — `pnpm run build` at the repo root must run before
  // `next build`/`next dev` picks up any change to a workspace package.
  // This mirrors the ADR-0001 monorepo's existing tsc --build project-
  // reference graph rather than introducing a second, Next-specific
  // transpilation path for the same source.

  // Security headers (BUILD_PLAN ticket 7.2 + Stage-8 gap closure),
  // applied to every route.
  //
  // INCIDENT RECORD (see docs/runbooks/incident-response.md and
  // BUILD_PLAN changelog for the full account): an earlier version of
  // this CSP used `script-src 'self'` with no `'unsafe-inline'` or
  // nonce. That blocks Next.js App Router's OWN inline hydration/RSC
  // scripts, not just injected ones — it produced a fully blank page
  // in production for every user. Root-caused and fixed by reverting
  // script-src to the 'unsafe-inline' fallback below.
  //
  // Why not a nonce-based CSP (the fully strict option): verified
  // against Next.js's own docs before touching this a second time —
  // nonces require EVERY page in the app to be dynamically rendered
  // (no static generation, no ISR, higher hosting cost, slower loads
  // on Vercel's serverless model), because a statically-generated page
  // has no request to derive a per-request nonce from. That's a real,
  // consequential, hard-to-reverse architectural tradeoff — not
  // something to decide unilaterally while fixing an outage. Left as
  // deliberate future work if strict CSP is ever prioritized; the
  // Content-Security-Policy Level 3 `'strict-dynamic'` + nonce pattern
  // is the documented path if/when that tradeoff is chosen (Next 15.x
  // convention: `middleware.ts` exporting `middleware`, NOT `proxy.ts`
  // — that's Next 16's renamed convention, confirmed against this
  // project's actual pinned Next version, 15.5.22, before writing
  // anything, since a `proxy.ts` file is silently ignored on Next 15).
  //
  // This version — 'unsafe-inline' for script-src — still keeps
  // object-src/base-uri/frame-ancestors closed, and style-src was
  // already 'unsafe-inline' from the start (inline `style={{...}}`
  // throughout this codebase's components). It's a real reduction in
  // XSS defense-in-depth versus a strict nonce policy, honestly
  // acknowledged rather than glossed over — but it's what Next's own
  // docs recommend as the supported "Without Nonces" fallback, and,
  // critically, it actually works.
  //
  // connect-src's Supabase host is now derived from the real
  // SUPABASE_URL server env var at build/server-start time (Node.js
  // context, not the browser) rather than a manually-edited
  // placeholder — one less thing to remember to update by hand.
  async headers() {
    const supabaseHost = process.env.SUPABASE_URL
      ? new URL(process.env.SUPABASE_URL).host
      : "*.supabase.co"; // fallback only if the env var is somehow unset
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              // Explicit worker-src (BUILD_PLAN "STAGE — GOD'S EYE
              // GLOBE VIEW") rather than relying on the fallback-to-
              // script-src behavior CSP normally uses when worker-src
              // is unset. This project has already been burned once by
              // an under-specified CSP directive silently breaking a
              // real feature only in production (see the script-src
              // incident record above) — CesiumJS (the 3D globe
              // library) spins up several same-origin Web Workers for
              // geometry/imagery processing and, in some code paths,
              // bootstraps them via `blob:` URLs internally, so both
              // are allowed explicitly rather than left to an assumed
              // fallback that may not hold for every browser/Cesium
              // version.
              "worker-src 'self' blob:",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https://tile.openstreetmap.org",
              // tile.openstreetmap.org needs to be in BOTH img-src and
              // connect-src: MapLibre GL (apps/web's map view) fetches
              // raster tiles via fetch()/XHR internally for canvas
              // rendering, not plain <img> tags — a real bug found in
              // production (map tiles silently failing with a CSP
              // "Refused to connect" console error, not a MapLibre bug)
              // after only adding this host to img-src. connect-src is
              // what actually gates fetch()/XHR destinations; img-src
              // only covers direct <img src="...">/CSS background-image
              // loads, which isn't how MapLibre loads tile data.
              `connect-src 'self' https://power.larc.nasa.gov https://tile.openstreetmap.org https://${supabaseHost}`,
              "font-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "frame-ancestors 'none'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
      {
        // Scoped CSP override for /globe only (BUILD_PLAN "STAGE —
        // GLOBE VIEW: UNSAFE-EVAL FOR CESIUM"), placed after the
        // general `/:path*` rule above — Next.js's own documented
        // header-overriding behavior ("if two headers match the same
        // path and set the same header key, the last header key will
        // override the first") means only this rule's
        // Content-Security-Policy value is sent for requests to
        // `/globe`, not both merged; verified against Next's own docs
        // before relying on it, given this project's history of
        // getting CSP assumptions wrong. What matters for CSP purposes
        // is the policy on the HTML *document* that loads the scripts
        // (this page), not the path the script/asset files themselves
        // are served from — so this one rule is sufficient; the
        // `/cesium/*` static assets don't need their own entry.
        //
        // **Real, deliberate security tradeoff, not a silent
        // workaround** — CesiumJS fundamentally requires `'unsafe-eval'`
        // to function at all: it performs genuine `eval()`/`new
        // Function()` calls internally (confirmed by matching this
        // app's exact browser console error — "Refused to evaluate a
        // string as JavaScript" — against other real users hitting the
        // identical, well-documented issue on Cesium's own community
        // forum) as well as WebAssembly compilation. The narrower
        // `'wasm-unsafe-eval'` CSP token (which permits only
        // WebAssembly, not textual eval) is NOT sufficient here, since
        // Cesium's eval usage is separate from its WebAssembly usage —
        // confirmed by this app's own console showing both a
        // WebAssembly `CompileError` and an independent `EvalError` for
        // evaluating a string as JavaScript. `'unsafe-eval'` is a real,
        // meaningful reduction in this route's XSS defense-in-depth: it
        // makes it easier for an attacker who has *already* achieved
        // some script-injection foothold to execute further arbitrary
        // code via `eval`. Scoped to `/globe` alone, not site-wide, to
        // contain that reduction to one purely-visual, opt-in page
        // rather than weakening the login form, workspace data-entry
        // pages, or anything else. If this tradeoff is ever considered
        // unacceptable, the honest alternatives are: drop the globe
        // feature, or replace CesiumJS with a different 3D/globe
        // library that doesn't require eval — not a lighter-touch CSP
        // fix, since this is CesiumJS's own core architecture, not a
        // misconfiguration on this app's part.
        source: "/globe",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "worker-src 'self' blob:",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data:",
              `connect-src 'self' https://${supabaseHost}`,
              "font-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "frame-ancestors 'none'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
  // Fixes a real production crash (BUILD_PLAN "STAGE — GLOBE VIEW
  // PRODUCTION FIX"): `@spz-loader/core`, a transitive dependency of
  // `@cesium/engine`'s glTF loader (`Source/Scene/GltfSpzLoader.js`,
  // for the Gaussian Splat / KHR_spz_gaussian_splats_compression glTF
  // extension — part of Cesium's core model-loading module graph,
  // pulled in unconditionally regardless of whether any actual splat
  // content is ever loaded), ships Emscripten-generated WASM-loader
  // glue code. Next.js's default minifier corrupts a legitimate escape
  // sequence in that generated code into an illegal octal escape
  // *specifically inside a template literal* — the JS spec disallows
  // octal escapes in template literals even where the identical
  // sequence is valid in an ordinary string literal — producing a
  // runtime `SyntaxError: Octal escape sequences are not allowed in
  // template strings` purely as a side effect of minification,
  // confirmed directly by inspecting the actual built chunk (`node
  // --check` against `.next/static/chunks/242f9422.*.js` reproduced
  // the exact error).
  //
  // `module.noParse` (Emscripten's own documented recommendation for
  // this category of bundler issue) was tried first and rejected: it
  // only skips webpack's dependency-graph parsing of the matched file,
  // it does not exempt the file's *content* from the separate
  // minifier pass over the final bundle — the corruption still
  // happened, and combining `noParse` with Next's built-in minifier
  // plugin produced a second, unrelated internal error
  // (`_webpack.WebpackError is not a constructor`) on top of it.
  //
  // The actual fix: this codebase never loads glTF/3D-model content at
  // all (only `Entity`/`PointGraphics`/`LabelGraphics` — see
  // `app/globe/globe-viewer.tsx`), so Gaussian Splat support is
  // genuinely, verifiably dead weight, not a feature being narrowly
  // avoided. Aliased to an empty stub so the problematic code is never
  // parsed, bundled, or minified at all — the cleanest resolution,
  // since it removes the buggy code from the build entirely rather
  // than working around how it gets processed. If this app ever needs
  // to load a glTF model using the SPZ extension in the future, this
  // alias is exactly what to remove first.
  webpack: (config) => {
    config.resolve.alias["@spz-loader/core"] = false;
    return config;
  },
};

export default nextConfig;
