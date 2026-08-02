# docs/

The source of truth for anything that must stay version-synchronized with code.

- `constitution/` — the World Vitality Constitution (locked, reference copy).
- `engineering-blueprint/` — the Engineering Blueprint (locked, reference copy) and this project's `BUILD_PLAN.md` execution checklist.
- `architecture/` — system and data-flow diagrams (to be added as the system grows).
- `adr/` — Architectural Decision Records. Numbered sequentially, never edited after acceptance — superseded by a new ADR instead (see ADR-0001 through 0003 for the founding decisions).
- `runbooks/` — operational runbooks (incident response, deployment, on-call) — to be added starting Stage 7 of BUILD_PLAN.md.
- `data-provenance/` — documentation of every data source, its license, and its limitations. Required for every data provider before its connector goes live (Constitution, Section 24).
- `onboarding/` — new-engineer onboarding guides.

If a wiki, slide deck, or chat message conflicts with what's in this folder, this folder wins by default — the conflict gets resolved by updating the docs, not by trusting the other source.
