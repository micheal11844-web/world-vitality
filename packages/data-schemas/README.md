# packages/data-schemas

The shared contract between the data-ingestion layer and the interpretation
layer (ADR-0002, ADR-0003 — BUILD_PLAN Stage 1, ticket 1.3).

Every ingestion connector (`services/data-ingestion/`) normalizes provider
data into `NormalizedDataRecordSchema`. Every interpretation provider
(`services/interpretation-engine/`) accepts that same shape as input. Neither
side should ever need to know the other's implementation details — only this
schema.

## What's here

- **`provenance.ts`** — required source/license/attribution/limitations
  metadata on every record (Constitution Section 24: Data Ethics).
- **`ingestion-gap.ts`** — explicit representation of a missing or failed
  data point. ADR-0003 requires gaps to be reported, never silently omitted
  or fabricated.
- **`record.ts`** — `NormalizedDataRecordSchema`, the core shared record
  type, plus `GeoLocationSchema` for spatial data.

## Status

Deliberately generic — no provider is wired in yet (that's Stage 2). Per
ADR-0003's Standing Action Item, treat this schema as provisional until the
first real connector and a second, deliberately different connector have
both been built against it. If either reveals gaps, revise via a new ADR
rather than quietly patching around it in application code.

Built with [Zod](https://zod.dev) for runtime validation plus inferred
TypeScript types — not specified in the source docs, easy to swap if the
team prefers a different validation library.
