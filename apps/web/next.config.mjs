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
  // Content-Security-Policy, interim version: `style-src` includes
  // 'unsafe-inline' because components use inline `style={{...}}`
  // throughout (see ui-components/README.md) — a nonce/hash-based
  // style-src would require threading a per-request nonce through every
  // inline style, which is real future work, not done here. What this
  // CSP *does* meaningfully add: `script-src 'self'` blocks arbitrary
  // injected <script> execution (the primary XSS payload vector), and
  // `object-src`/`base-uri`/`frame-ancestors` close off several other
  // classes of injection and clickjacking. This is a genuine, real
  // improvement over no CSP at all — not a token gesture — but it is
  // NOT the fully-hardened nonce-based policy the original Stage 7 note
  // deferred; that remains open work.
  //
  // connect-src/img-src allowlist reflects the actual external hosts
  // this app talks to as of this change: Supabase (auth + data),
  // NASA POWER (soil-moisture connector), OpenStreetMap tile server
  // (MapLibre base map). The Supabase project URL below is a
  // placeholder — replace `<SUPABASE_PROJECT_REF>` with the real
  // project ref (from NEXT_PUBLIC_SUPABASE_URL) before deploying, and
  // verify in a browser console against the deployed app for any CSP
  // violation reports before treating this as final — it was written
  // from static code inspection, not a live network trace.
  async headers() {
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
              "script-src 'self'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https://tile.openstreetmap.org",
              "connect-src 'self' https://power.larc.nasa.gov https://<SUPABASE_PROJECT_REF>.supabase.co",
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
