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
    ];
  },
};

export default nextConfig;
