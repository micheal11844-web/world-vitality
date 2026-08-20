# World Vitality Glossary

Terms as actually used in this codebase — matched against real type names
and doc comments, not aspirational definitions. If a term below doesn't
match how it's actually used somewhere in the code, the code wins; file
a correction.

---

**Workspace**

A focused environment for one domain (Agriculture, Weather & Climate,
Construction, Renewable Energy, Research), each with its own home page,
map, and AI panel, sharing one common shell (`AppShell`) and one common
cross-workspace switcher.

NOT _module_ — a module is a code-organization unit; a workspace is a
user-facing product surface, and its code happens to live under
`apps/web/app/workspaces/<name>/`.

NOT _application_ — there is one application (`apps/web`); workspaces
are routes/experiences within it, not separate deployed apps.

NOT _dashboard_ — "Dashboard" is specifically the Home Dashboard
(`/dashboard`), the cross-workspace landing page. A workspace's own home
page is never called its "dashboard" in this codebase.

---

**Connector**

A class implementing `DataIngestionConnector` (`services/data-ingestion/`)
— one per external data provider (`NasaPowerConnector`,
`OpenMeteoConnector`). Retrieves that provider's data and normalizes it
into `NormalizedDataRecord`. Connectors know about provider-specific
formats; nothing downstream does (Decision #002).

---

**Interpretation Provider**

A class implementing `InterpretationProvider`
(`services/interpretation-engine/`) — consumes only normalized records,
never a provider-specific format, and turns them into an
`InterpretationResult` (a summary, a confidence level, an explanation,
contributing factors). One provider per **Capability**. Research is the
one workspace with none in front of its data — see Decision #013.

---

**Capability**

A string ID (e.g. `"construction.site-risk-status"`) identifying one
specific thing an `InterpretationProvider` can answer. A single workspace
can be powered by more than one capability (Construction has both
`construction.site-risk-status`, current conditions, and
`construction.site-risk-timeline`, forecast-based).

---

**Provenance**

The `Provenance` object attached to every `NormalizedDataRecord` —
source, source name, license, retrieval time, and `knownLimitations`.
Carried through ingestion and interpretation untouched, and the whole
reason the Research workspace's Dataset Explorer can show it inline
rather than asking anyone to trust a number with no origin attached.

---

**Ingestion Gap**

An `IngestionGap` — a structured, honest record of _missing_ data
(a day with no reading, a field absent at the source), returned
alongside whatever records a connector _did_ get. The alternative
(silently omitting missing days) would make gaps invisible instead of
stated.

---

**Confidence Level**

One of `"high" | "moderate" | "low" | "insufficient-data"`
(`ConfidenceLevel`), attached to every `InterpretationResult`. Genuinely
derived from real signal — reading count, forecast lead time — never a
fixed or decorative value. `insufficient-data` is a real, distinct state
from `low`: it means the provider couldn't answer at all, not that it
answered with low confidence.

---

**Guide Character ("Orbi")**

The docked mascot (`GuideCharacter`) shown in the bottom-right corner of
every page using `AppShell`, reacting to page state (idle/thinking/
happy/concerned). "Orbi" is a provisional name, not yet confirmed with
the project owner — see the component's own doc comment. A real 3D
version was attempted, crashed in production, and was reverted — see
Decision #007.

---

**Knowledge Graph**

`packages/knowledge-graph` — a small, hand-maintained, code-derived graph
of which raw metrics feed which capabilities feed which workspaces.
Currently **Phase 1 only** (see Decision #014 and
`docs/adr/0004-knowledge-graph-phase-1.md`): metric → capability →
workspace structure, checked against real provider wiring. NOT yet
cross-domain causal reasoning (rain → soil moisture → crop yield, etc.)
— that's explicitly deferred **Phase 2**, not built.

---

**Recovery Session**

The short-lived, non-persistent session created when a password-reset
link is verified (`/auth/callback?type=recovery`). Real and
authenticated (Supabase's own designed behavior — clicking the link does
sign the user in, specifically so they can set a new password), but
deliberately never eligible for Remember Me and deliberately ended
immediately after the password is changed — see Decision #011.

---

**Remember Me**

A persistent, long-lived session (a real refresh-token cookie, not just a
longer-lived access token) set only when the user explicitly opts in at
sign-in. Never set for a Recovery Session, regardless of any query
parameter — see Decision #011.

---

**ADR (Architecture Decision Record)**

A full write-up (`docs/adr/000N-*.md`) for the platform's largest,
hardest-to-reverse decisions — currently four: the monorepo, the
ingestion/interpretation/presentation boundary, the core interfaces, and
the Knowledge Graph's Phase 1/Phase 2 split. Smaller and medium decisions
that don't warrant a full ADR go in `docs/Decision-Log.md` instead, which
cross-references the ADRs rather than duplicating them.
