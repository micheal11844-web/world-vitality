# ADR-0002: Strict Separation of Data Ingestion, Interpretation, and Presentation

Status: Accepted
Date: 2026-07-31
Deciders: Founding team (per Engineering Blueprint, Sections 2 and 4.3; Constitution, Sections 4 and 24)

## Context

World Vitality's Constitution states that the company must never become dependent on a single data provider, and that its value lies in *interpretation*, not raw data access. NASA is the first data source the platform will integrate, but the architecture must treat it as one of many current and future providers (ESA, NOAA, USGS, Copernicus, and others not yet identified), without requiring a rewrite of application or AI logic when new providers are added.

Without an enforced boundary, it is easy for provider-specific data formats, quirks, and assumptions to leak into interpretation logic and even into application code — creating exactly the single-provider lock-in the Constitution prohibits (identified as Risk #2, "Critical," in the Engineering Blueprint's risk ranking).

## Decision

The platform is structured as three strictly separated layers, each only accessible to the next through a well-defined internal interface:

1. **Ingestion** (`services/data-ingestion/`) — one connector per data provider, each responsible only for retrieving that provider's data and normalizing it into the shared internal data schema (`packages/data-schemas/`). Ingestion knows about provider-specific formats; nothing downstream does.
2. **Interpretation** (`services/interpretation-engine/`) — consumes only the normalized internal schema, never a provider-specific format. This is where AI/analytical logic transforms normalized data into insight, confidence-scored and explainable per the Constitution's AI Principles.
3. **Presentation** (`apps/*`) — consumes only interpretation-engine output (and directly-queried normalized data where raw access is appropriate, e.g., the Research workspace). Applications never call a data provider directly.

No service or application may bypass this chain — e.g., an application must never call a data-ingestion connector directly, and interpretation must never special-case a specific provider's format.

## Alternatives Considered

- **Direct provider integration per application/feature** (each feature calls whichever provider API it needs). Rejected: this is the fastest short-term path but is precisely the pattern that creates single-provider lock-in and makes onboarding a second provider require touching every feature that used the first one.
- **A single "data layer" that mixes ingestion and interpretation.** Rejected: conflating normalization with interpretation makes it impossible to evaluate or swap AI models independently of data sourcing, and vice versa — the two have very different rates of change and different evaluation needs.

## Consequences

**Easier:**
- Adding a new data provider is a new ingestion connector only — no changes required to interpretation or applications (validated deliberately via a second, structurally different provider early in the roadmap — see BUILD_PLAN Stage 2 and the deferred "second connector" ticket).
- Interpretation logic and its evaluation framework can be developed and tested against the stable internal schema, independent of any single provider's release cycles or format changes.

**Harder:**
- Every new data domain requires schema design work up front in `packages/data-schemas/` before ingestion or interpretation can proceed — this is accepted as a deliberate, front-loaded cost.
- Enforcing the boundary requires discipline in code review (see the Engineering Blueprint's code review checklist, Section 9) since nothing prevents an engineer from taking a shortcut except review diligence and CI checks on cross-folder imports.

**Risks accepted:**
- If this boundary is not enforced rigorously in review, the entire rationale for the decision quietly erodes. This is flagged explicitly as the primary mitigation for Engineering Blueprint Risk #2.
