# packages/

Shared code with no independent deployment lifecycle: `ui-components`, `design-tokens`, `data-schemas`, `validation`, `ai-evaluation`, `i18n`, `config`.

Kept granular rather than one giant "shared" package, so dependency graphs stay legible and teams don't end up depending on unrelated code just to get one utility. A piece of code is only promoted here once a genuine second consumer exists — no speculative, premature abstraction (Engineering Blueprint, Section 4.5).

`data-schemas` in particular is the contract between `services/data-ingestion` and `services/interpretation-engine` — see `docs/adr/0002` and `docs/adr/0003`.
