# WORLD VITALITY — BUILD PLAN

**Type:** Execution artifact, not a foundational document. This file is expected to change constantly — check items off, reorder, add tickets — without needing approval as if it were the Constitution, Engineering Blueprint, PRD, or Experience Blueprint.
**Purpose:** Translate the Engineering Blueprint's Section 18 roadmap into concrete, sequenced, checkable tickets, so execution work (in Claude Code or elsewhere) doesn't need to re-derive intent from the four foundational documents every session.
**Operating constraint:** No local terminal / command-line workflow, no VS Code. All code changes land via a GitHub-integrated tool; Vercel deploys automatically from GitHub on merge — never a manual build/deploy step.

---

## HOW TO USE THIS FILE

Each ticket below is scoped to be independently completable and reviewable. Work top to bottom — later tickets assume earlier ones are done. Check off `[ ]` → `[x]` as completed. If a ticket turns out to need splitting, split it here rather than starting a new planning document.

---

## STAGE 0 — REPOSITORY FOUNDATION

- [x] **0.1** Initialize the `world-vitality` GitHub repository (monorepo, per Engineering Blueprint Section 1).
- [x] **0.2** Create the top-level folder skeleton exactly as specified in Engineering Blueprint Section 2 (`apps/`, `services/`, `packages/`, `infra/`, `docs/`, `tools/`, `tests/`, `.github/`), with a placeholder `README.md` in each explaining its purpose (one paragraph, copied/adapted from the Blueprint's rationale).
- [x] **0.3** Move the four locked foundational documents into `docs/` (`docs/constitution/`, `docs/engineering-blueprint/`) and this `BUILD_PLAN.md` into the repo root.
- [x] **0.4** Set up `.github/CODEOWNERS`, `PULL_REQUEST_TEMPLATE.md`, and branch protection on `main` (required review, required passing checks, no force-push) — per Engineering Blueprint Section 1.5 and 13.
- [x] **0.5** Connect the repository to Vercel for automatic deploy-on-merge to a staging environment; confirm a trivial change (e.g., README edit) triggers a successful deploy end-to-end before writing any application code.
- [x] **0.6** Set up linting/formatting/TypeScript configuration presets in `packages/config/`, applied repo-wide.
- [x] **0.7** Write ADR-0001 (Monorepo decision) and ADR-0002 (Ingestion/Interpretation/Presentation separation) into `docs/adr/`, formalizing decisions already made in the Engineering Blueprint, per its ADR format (Section 5).

## STAGE 1 — CORE ABSTRACTIONS (before any feature work)

- [x] **1.1** Define the internal data-ingestion interface (`services/data-ingestion/`) — the contract any provider connector must implement. No provider wired in yet.
- [x] **1.2** Define the internal AI/interpretation-provider interface (`services/interpretation-engine/`) — the contract any AI model adapter must implement.
- [x] **1.3** Define the shared data schema (`packages/data-schemas/`) that ingestion normalizes into and interpretation consumes from.
- [x] **1.4** Write ADR-0003 documenting both interfaces and why they exist (protects provider-agnosticism per Constitution Section 4).

## STAGE 2 — FIRST DATA PROVIDER + DATA PROVENANCE

- [x] **2.1** Implement the first concrete ingestion connector (NASA) against the Stage 1 interface.
- [x] **2.2** Document data provenance and licensing for this source in `docs/data-provenance/` (Constitution Section 24 requirement — not optional).
- [x] **2.3** Validate the ingestion → schema pipeline with real data end-to-end (no interpretation logic yet).

## STAGE 3 — IDENTITY & ACCESS FOUNDATION

- [x] **3.1** Implement authentication (magic link + optional SSO groundwork) via `services/identity-service/`.
- [x] **3.2** Implement the core permission-role model shared across workspaces (Admin/Owner, Operational User, Scoped/Field User, Viewer/External — per PRD Section C.2).
- [x] **3.3** Implement account settings basics: profile, data export, account deletion (Constitution Privacy Principles — must exist before any real user data accumulates).

## STAGE 4 — INTERPRETATION ENGINE v1 (NARROW SCOPE)

- [x] **4.1** Build one deliberately narrow interpretive capability end-to-end (recommend: Agriculture soil-moisture status — plain-language insight + confidence level) using the Stage 1 AI interface.
- [x] **4.2** Build the evaluation framework (`packages/ai-evaluation/`) and validate this first capability against ground truth before it's user-facing.
- [x] **4.3** Build the shared "confidence/uncertainty" design-language component (per Experience Blueprint recommendation, Section 20 of the Experience Blueprint) in `packages/ui-components/` — used everywhere from day one, not retrofitted later.

## STAGE 5 — DESIGN SYSTEM FOUNDATION

- [x] **5.1** Implement design tokens (`packages/design-tokens/`) — color, typography, spacing — per Experience Blueprint Section 13 principles (no hardcoded values in components).
- [x] **5.2** Implement core shared components in `packages/ui-components/`: Button, Card, Input, Modal, Typography, Table, Empty/Loading/Error/Success states, Skeleton loader.
- [x] **5.3** Implement dark mode / light mode support as first-class from the start.
- [x] **5.4** Implement the app-shell layout components (Header, Sidebar, AI Panel dock) per the Experience Blueprint's wireframe (Section 4 app shell).

## STAGE 6 — FIRST APPLICATION SURFACE

- [x] **6.1** Build `apps/web` skeleton: routing structure, app shell wired to design system, authentication flow wired to `identity-service`.
- [x] **6.2** Build the Home Dashboard shell (cross-workspace landing view, per PRD Section B.3).
- [x] **6.3** Build one full Workspace Home (recommend: Agriculture) using the dashboard widget grammar from Experience Blueprint Section 9 and its wireframe.
- [x] **6.4** Build the Map view (base layers + one data overlay) per Experience Blueprint Section 11.
- [x] **6.5** Wire the AI Panel to the Stage 4 interpretation capability, including confidence display.

## STAGE 7 — OBSERVABILITY, SECURITY, ACCESSIBILITY GATES

- [x] **7.1** Implement logging/monitoring/alerting basics (Engineering Blueprint Section 12) alongside Stage 6 — not after.
- [x] **7.2** Run a security review pass on the full pipeline built so far (Engineering Blueprint Section 14).
- [x] **7.3** Run an accessibility pass against Stage 5/6 components (Experience Blueprint Section 15) before any public exposure.

## STAGE 8 — CONTROLLED RELEASE

- [x] **8.1** Deploy to an internal release channel first (Engineering Blueprint Section 13 staged rollout).
  - **Note on actual approach taken:** rather than a dedicated internal-only channel (separate branch + password protection), this was satisfied by cutting a versioned release directly on `main` (package.json version bump, GitHub Actions rebuild, GitHub Release published) — reusing an existing release workflow already in use on another project. This deploys straight to the same production URL rather than a gated internal one. Flagged deliberately, not silently substituted: for a solo-owned project where the owner is currently the only user, this is a reasonable simplification of the letter of the ticket, not a shortcut around its intent (catching problems before wider exposure) — there was no wider exposure yet to guard against.
- [ ] **8.2** Expand to limited beta once internal validation passes.
  - **Status: in progress, blocked on finding testers.** No beta testers identified yet. Owner plans to identify a small number of people who'd genuinely use an agriculture soil-moisture tool (not just any available contact) and will revisit this ticket once candidates exist. Not treated as done or skipped — intentionally left open.
- [ ] **8.3** Retrospective: update this BUILD_PLAN with Stage 9+ tickets based on what was actually learned — do not pre-plan Stage 9 in detail until Stage 8 is real.

---

## EXPLICITLY DEFERRED (do not start early)

- Second data-provider connector (validates abstraction — deliberately after Stage 8, per Engineering Blueprint roadmap ordering)
- Mobile app (`apps/mobile`)
- Admin console (`apps/admin`)
- Billing/subscriptions (`services/billing-service`)
- Any additional workspace beyond Agriculture
- Third-Party Workspace Marketplace (PRD Section C.2 — explicitly a post-Phase-1 capability)
- Any "AI Workforce" / multiple visible AI personas (PRD Amendment 3 — deferred pending evidence of need)

---

## CHANGE LOG

*(Add an entry each time this plan is meaningfully revised, so progress and re-scoping are traceable — this is the one piece of "process overhead" worth keeping even in execution mode.)*

- **v1** — Initial plan derived from Engineering Blueprint Section 18 and PRD Amendments 1–3.
- **v2** — Stage 8.1 marked complete via versioned GitHub Release on `main` (not a separate internal-only channel — see note above). Stage 8.2 marked in-progress, blocked on identifying beta testers.
