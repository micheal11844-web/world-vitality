# ADR-0001: Use a Monorepo for World Vitality

Status: Accepted
Date: 2026-07-31
Deciders: Founding team (per Engineering Blueprint, Section 1.1)

## Context

World Vitality consists of multiple applications (web, mobile, admin), multiple backend services (data ingestion, interpretation engine, identity, notifications, billing), and a set of shared libraries (UI components, design tokens, data schemas, AI evaluation tooling) that must stay consistent with each other. The company is early-stage, with a small team, but is architected to scale to millions of users and many industry Workspaces over several years.

The two realistic options were:
- **Polyrepo:** one repository per app/service/package, independently versioned and released.
- **Monorepo:** a single repository containing all first-party code, split internally by workspace/folder boundaries.

## Decision

World Vitality will use a single monorepo (`world-vitality`) for all first-party applications, services, shared packages, infrastructure-as-code, and documentation.

## Alternatives Considered

- **Polyrepo from day one.** Rejected for the current stage: it would require publishing and version-syncing internal packages (design tokens, data schemas, AI evaluation frameworks) across many repositories, adding coordination overhead disproportionate to a small team, and making cross-cutting changes (e.g., a schema update touching ingestion and interpretation simultaneously) require multiple coordinated PRs instead of one atomic change.
- **Hybrid (monorepo for backend, separate repo for mobile).** Rejected for now as premature — worth revisiting explicitly (see Consequences) once mobile development is a dedicated, largely-independent team.

## Consequences

**Easier:**
- Atomic, cross-cutting changes across ingestion, interpretation, and presentation layers.
- A single source of truth for shared UI components, design tokens, and data schemas — no risk of silent drift between repos.
- Lower coordination overhead for a small, growing team.

**Harder:**
- Build and CI performance will require active investment (selective build/test tooling) as the codebase grows — accepted as a deliberate, budgeted cost, not a surprise.
- Code ownership boundaries must be enforced through convention and `CODEOWNERS`, since a monorepo does not enforce them structurally the way separate repositories would.

**Risks accepted:**
- Monorepo tooling scaling pain is a named risk in the Engineering Blueprint (Section 19, Risk #8). This decision is explicitly revisited at defined triggers (team size, build time thresholds) rather than left to be noticed only once it becomes painful — see the standing action item below.

## Standing Action Item

Revisit this ADR (via a new ADR that supersedes it, if warranted) at the 2–3 year mark, or sooner if CI build times or team size cross a threshold that makes coordination overhead in a monorepo exceed its benefits.
