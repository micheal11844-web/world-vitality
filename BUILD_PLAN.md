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
  - **Follow-up gap, now closed:** `apps/web` had no Next.js-specific ESLint rules (image/font/script/head misuse, etc.) — the shared repo-wide config in `packages/config/eslint.config.js` only covered generic JS/TS/React-hooks/a11y rules, not anything Next-specific. Closed by adding `@next/eslint-plugin-next`'s native flat-config `core-web-vitals` rule set, scoped to `apps/web/**` in the root `eslint.config.js`. Deliberate substitution, flagged: did not use the `eslint-config-next` package itself, since as of Next 15.5 it still only ships legacy `.eslintrc`-format config and would need the `@eslint/eslintrc` `FlatCompat` shim as an extra dependency to bridge into this repo's flat-config setup — `@next/eslint-plugin-next`'s own flat export gives the identical rule set with one less moving part. Verified with a full repo-wide `eslint .` run (exit 0, no errors).

## STAGE 8 — CONTROLLED RELEASE

- [x] **8.1** Deploy to an internal release channel first (Engineering Blueprint Section 13 staged rollout).
  - **Note on actual approach taken:** rather than a dedicated internal-only channel (separate branch + password protection), this was satisfied by cutting a versioned release directly on `main` (package.json version bump, GitHub Actions rebuild, GitHub Release published) — reusing an existing release workflow already in use on another project. This deploys straight to the same production URL rather than a gated internal one. Flagged deliberately, not silently substituted: for a solo-owned project where the owner is currently the only user, this is a reasonable simplification of the letter of the ticket, not a shortcut around its intent (catching problems before wider exposure) — there was no wider exposure yet to guard against.
- [ ] **8.2** Expand to limited beta once internal validation passes.
  - **Status: rescoped by the owner.** No longer treated as a gate blocking further feature work. Owner (solo, project not yet shown to anyone) decided to keep building — Guide Character, then Weather & Climate — and will run the actual beta once the app feels complete, rather than pausing feature work to find testers now. 8.2 and 8.3 both wait until that point.
- [ ] **8.3** Retrospective: update this BUILD_PLAN with Stage 9+ tickets based on what was actually learned — do not pre-plan Stage 9 in detail until Stage 8 is real.
  - **Note:** Stages 9 and 10 below were started before this retrospective, at the owner's explicit direction — a deliberate deviation from this ticket's own sequencing rule, recorded rather than silently reordered. See v5/v6 changelog entries.

## STAGE 9 — GUIDE CHARACTER ✅ COMPLETE

Owner-initiated, out of the original roadmap sequence — un-defers PRD Amendment 3's "AI Workforce"/visible-persona item, which was deferred "pending evidence of need" that still doesn't formally exist. Owner's explicit, deliberate call as solo project owner; goal stated as wanting "a successful and remarkable app."

**Concept:** a friendly guide character, Earth's-globe-for-a-head (in the spirit of Telegram's duck), named **Orbi** (provisional — trivially renamed via one prop default). Gentle, calm motion (float + a one-shot wave), not bouncy — deliberately reconciled with `theme.css`'s existing "purposeful, calm motion only" principle rather than silently overriding it.

