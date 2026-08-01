# services/data-ingestion

The data-ingestion interface (ADR-0003, BUILD_PLAN Stage 1 ticket 1.1) — the
contract any provider connector must implement.

## What's here

- **`DataIngestionConnector.ts`** — the interface itself: `ingest()`
  (retrieve + normalize + report gaps) and `checkHealth()`.

## Status

Interface only — no provider is implemented against it yet. That's
BUILD_PLAN Stage 2, ticket 2.1 (first concrete connector: NASA).

## Why an interface before an implementation

Per ADR-0002, ingestion/interpretation/presentation are strictly separated.
Per ADR-0003, that separation is only meaningful if defined as an explicit
contract before any specific provider is wired in — otherwise the "contract"
ends up being whatever the first integration happened to need, which is
expensive to retrofit once a second, differently-shaped provider arrives.

Treat this interface as provisional until Stage 2 (first connector) and the
explicitly-deferred second connector have both validated it. If either
reveals the contract doesn't hold up, revise it via a new ADR that
supersedes ADR-0003 — don't quietly patch around a bad interface in
connector code.
