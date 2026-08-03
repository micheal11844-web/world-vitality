# infra/

Infrastructure as code: `terraform`, `cloudflare`, `firebase`, `ci-cd`, `environments`.

Kept in-repo so infrastructure changes go through the same PR review and audit trail as application code — no manual, undocumented console changes to production infrastructure (Engineering Blueprint, Section 2 and Section 14).

Per this project's operating constraint, deployment is GitHub → Vercel on merge; Cloudflare and Firebase configuration here should be treated as replaceable implementation details behind internal abstractions wherever feasible (Experience/Engineering Blueprint recommendation), not permanent architectural dependencies.
