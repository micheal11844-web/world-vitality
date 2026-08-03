# ADR-0003: Core Interfaces — Data Ingestion and AI/Interpretation Providers

Status: Accepted
Date: 2026-07-31
Deciders: Founding team (per Engineering Blueprint, Section 4.3; BUILD_PLAN Stage 1)

## Context

ADR-0002 establishes that ingestion, interpretation, and presentation must be strictly separated. That separation is only meaningful if the boundaries between layers are defined as explicit, stable interfaces — built *before* any specific provider or model is wired in — rather than emerging implicitly from whatever the first integration happens to look like.

This ADR defines what those interfaces are responsible for, without specifying implementation (language, framework, or transport, which remain engineering decisions made at build time, not fixed here).

## Decision

Two core interfaces are defined and built first, before any concrete provider or model integration:

### 1. Data Ingestion Interface

Any data-provider connector must, at minimum:
- Retrieve data from its provider on a defined schedule or trigger.
- Normalize that data into the shared internal data schema (`packages/data-schemas/`), including required provenance metadata (source, license, retrieval time, known limitations — per Constitution Section 24).
- Report ingestion failures and data gaps explicitly to the schema (never silently omit or fabricate missing values) — per Constitution Section 9 and Engineering Blueprint Section 11 (API failures).
- Expose no provider-specific format, field naming, or quirk beyond this interface boundary.

### 2. AI/Interpretation Provider Interface

Any AI model or analytical adapter must, at minimum:
- Accept normalized schema data as input; never a provider-specific format.
- Return output that includes an explicit confidence signal and, where feasible, a traceable explanation of contributing factors — per Constitution Section 9 (AI Principles) and the Experience Blueprint's confidence-language system.
- Report its own uncertainty or inability to answer explicitly, rather than defaulting to a plausible-sounding guess.
- Be independently evaluable against ground truth via the shared evaluation framework (`packages/ai-evaluation/`), regardless of which underlying model implements it.

## Alternatives Considered

- **Define interfaces implicitly through the first integration (NASA connector, first interpretation model), formalizing them later.** Rejected: this is the more common but riskier path — by the time a second, differently-shaped provider or model arrives, the "interface" is really just whatever the first integration happened to need, and retrofitting genuine abstraction after the fact is materially more expensive than designing it first (this exact risk is why BUILD_PLAN Stage 1 precedes Stage 2).

## Consequences

**Easier:**
- The first concrete connector (NASA, BUILD_PLAN Stage 2) and the first concrete interpretation capability (BUILD_PLAN Stage 4) are built *against* a contract, which immediately surfaces whether the contract is well-designed, before a second provider or model exists to compare against.
- Future providers/models are evaluated for "does it fit the existing interface," a bounded and reviewable question, rather than "how do we integrate this entirely new shape of thing."

**Harder:**
- Designing an interface before a concrete implementation exists carries real risk of getting it wrong in ways only a second, genuinely different integration will reveal. This is accepted deliberately — see the Standing Action Item below.

## Standing Action Item

The first interface design should be treated as provisional until validated by: (a) the first real connector and interpretation capability (BUILD_PLAN Stages 2 and 4), and (b) a second, deliberately different data provider (BUILD_PLAN's explicitly deferred "second connector" ticket). If either reveals the interface doesn't hold up, revise it via a new ADR that supersedes this one — do not silently patch around a bad interface in application code.
