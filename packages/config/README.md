# packages/config

Shared linting, formatting, and TypeScript configuration presets, applied repo-wide (BUILD_PLAN Stage 0, ticket 0.6).

Every app/service/package extends these instead of defining its own — keeps standards consistent without copy-pasted config drifting out of sync.

Package-manager and monorepo-tooling choice (pnpm workspaces) is an implementation detail per Engineering Blueprint's convention of leaving language/framework/transport choices to build time (see ADR-0003) — swap it out if the team prefers a different toolchain; nothing above this package depends on the specific choice.