- [x] **9.1** Scoped and named the character — Orbi, globe-headed, SVG + CSS (no animation library dependency), reacts to real page state rather than generic idle-only animation.
- [x] **9.2** Technical approach decided: plain SVG + CSS keyframes (`wv-guide-float`, `wv-guide-wave` in `theme.css`), consistent with this codebase's existing no-Tailwind/inline-style/CSS-custom-property pattern. No new dependency added.
- [x] **9.3** Built `GuideCharacter` in `packages/ui-components`, first wired into the sign-in page — mood reacts to the real auth form state (idle/thinking/happy/concerned), not a separate fake state invented for the character.
- [x] **9.4** Built the first-use tutorial (`GuideTutorial` component, generic shell in `packages/ui-components`; actual 3-step copy lives in `apps/web`'s dashboard page, per the packages-vs-apps split). Triggers once via `localStorage`, real persistence, not a mock.
- [x] **9.5** Expanded to every page: added to `AppShell` itself (not per-page), so Orbi follows the user across the dashboard and every current/future workspace for free.

**Fully verified:** 80/80 tests passing at Stage 9 completion, clean lint, clean format, clean production `next build`.

## STAGE 10 — WEATHER & CLIMATE (second workspace) ✅ COMPLETE

Also owner-initiated ahead of the 8.3 retrospective. Un-defers "any additional workspace beyond Agriculture" from this file's own deferred list, at the owner's explicit direction. **Weather & Climate** chosen specifically over the other 10 PRD-defined workspaces (Construction, Insurance, Renewable Energy, Logistics & Shipping, Disaster Monitoring, Education, Research, Government & NGOs, Public Explorer) because the PRD's own Section A.7 marks Disaster Monitoring as carrying "the platform's highest ethical weight... zero tolerance" (life-safety alerts) — too high-stakes for a second workspace on a solo project — while Weather & Climate (Section A.6) is the PRD's lowest-stakes, most general-purpose workspace, and could reuse `NasaPowerConnector` completely unchanged (different `parameters` config only: `T2M` instead of `GWETROOT`).

- [x] **10.1** `WeatherStatusProvider` (`services/interpretation-engine`) — temperature-band classification, same threshold-based/non-ML/auditable pattern as `SoilMoistureStatusProvider`. Fully tested (8 new tests), same confidence-from-data-sufficiency logic.
- [x] **10.2** Real validation that `NasaPowerConnector` needed zero code changes for a second, different parameter — the concrete evidence (not just design intent) that ADR-0002/0003's ingestion/interpretation boundary actually holds. Documented in `docs/data-provenance/nasa-power.md`.
- [x] **10.3** `apps/web/app/workspaces/weather/` — `workspace-shell.tsx` and `page.tsx`, mirroring Agriculture's structure exactly (same widget-grid pattern, same AI-panel wiring).
- [x] **10.4** Weather & Climate card added to the Home Dashboard.
- [x] **10.5** Map view for Weather & Climate — `apps/web/app/workspaces/weather/map/`, mirroring Agriculture's map page/MapView structure exactly, temperature-colored marker instead of moisture-colored. Verified: builds correctly at the same ~315kB size as Agriculture's map (both load MapLibre), correctly isolated to just these two routes.
- [x] **10.6** Forecast / short-medium-long-range confidence gradient — **real**, via a genuinely new second data-provider connector, `OpenMeteoConnector` (`services/data-ingestion`), closing the deferred-list "second data-provider connector" item at the same time (unlike 10.2's same-provider-different-parameter validation, this is a structurally different provider — see `docs/data-provenance/open-meteo.md`). Required an additive, fully-backward-compatible schema change (`NormalizedDataRecord.recordType`/`forecastIssuedAt`) — no existing connector, provider, or test needed to change. New `WeatherForecastProvider` produces a real lead-time-based confidence gradient (confidence genuinely decreases with forecast distance — short-range ≤3 days = high, medium ≤7 days = moderate, long >7 days = low), not a stylistic one. Wired into the Weather workspace home page's Trend widget, replacing the honest empty state. **Real licensing caveat found and documented, not glossed over**: Open-Meteo's free tier is non-commercial-use only — fine for this pre-launch project, but flagged in three places (the connector's doc comment, every record's `provenance.knownLimitations`, and `docs/data-provenance/open-meteo.md`) as something to revisit before any commercial launch.

**Fully verified:** 114/114 tests passing, clean lint, clean format, clean production `next build` — all four new/changed routes (`/workspaces/weather`, `/workspaces/weather/map`) build correctly and stay properly isolated (no bundle leakage into unrelated routes, checked directly against the build output after the earlier Orbi-3D bundle-leak lesson).

## STAGE 11 — AUTH EXPANSION: PASSWORD, GOOGLE OAUTH, REMEMBER ME, PAGE REDESIGN

Owner-initiated, another deliberate deviation from the 8.3-first sequencing rule. Expands sign-in beyond magic-link-only — a real product/security decision, not a small UI addition, since this app was originally built passwordless on purpose (see `docs/security/auth-threat-model.md`, threats #6–#8 for the honest accounting of what this adds).

- [x] **11.1** Password auth (`AuthService.signUpWithPassword`/`signInWithPassword`) — fits the existing service-role-key architecture unchanged, same pattern as magic link. 8-character floor plus real, pattern-aware strength feedback (not naive complexity rules).
- [x] **11.2** `PasswordStrengthMeter` (`packages/ui-components`), built on `@zxcvbn-ts` (the actively-maintained fork; the original `zxcvbn` package is unmaintained) — researched against current NIST SP 800-63B guidance (length over composition rules) before building, not assumed. Real tests confirm it scores a long passphrase higher than a short "complex-looking" password, and penalizes reusing the user's own email.
- [x] **11.3** Google OAuth — required introducing `@supabase/ssr` (a real, deliberate architecture addition, confirmed with the owner first rather than rushed) because PKCE's `code_verifier` needs to persist across requests, which the existing stateless service-role client structurally cannot do — the exact failure class that already broke magic link once. Verified against real Next.js/Supabase docs before writing code, specifically to avoid a repeat of the CSP incident's "assumed, not verified" mistake.
- [x] **11.4** Real "Remember Me" — required adding actual refresh-token handling (`AuthService.refreshSession`, a new `REFRESH_COOKIE`), since this codebase had none before; a cookie with a long Max-Age and nothing to refresh with would have been cosmetic, not functional.
- [x] **11.5** Login page redesign — split-screen layout, `AuthIllustration` (original SVG art extending the existing globe/Orbi motif — deliberately not a sourced photo; copyright/licensing reasoning is in the component's own doc comment), tabs between magic-link and password sign-in, Google button, Remember Me checkbox.
- [x] **11.6** `docs/security/auth-threat-model.md` updated with three new threats (#6 password credential-stuffing/brute-force, #7 the new OAuth/PKCE flow and the new `SUPABASE_ANON_KEY` credential, #8 the new persistent-access window Remember Me creates) — the file's own earlier "SSO/OAuth doesn't exist yet" line was real, dated content, now corrected rather than left stale.

**Honestly NOT done / verified:**

- **No rate limiting or breached-password screening** on password sign-in beyond whatever Supabase's platform applies by default (not independently confirmed). OWASP's Authentication Cheat Sheet recommends checking new passwords against Have I Been Pwned's Pwned Passwords API — real, valuable, un-built follow-up.
- **OAuth has not been exercised against a live Google Cloud OAuth app or live Supabase project** — it's correct against documented Supabase/Next.js behavior and builds/typechecks cleanly, but that is a different claim from "works in a real browser." **Real manual setup is required before this can work at all**: a Google Cloud OAuth Client ID/Secret, added to Supabase Dashboard → Authentication → Providers → Google, with `SUPABASE_AUTH_REDIRECT_URL`'s exact value registered as an authorized redirect URI in Google Cloud Console, plus the new `SUPABASE_ANON_KEY` env var set in Vercel. None of this is something a code change can do.
- **Only Google is wired up**, though the OAuth code path is provider-agnostic enough that adding a second provider (e.g. GitHub) later is a small, contained change, not a rewrite.

**Verified for real:** 94/94 tests passing, clean lint, clean format, clean production `next build` with every new env var set.

## STAGE 12 — CONSTRUCTION (3RD WORKSPACE)

Owner-initiated, un-defers "any workspace beyond Agriculture and Weather & Climate" from this file's own deferred list, at the owner's explicit direction. **Construction** chosen next of the remaining 9 PRD-defined workspaces (per PRD Section A.2) — same reasoning as Stage 10's choice of Weather & Climate: not the highest-stakes option (Disaster Monitoring stays deferred, per its own "zero tolerance" life-safety framing), and it could reuse `NasaPowerConnector` completely unchanged (a second parameter, `WS2M`, alongside the already-used `T2M` — no data-ingestion changes needed, the same validation Stage 10.2 already ran).

- [x] **12.1** `ConstructionRiskStatusProvider` (`services/interpretation-engine`) — cross-references current temperature (`T2M`) and wind speed (`WS2M`) against fixed, per-activity thresholds (concrete pour, crane operation, roofing work) and produces a go/caution/no-go recommendation with reasoning per activity, per PRD Section A.2's "How AI enhances the experience." Same threshold-based/non-ML/auditable pattern as `SoilMoistureStatusProvider` and `WeatherStatusProvider`, extended from one metric to two. Fully tested (12 new tests): normal conditions, cold/hot pour thresholds, high/elevated wind for crane and roofing, missing-metric graceful degradation, insufficient-data (never fabricated), confidence scaling, and `evaluate()` ground-truth matching.
- [x] **12.2** `apps/web/app/workspaces/construction/` — `workspace-shell.tsx` and `page.tsx` ("Today's Activity Status"), mirroring Agriculture's and Weather & Climate's structure exactly.
- [x] **12.3** Construction card added to the Home Dashboard.
- [x] **12.4** Map view — `apps/web/app/workspaces/construction/map/`, mirroring the existing map page/MapView structure exactly; marker colored by worst-case activity status (go/caution/no-go) rather than a single metric band. Verified: builds correctly at the same ~315kB size as the other two map routes, correctly isolated to just this route.

**Honest scope, stated plainly (not glossed over):**

- **Today's status only — no Site Risk Timeline yet.** The PRD's first-run experience calls for "a forward-looking calendar of weather-sensitive risk windows." This provider only assesses _current_ conditions, same limitation `WeatherStatusProvider` had before its Stage 10.6 forecast work. Building the timeline needs forecast wind data — `OpenMeteoConnector` currently only fetches temperature (`temperature_2m_max`/`_min`), not wind — a real, scoped follow-up ticket, not built here to avoid rushing a connector change in under this ticket's scope.
- **No excavation/flash-flood activity, no lightning-proximity alert.** Both are named in the PRD. Excavation/flash-flood needs precipitation data (`PRECTOTCORR`) not currently ingested by any provider in this codebase. Lightning proximity needs a fundamentally different data source (strike detection) with no connector at all. Neither is faked under a name implying it works.
- **Thresholds are fixed defaults, not yet configurable per project/activity** — the PRD explicitly calls for "configurable per activity type" as the real target feature. The values used (5°C/32°C for pour, 8/13 m/s for crane, 8/12 m/s for roofing) are this implementation's own reasonable interpretation of commonly-cited general construction-safety guidance, not a transcription of any single binding standard, manufacturer load chart, or jurisdiction's code — stated in the provider's own doc comment, not presented as authoritative.
- **No terrain/flood-risk map overlay** — the PRD's map vision includes one; only the site-risk-status marker is built, same "base layers + one data overlay" narrow scope as the other two workspaces' maps.

**Not verified against the live NASA POWER API from this build environment** — same caveat as every other workspace's page: this sandbox cannot reach power.larc.nasa.gov, so this is written to handle both outcomes but hasn't been exercised against a real request yet.

**Fully verified:** 126/126 tests passing, clean lint, clean format, clean production `next build` — `/workspaces/construction` and `/workspaces/construction/map` both build correctly and stay properly isolated (checked directly against the build output).

---

## EXPLICITLY DEFERRED (do not start early)

- ~~Second **data-provider** connector (a genuinely different provider — not yet done; Stage 10 validated the ingestion/interpretation boundary with a second _parameter_ through the _same_ provider, which is real evidence but not the same test as a structurally different provider's data shape)~~ **Closed by Stage 10 ticket 10.6** — `OpenMeteoConnector`, a structurally different provider (different API shape, different domain, different license terms). See `docs/data-provenance/open-meteo.md`.
- Mobile app (`apps/mobile`)
- Admin console (`apps/admin`)
- Billing/subscriptions (`services/billing-service`)
- Any workspace beyond Agriculture, Weather & Climate, and Construction (8 of the PRD's 11 workspaces remain un-started; Disaster Monitoring in particular should not be started without deliberately revisiting its "zero tolerance" life-safety requirements first)
- Third-Party Workspace Marketplace (PRD Section C.2 — explicitly a post-Phase-1 capability)
- ~~Any "AI Workforce" / multiple visible AI personas (PRD Amendment 3 — deferred pending evidence of need)~~ **Un-deferred by explicit owner decision** — see STAGE 9 above. Not a silent reversal: recorded here so the reasoning (the original deferral was "pending evidence of need," and that evidence still doesn't exist — this was a deliberate bet, not a data-driven trigger) stays visible.

---

## CHANGE LOG

_(Add an entry each time this plan is meaningfully revised, so progress and re-scoping are traceable — this is the one piece of "process overhead" worth keeping even in execution mode.)_

- **v1** — Initial plan derived from Engineering Blueprint Section 18 and PRD Amendments 1–3.
- **v2** — Stage 8.1 marked complete via versioned GitHub Release on `main` (not a separate internal-only channel — see note above). Stage 8.2 marked in-progress, blocked on identifying beta testers.
- **v3** — Closed the flagged Stage 7 follow-up gap: added Next.js-specific ESLint rules (`core-web-vitals`) scoped to `apps/web`, via `@next/eslint-plugin-next`'s flat-config export rather than the legacy-format `eslint-config-next` package. See note under 7.3.
- **v4** — Worked through the remaining Stage 7 "not built, flagged honestly" list from `docs/reviews/stage-7-observability-security-accessibility.md`. Closed: a script-focused Content-Security-Policy (interim — `style-src` still permissive, see addendum), CI dependency-scanning (`pnpm audit`, informational for now pending an upstream Next.js patch — see `docs/security/known-vulnerabilities.md`), an incident-response runbook (`docs/runbooks/incident-response.md`), and a real threat model for the auth flow (`docs/security/auth-threat-model.md`). Investigated but deliberately left open: `scoped_field_user` resource-level scoping — no sub-workspace resource exists yet to scope against, so building scoping infrastructure now would be premature; revisit once a second workspace or per-resource data model exists. Full detail in the Stage 7 review's new "Post-Stage-7 Follow-Up" addendum.
- **v5** — Built the `scoped_field_user` resource-scoping _mechanism_ (not the product feature — see `roles.ts`'s updated doc comment): `can()` now takes an optional actor→action→resource scope, `WorkspaceMembership` gained `scopedResourceIds`, migration `0002_resource_scoped_membership.sql` adds the column. Fully tested, but inert until a real resource type exists. Owner rescoped Stage 8.2/8.3: no longer blocking further work. Owner also explicitly un-deferred PRD Amendment 3's "AI Workforce"/visible-persona item to build a Guide Character (Stage 9) — a deliberate, flagged deviation from the roadmap's own sequencing rules.
- **v6** — **Production incident and fix**: an earlier CSP (`script-src 'self'`, no `unsafe-inline`/nonce) blocked Next.js's own hydration scripts, causing a fully blank production page for every user. Root-caused against Next.js's official docs (also caught, before shipping a second time, that those docs describe Next 16's `proxy.ts` convention — this app is on Next 15.5.22, still `middleware.ts`). Fixed by reverting to the documented "Without Nonces" fallback (`script-src 'self' 'unsafe-inline'`); a full nonce-based CSP was deliberately not built mid-incident since it requires the entire app to give up static rendering — a real architectural tradeoff needing its own deliberate decision, not one made under outage pressure. Also derived the CSP's Supabase host from the real `SUPABASE_URL` env var instead of a manual placeholder, and fixed an unrelated bug found during the incident (`GuideCharacter.test.tsx` had landed in the wrong test folder, breaking every build) and a real pre-existing ESLint gap (`next.config.mjs` lacked Node globals, `process`/`URL` flagged as undefined — fixed via a new config-file override in `packages/config/eslint.config.js`).
- **v7** — Completed Stage 9 (Guide Character): first-use tutorial (`GuideTutorial`) and cross-page presence (Orbi added to `AppShell` itself, not per-page) — see Stage 9 above, now fully checked off. Started and substantially completed Stage 10 (Weather & Climate, second workspace) — `WeatherStatusProvider`, the `/workspaces/weather` route, and the dashboard card are done and verified (88/88 tests); the map view and forecast capability are honestly left open (10.5/10.6) rather than faked. See Stage 10 above for the full, real scope.
- **v8** — Stage 11: expanded sign-in beyond magic-link-only — password auth with a real, researched strength meter (`@zxcvbn-ts`), Google OAuth (required adding `@supabase/ssr`, a deliberate architecture decision confirmed with the owner first), a real Remember Me (required adding refresh-token handling that didn't exist before), and a full login-page redesign with an original SVG illustration. `docs/security/auth-threat-model.md` updated with the three genuinely new threats this adds, correcting an earlier line that had gone stale ("SSO/OAuth doesn't exist yet"). OAuth is code-complete and verified against real docs but not yet exercised against a live Google/Supabase setup — real manual console setup is still required before it can work at all. 94/94 tests passing.
- **v9** — Real production fixes found after v8 shipped: Google sign-in hung forever with `SUPABASE_ANON_KEY` unset (an uncaught error, not a handled one — fixed with proper try/catch placement, verified against Next.js's `redirect()`-inside-`try` gotcha); the login page allowed whole-page scroll; the tab-switcher between magic-link/password sign-in was a documented UX anti-pattern, replaced with a single primary flow. Also: the Agriculture map's tiles silently failed (a CSP `connect-src` gap — MapLibre fetches tiles via `fetch()`, not `<img>`, which only `img-src` covered).
- **v10** — Attempted a real 3D (WebGL) Orbi on the login page per owner request. Found and fixed two real bugs during verification (a bundle-isolation leak inflating every unrelated route by ~230kB; wrong React Three Fiber version would have shipped without checking React 18 compatibility first) — but a third, deeper bug (a documented class of React-instance-identity conflict between `react-reconciler` and pnpm's node_modules layout) caused a full production crash. Reverted to the working 2D Orbi rather than risk a fourth live fix without a real browser to test in, following this project's own incident-response principle (restore service first). `GuideCharacter3D` code kept in place with a clear status note for whenever this is revisited with real browser testing available.
- **v11** — Completed Stage 10 (10.5 map view, 10.6 real forecast) — see Stage 10 above, now fully checked off. The forecast closes the deferred-list "second data-provider connector" item too: `OpenMeteoConnector` is a structurally different provider from NASA POWER, not just a different parameter through the same one, validated via an additive, backward-compatible schema change (`recordType`/`forecastIssuedAt`) rather than a breaking one. Real licensing caveat found and documented: Open-Meteo's free tier is non-commercial-use only. 114/114 tests passing.
- **v12** — Stage 12: Construction, the third workspace. `ConstructionRiskStatusProvider` cross-references current temperature and wind speed against per-activity thresholds (concrete pour, crane operation, roofing work) for a go/caution/no-go recommendation, reusing `NasaPowerConnector` unchanged (a second parameter, `WS2M`, alongside `T2M`). Workspace route, dashboard card, and map view all mirror the existing two workspaces' structure. Honestly scoped: today's status only (no forecast-based Site Risk Timeline yet — needs wind data `OpenMeteoConnector` doesn't fetch), no excavation/flash-flood or lightning-proximity coverage (no precipitation or strike-detection data source exists), and fixed rather than project-configurable thresholds. 126/126 tests passing.
