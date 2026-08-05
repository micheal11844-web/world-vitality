## Summary

<!-- What does this PR do, and why? -->

## Which BUILD_PLAN.md ticket(s) does this address?

<!-- e.g. Stage 2 / 2.1 -->

## Checklist

- [ ] I have read the relevant section(s) of the Constitution / Engineering Blueprint / Experience Blueprint for this change.
- [ ] No service imports another service's internals directly (only via published API or public package interface — Engineering Blueprint Section 4.4).
- [ ] Ingestion / interpretation / presentation boundary respected — no provider-specific format leaks past `services/data-ingestion/`, no application calls a provider or ingestion connector directly (ADR-0002).
- [ ] Any new AI/interpretation output includes an explicit confidence signal and reports uncertainty rather than guessing (ADR-0003, Constitution Section 9).
- [ ] Any new shared code in `packages/` has a genuine second consumer — not speculative abstraction (Engineering Blueprint Section 4.5).
- [ ] Any new data provider has a corresponding entry in `docs/data-provenance/` (Constitution Section 24).
- [ ] Tests added/updated (unit/integration alongside the code; e2e in `tests/e2e/` only if cross-application).
- [ ] `BUILD_PLAN.md` checkbox(es) updated if this completes a ticket.
- [ ] No manual infrastructure changes made outside `infra/` — all infra changes are in this PR (Engineering Blueprint Section 2, 14).
