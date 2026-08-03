# services/

Backend services, each independently deployable, each with a single clear responsibility: `api-gateway`, `data-ingestion`, `interpretation-engine`, `notification-service`, `identity-service`, `billing-service`.

`data-ingestion` and `interpretation-engine` are kept strictly separate (see `docs/adr/0002-ingestion-interpretation-presentation-separation.md`) specifically to protect the platform's provider-agnosticism principle (Constitution, Section 4): a new data provider should only ever require a new ingestion connector, never a change to interpretation logic.

No service may import directly from another service's internal folders — only through its published API or public package interface (Engineering Blueprint, Section 4.4).
