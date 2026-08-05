/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace packages ship pre-built dist/ output (see each package's
  // package.json) — `pnpm run build` at the repo root must run before
  // `next build`/`next dev` picks up any change to a workspace package.
  // This mirrors the ADR-0001 monorepo's existing tsc --build project-
  // reference graph rather than introducing a second, Next-specific
  // transpilation path for the same source.
};

export default nextConfig;
