# WORLD VITALITY — BUILD PLAN

**Type:** Execution artifact, not a foundational document. This file is expected to change constantly — check items off, reorder, add tickets — without needing approval as if it were the Constitution, Engineering Blueprint, PRD, or Experience Blueprint.
**Purpose:** Translate the Engineering Blueprint's Section 18 roadmap into concrete, sequenced, checkable tickets, so execution work (in Claude Code or elsewhere) doesn't need to re-derive intent from the four foundational documents every session.
**Operating constraint:** No local terminal / command-line workflow, no VS Code. All code changes land via a GitHub-integrated tool; Vercel deploys automatically from GitHub on merge — never a manual build/deploy step.

---

## HOW TO USE THIS FILE

Each ticket below is scoped to be independently completable and reviewable. Work top to bottom — later tickets assume earlier ones are done. Check off `[ ]` → `[x]` as completed. If a ticket turns out to need splitting, split it here rather than starting a new planning document.

---

## STAGE 0 — REPOSITORY FOUNDATION

- [~] **0.1** Initialize the `world-vitality` GitHub repository (monorepo, per Engineering Blueprint Section 1). Scaffold built and committed locally (`git init` + initial commit); pushing to an actual GitHub org repo requires GitHub account access — see `docs/onboarding/repository-setup.md`.
- [x] **0.2** Create the top-level folder skeleton exactly as specified in Engineering Blueprint Section 2 (`apps/`, `services/`, `packages/`, `infra/`, `docs/`, `tools/`, `tests/`, `.github/`), with a placeholder `README.md` in each explaining its purpose (one paragraph, copied/adapted from the Blueprint's rationale).
- [x] **0.3** Move the four locked foundational documents into `docs/` (`docs/constitution/`, `docs/engineering-blueprint/`, plus `docs/prd/` and `docs/experience-blueprint/` for the other two locked docs) and this `BUILD_PLAN.md` into the repo root.
- [~] **0.4** Set up `.github/CODEOWNERS`, `PULL_REQUEST_TEMPLATE.md` (done), and branch protection on `main` (required review, required passing checks, no force-push) — per Engineering Blueprint Section 1.5 and 13. Branch protection is a GitHub repo setting and requires admin access to turn on — checklist in `docs/onboarding/repository-setup.md`.
- [ ] **0.5** Connect the repository to Vercel for automatic deploy-on-merge to a staging environment; confirm a trivial change (e.g., README edit) triggers a successful deploy end-to-end before writing any application code. Requires Vercel account access — checklist in `docs/onboarding/repository-setup.md`.
- [x] **0.6** Set up linting/formatting/TypeScript configuration presets in `packages/config/`, applied repo-wide.
- [x] **0.7** Write ADR-0001 (Monorepo decision) and ADR-0002 (Ingestion/Interpretation/Presentation separation) into `docs/adr/`, formalizing decisions already made in the Engineering Blueprint, per its ADR format (Section 5). ADR-0003 (Core Interfaces) also included, ahead of Stage 1, since it was already drafted.

## STAGE 1 — CORE ABSTRACTIONS (before any feature work)

- [x] **1.1** Define the internal data-ingestion interface (`services/data-ingestion/`) — the contract any provider connector must implement. No provider wired in yet.
- [x] **1.2** Define the internal AI/interpretation-provider interface (`services/interpretation-engine/`) — the contract any AI model adapter must implement.
- [x] **1.3** Define the shared data schema (`packages/data-schemas/`) that ingestion normalizes into and interpretation consumes from.
- [ ] **1.4** Write ADR-0003 documenting both interfaces and why they exist (protects provider-agnosticism per Constitution Section 4).

## STAGE 2 — FIRST DATA PROVIDER + DATA PROVENANCE

- [x] **2.1** Implement the first concrete ingestion connector (NASA) against the Stage 1 interface.
- [x] **2.2** Document data provenance and licensing for this source in `docs/data-provenance/` (Constitution Section 24 requirement — not optional).
- [ ] **2.3** Validate the ingestion → schema pipeline with real data end-to-end (no interpretation logic yet). **Partial:** the parsing/normalization pipeline is validated by an automated test against a realistic POWER API response fixture (see `services/data-ingestion/README.md`). Not yet exercised against the live `power.larc.nasa.gov` endpoint — the environment this was built in has no outbound access to that host. Needs a real run (e.g. via Claude Code) to fully close out.

## STAGE 3 — IDENTITY & ACCESS FOUNDATION

- [ ] **3.1** Implement authentication (magic link + optional SSO groundwork) via `services/identity-service/`.
- [ ] **3.2** Implement the core permission-role model shared across workspaces (Admin/Owner, Operational User, Scoped/Field User, Viewer/External — per PRD Section C.2).
- [ ] **3.3** Implement account settings basics: profile, data export, account deletion (Constitution Privacy Principles — must exist before any real user data accumulates).

## STAGE 4 — INTERPRETATION ENGINE v1 (NARROW SCOPE)

- [ ] **4.1** Build one deliberately narrow interpretive capability end-to-end (recommend: Agriculture soil-moisture status — plain-language insight + confidence level) using the Stage 1 AI interface.
- [ ] **4.2** Build the evaluation framework (`packages/ai-evaluation/`) and validate this first capability against ground truth before it's user-facing.
- [ ] **4.3** Build the shared "confidence/uncertainty" design-language component (per Experience Blueprint recommendation, Section 20 of the Experience Blueprint) in `packages/ui-components/` — used everywhere from day one, not retrofitted later.

## STAGE 5 — DESIGN SYSTEM FOUNDATION

- [ ] **5.1** Implement design tokens (`packages/design-tokens/`) — color, typography, spacing — per Experience Blueprint Section 13 principles (no hardcoded values in components).
- [ ] **5.2** Implement core shared components in `packages/ui-components/`: Button, Card, Input, Modal, Typography, Table, Empty/Loading/Error/Success states, Skeleton loader.
- [ ] **5.3** Implement dark mode / light mode support as first-class from the start.
- [ ] **5.4** Implement the app-shell layout components (Header, Sidebar, AI Panel dock) per the Experience Blueprint's wireframe (Section 4 app shell).

## STAGE 6 — FIRST APPLICATION SURFACE

- [ ] **6.1** Build `apps/web` skeleton: routing structure, app shell wired to design system, authentication flow wired to `identity-service`.
- [ ] **6.2** Build the Home Dashboard shell (cross-workspace landing view, per PRD Section B.3).
- [ ] **6.3** Build one full Workspace Home (recommend: Agriculture) using the dashboard widget grammar from Experience Blueprint Section 9 and its wireframe.
- [ ] **6.4** Build the Map view (base layers + one data overlay) per Experience Blueprint Section 11.
- [ ] **6.5** Wire the AI Panel to the Stage 4 interpretation capability, including confidence display.

## STAGE 7 — OBSERVABILITY, SECURITY, ACCESSIBILITY GATES

- [ ] **7.1** Implement logging/monitoring/alerting basics (Engineering Blueprint Section 12) alongside Stage 6 — not after.
- [ ] **7.2** Run a security review pass on the full pipeline built so far (Engineering Blueprint Section 14).
- [ ] **7.3** Run an accessibility pass against Stage 5/6 components (Experience Blueprint Section 15) before any public exposure.

## STAGE 8 — CONTROLLED RELEASE

- [ ] **8.1** Deploy to an internal release channel first (Engineering Blueprint Section 13 staged rollout).
- [ ] **8.2** Expand to limited beta once internal validation passes.
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

_(Add an entry each time this plan is meaningfully revised, so progress and re-scoping are traceable — this is the one piece of "process overhead" worth keeping even in execution mode.)_

- **v1** — Initial plan derived from Engineering Blueprint Section 18 and PRD Amendments 1–3.
- **v2** — Stage 0 executed: folder skeleton, folder READMEs, foundational docs + ADRs filed into `docs/`, CODEOWNERS, PR template, CI workflow, and `packages/config` lint/TypeScript presets all committed. 0.1, 0.4, 0.5 remain partially open pending GitHub/Vercel account-level actions documented in `docs/onboarding/repository-setup.md`.
- **v3** — Stage 1 executed: `packages/data-schemas` (shared normalized record + provenance + gap-reporting schema), `services/data-ingestion` (connector interface), and `services/interpretation-engine` (AI provider interface) all committed, per ADR-0003. Also fixed Stage 0's incomplete pnpm setup — added the missing `pnpm-workspace.yaml` (required for pnpm to resolve workspace packages; `package.json`'s `"workspaces"` field alone is npm/Yarn syntax and pnpm ignores it) and a real `pnpm-lock.yaml`, which is what was causing CI's `--frozen-lockfile` step to fail. No provider or model is implemented against the Stage 1 interfaces yet — that's Stage 2 and Stage 4.
- **v4** — Stage 2 executed: `NasaPowerConnector` (`services/data-ingestion/src/connectors/`) implemented against the Stage 1 ingestion interface, pulling daily point data from NASA's POWER API (Agroclimatology community, no API key required). Handles POWER's fill-value sentinel for missing data as an explicit `IngestionGap`, never a fabricated value. `docs/data-provenance/nasa-power.md` documents licensing (public domain) and known limitations (grid resolution, model- vs. sensor-derived) per Constitution Section 24. Added an automated test (`node --test`, wired into `pnpm run test` and CI) validating the parsing pipeline against a realistic response fixture — 2.3 (live end-to-end validation) is partial: not yet run against the real API from an environment with outbound network access.
