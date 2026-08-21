# docs/

The source of truth for anything that must stay version-synchronized with code.

- `constitution/` — the World Vitality Constitution (locked, reference copy).
- `engineering-blueprint/` — the Engineering Blueprint (locked, reference copy) and this project's `BUILD_PLAN.md` execution checklist.
- `architecture/` — system and data-flow diagrams. Start with `architecture/system-overview.md` — current shape of the system in one page (workspaces, connectors, capabilities, auth, telemetry), cross-referencing everything below rather than duplicating it.
- `adr/` — Architectural Decision Records, for the platform's largest, hardest-to-reverse decisions. Numbered sequentially, never edited after acceptance — superseded by a new ADR instead (see ADR-0001 through 0004 for the founding decisions plus the Knowledge Graph's Phase 1/Phase 2 split).
- `Decision-Log.md` — smaller and medium decisions that don't warrant a full ADR, in the order they actually happened, cross-referencing the ADRs above rather than duplicating them.
- `Glossary.md` — terms as actually used in the codebase, checked against real type names rather than written from a generic template.
- `reviews/` — point-in-time audit records (what was checked, what was found, what was fixed) from specific BUILD_PLAN stages. Historical snapshots — not updated after the fact even if the reality they describe later changes.
- `runbooks/` — operational runbooks (incident response, deployment, on-call), started at Stage 7 of BUILD_PLAN.md.
- `security/` — the auth threat model (updated as new auth flows are added) and a tracked list of known, accepted dependency vulnerabilities.
- `data-provenance/` — documentation of every data source, its license, and its limitations. Required for every data provider before its connector goes live (Constitution, Section 24).
- `onboarding/` — new-engineer onboarding guides, including the manual (non-code) setup steps a fresh deployment needs.

If a wiki, slide deck, or chat message conflicts with what's in this folder, this folder wins by default — the conflict gets resolved by updating the docs, not by trusting the other source.
