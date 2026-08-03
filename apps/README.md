# apps/

Deployable, user-facing surfaces: `web`, `mobile`, `admin`.

Applications in this folder **consume** services and packages — they must never contain core business, data-ingestion, or interpretation logic directly. This keeps logic reusable and testable independent of any specific UI, and keeps the ingestion/interpretation/presentation boundary (see `docs/adr/0002-ingestion-interpretation-presentation-separation.md`) intact.

Per BUILD_PLAN.md, `apps/web` is the first application built (Stage 6). `apps/mobile` and `apps/admin` are explicitly deferred until `apps/web` and its underlying services are validated.
