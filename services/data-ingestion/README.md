# services/data-ingestion

The data-ingestion interface (ADR-0003, BUILD_PLAN Stage 1 ticket 1.1) —
the contract any provider connector must implement — plus the first
concrete connector built against it (BUILD_PLAN Stage 2).

## What's here

- **`DataIngestionConnector.ts`** — the interface itself: `ingest()`
  (retrieve + normalize + report gaps) and `checkHealth()`.
- **`connectors/nasa-power-connector.ts`** — `NasaPowerConnector`, pulling
  daily point data from NASA's POWER API. See
  `docs/data-provenance/nasa-power.md` for licensing, attribution, and
  known limitations.
- **`connectors/__tests__/nasa-power-connector.test.ts`** — validates the
  parsing/normalization pipeline against a realistic captured POWER API
  response shape, including fill-value gap detection. Run via `pnpm run
test` from the repo root.

## Status

- **1.1** — interface: done.
- **2.1** — first connector (NASA POWER): implemented.
- **2.3** — end-to-end pipeline validation: the parsing/normalization
  logic is validated by the test above against a response fixture built
  from NASA's published API documentation. The connector has **not** been
  exercised against the live `power.larc.nasa.gov` endpoint from this
  environment — that host isn't reachable from the sandbox this was built
  in. Running `NasaPowerConnector.ingest()` for real (e.g. via Claude Code,
  or any environment with outbound network access) is the remaining step
  to fully close out 2.3.

No second, deliberately different connector has been built yet — per
ADR-0003's Standing Action Item, the interface should still be treated as
provisional until one is.
