# ADR-0004: Knowledge Graph — Phase 1 (Metric → Capability → Workspace)

Status: Accepted
Date: 2026-08-20
Deciders: Owner + Claude (session), evaluating an external recommendation

## Context

An external review (an AI assistant asked to act as "Claude's CTO," working from a description of the project rather than the actual repository) recommended a "World Vitality Knowledge Graph": representing environmental factors as connected entities so the platform can reason across relationships instead of only answering isolated questions, with a worked example of a causal chain — rain → soil moisture → crop health → yield → insurance risk.

Evaluated on its own merits, independent of the review it arrived in: this is the most genuinely interesting idea in that review, and a real potential differentiator. But the worked example describes a **causal chain of interpretations feeding each other** — soil moisture derived from rain, crop health derived from soil moisture, and so on. That does not exist anywhere in this codebase. Every `InterpretationProvider` built so far (`SoilMoistureStatusProvider`, `WeatherStatusProvider`/`WeatherForecastProvider`, `ConstructionRiskStatusProvider`/`ConstructionSiteRiskTimelineProvider`, `WindGenerationStatusProvider`/`WindGenerationOutlookProvider`) consumes raw ingested records directly and independently — none consumes another provider's `InterpretationResult`. Building the full causal-chain vision in one step would mean designing that chaining architecture from scratch, sight-unseen, with no real provider relationships yet in evidence to design it around — exactly the kind of premature, evidence-free architecture ADR-0002's "Alternatives Considered" already warns against for a different layer of this system.

What genuinely already exists, and is real today: five workspaces, three raw metrics (`T2M`, `WS2M`, `GWETROOT`), and seven `InterpretationProvider` capabilities connecting them — a real, if modest, graph structure, already implicit in the code but nowhere made explicit or queryable. In particular, `WS2M` (wind speed) already feeds three completely different domain interpretations (Construction's crane/roofing risk, Renewable Energy's turbine generation bands, and Research's raw display) — the same underlying reading, three different meanings depending on context. That is a real, present-day instance of exactly the kind of relationship a knowledge graph exists to surface, without inventing anything speculative.

## Decision

Build the knowledge graph in two explicit phases, and only commit to Phase 1 now:

**Phase 1 (this ADR, built now):** `packages/knowledge-graph` — a small, hand-maintained, code-derived graph of `metric → capability → workspace` relationships. Every edge is checked directly against the real capability wiring in `services/interpretation-engine/src/providers/` at the time it's written (via `grep`, not recalled from memory or invented), not a model of relationships that don't exist in code. Exposed via simple query functions (`metricsFeedingWorkspace`, `workspacesUsingMetric`, `getRelated`) and a small "Data Relationships" panel in the Research workspace, since Research is already the workspace built around transparency and methodology.

**Phase 2 (explicitly deferred, not started):** genuine cross-domain causal reasoning — providers that consume other providers' `InterpretationResult`s, not just raw records, enabling the kind of chain the external review described. This needs its own real design work (how does a provider declare a dependency on another provider's output? how do confidence levels compose across a chain — does a "low confidence" input degrade everything downstream, and by how much? what happens when an upstream provider returns `insufficient-data`?) that shouldn't be improvised inside a Phase 1 ticket. Revisit only once Phase 1 has been live long enough to show where the real chaining opportunities are, rather than guessing at them now.

## Alternatives Considered

- **Build the full causal-chain vision now, in one step.** Rejected: no real inter-provider relationships exist yet to model, so this would mean inventing hypothetical chains not grounded in this platform's actual data or domain logic — the opposite of this project's own established discipline of building only what's verified and real.
- **A general-purpose graph database (Neo4j-style) or graph query language.** Rejected as over-engineering for the current scale: three metrics and seven capabilities is a graph small enough to hold as a plain in-memory data structure with no real performance or query-flexibility need that would justify a new infrastructure dependency and its operational cost.
- **Do nothing — the relationships are "in the code" already, that's enough.** Rejected: true, but not discoverable or queryable by anyone (including future-Claude) without re-reading every provider's source. Making it explicit and queryable is cheap, real, and immediately useful, independent of whether Phase 2 ever happens.

## Consequences

**Easier:**

- Answering "what does this metric actually feed?" or "what does this workspace actually depend on?" — a real query instead of re-deriving it by reading source files each time.
- Any future audit of the interpretation layer (e.g. checking data-provenance claims, or scoping a new workspace) has a starting map of what already exists.

**Harder / accepted tradeoffs:**

- **Hand-maintained, not generated.** `packages/knowledge-graph`'s data will drift from the real wiring as new providers/workspaces are added unless someone updates it alongside them — stated plainly in the package's own doc comment, not hidden. A build-time generator (deriving the graph from the actual provider source, e.g. via each provider's `supportedCapabilities` and metric filters) would close this gap for real but is its own real follow-up ticket, not built here.
- **No cross-domain causal reasoning yet.** This ADR explicitly does not build what the external review's worked example (rain → soil moisture → crop yield → insurance risk) described. Anyone reading only the headline "knowledge graph" without this ADR could reasonably expect more than what Phase 1 actually is — which is exactly why this document exists.
