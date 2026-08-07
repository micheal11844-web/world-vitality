/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace packages ship pre-built dist/ output (see each package's
  // package.json) — `pnpm run build` at the repo root must run before
  // `next build`/`next dev` picks up any change to a workspace package.
  // This mirrors the ADR-0001 monorepo's existing tsc --build project-
  // reference graph rather than introducing a second, Next-specific
  // transpilation path for the same source.

  // Security headers (BUILD_PLAN ticket 7.2), applied to every route.
  // No Content-Security-Policy here yet, deliberately — components use
  // inline `style={{...}}` throughout (see ui-components/README.md), and
  // a CSP strict enough to matter would need `style-src 'unsafe-inline'`
  // at minimum, which weakens the header enough that it's better to get
  // right deliberately (nonce/hash-based) than add a token gesture now.
  // Flagged as real future work, not silently skipped.
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
        ],
      },
    ];
  },
};

export default nextConfig;
