# World Vitality Decision Log

Every entry below is a real decision actually made during this project's
build, in the order it happened, not a hypothetical or illustrative
example. The four largest, most structural decisions have their own full
ADRs in `docs/adr/` (linked from their entries below) — this log covers
those plus the smaller and medium decisions that don't warrant a full ADR
on their own but are exactly the kind of thing a team forgets the reason
for a few months later.

New entries get appended at the bottom as real decisions get made — this
file is not meant to be reorganized or renumbered retroactively.

---

## Decision #001 — Monorepo

**Reason:** one codebase for ingestion, interpretation, and every
application surface, so a change to a shared interface can be verified
against every consumer in a single commit.

**Alternatives considered:** separate repos per service (rejected —
would make the ingestion/interpretation/presentation boundary, the
platform's core architectural promise, dramatically harder to enforce
across repo boundaries).

**Status:** Accepted. Full reasoning: `docs/adr/0001-use-monorepo.md`.

---

## Decision #002 — Strict separation of ingestion, interpretation, and presentation

**Reason:** the Constitution requires the platform never depend on a
single data provider, and that its value lie in interpretation, not raw
data access. Without an enforced boundary, provider-specific quirks leak
into interpretation and application logic, recreating the lock-in this
is meant to prevent.

**Alternatives considered:** direct provider integration per feature
(rejected — fastest short-term, but exactly the pattern that creates
lock-in); a combined data layer mixing ingestion and interpretation
(rejected — conflates two concerns with very different rates of change).

**Status:** Accepted. Full reasoning:
`docs/adr/0002-ingestion-interpretation-presentation-separation.md`.

---

## Decision #003 — Core interfaces defined before any feature work

**Reason:** every connector implements one `DataIngestionConnector`
interface, every AI capability implements one `InterpretationProvider`
interface — decided once, up front, rather than each new provider or
capability inventing its own shape.

**Status:** Accepted. Full reasoning: `docs/adr/0003-core-interfaces.md`.

---

## Decision #004 — Open-Meteo, not a second NASA endpoint, as the second data provider

**Reason:** the ingestion/interpretation boundary (Decision #002) needed
to be proven against a _structurally different_ provider — different API
shape, different domain, different license terms — not just a second
parameter through the same connector, which is real evidence but a
weaker test.

**Alternatives considered:** a second NASA POWER parameter only
(rejected as insufficient evidence for the boundary); NOAA or another
government provider (not rejected outright, just not chosen — Open-Meteo
was free, keyless, and had a genuinely different response shape,
making it a faster real test of the same question).

**Consequence surfaced by this decision, not anticipated going in:**
Open-Meteo's free tier turned out to be non-commercial-use only —
documented in `docs/data-provenance/open-meteo.md`, revisit before any
commercial launch.

**Status:** Accepted.

---

## Decision #005 — Google OAuth requires `@supabase/ssr`, not the existing stateless service-role client

**Reason:** PKCE's `code_verifier` must be persisted between the OAuth
redirect and the callback. The existing magic-link auth flow uses a
stateless service-role client specifically so a Server Action doesn't
need session state — but that same statelessness structurally cannot
complete a PKCE exchange, since there's nowhere to persist the verifier.

**Alternatives considered:** forcing OAuth through the same stateless
`token_hash` pattern as magic link (rejected — not how Google's OAuth
flow works; the code exchange step requires the verifier).

**Status:** Accepted — a new dependency, added deliberately after
confirming it was structurally necessary, not reached for by default.

---

## Decision #006 — Single primary sign-in flow, not a magic-link/password tab switcher

**Reason:** a `role="tablist"` UI switching between magic-link and
password sign-in is a documented UX anti-pattern (real research, not
just an aesthetic preference) — it forces a choice before the user has
context to make it well.

**Chosen:** magic link as the default, single flow; password sign-in
reachable via a plain secondary link, not a tab.

**Status:** Accepted.

---

## Decision #007 — Revert 3D Orbi to 2D after a production crash, rather than attempt a fourth live fix

**Reason:** a real WebGL 3D version of the Guide Character reached
production with a full app crash
(`Cannot read properties of undefined (reading 'ReactCurrentBatchConfig')`)
— a `react-reconciler`/pnpm module-duplication class of bug not
root-caused with real confidence in an environment with no real browser
available to test a fix.

**Chosen:** restore the known-good 2D `GuideCharacter` immediately,
following this project's own incident-response principle (restore
service first; investigate the deeper fix separately, not under outage
pressure). `GuideCharacter3D.tsx` stays in the repo with a clear status
note but is not used anywhere live.

**Status:** Accepted. Revisit only with real browser testing available.

---

## Decision #008 — Construction's per-activity thresholds are fixed defaults, not yet project-configurable

**Reason:** the PRD calls for per-project-configurable thresholds as the
real target feature, but no per-project configuration data model exists
anywhere in this codebase yet. Building fixed, clearly-labeled defaults
now (concrete pour, crane, roofing) delivers a real, honestly-scoped
capability today rather than blocking on a configuration system that's
real, separate, future work.

**Status:** Accepted — scope boundary, not a gap silently left unnoted.

---

## Decision #009 — Renewable Energy chosen over Insurance as the fourth workspace

**Reason:** Insurance's own PRD section demands "near-audit-grade rigor"
for parametric triggers, plus genuinely larger scope (multi-hazard
synthesis, portfolio upload, audit-logged collaboration) — not a fit for
a single ticket. Renewable Energy (wind) reused both already-validated
wind data pipelines (current + forecast) completely unchanged.

**Status:** Accepted. Insurance not abandoned — explicitly recorded as
deferred pending a dedicated ticket that actually budgets for that rigor.

---

## Decision #010 — Firebase request clarified and redirected to the existing Supabase identity system

**Reason:** asked to make sign-up "store in Firebase." This app's
identity system has been Supabase since Decision #003's era (Stage 3).
Introducing Firebase alongside it would mean two separate, unsynchronized
user databases — a real architectural problem, not a small addition.

**Alternatives considered:** build the requested Forgot Password flow on
a new Firebase backend as asked literally (rejected — would fragment
identity across two systems for no real benefit, since Supabase already
supports everything the actual request needed).

**Chosen:** built Forgot Password on Supabase; flagged the Firebase
question back to the owner rather than silently building either
interpretation.

**Status:** Accepted, on the owner's explicit confirmation.

---

## Decision #011 — Password-reset sessions sign the user out immediately after a successful change

**Reason:** a recovery link, once clicked, genuinely authenticates the
user (by Supabase's own design) — necessary so the reset action can
identify _whose_ password to change without trusting a client-submitted
ID. But a reset flow only proves control of an inbox, not necessarily
physical control of the device the link was opened on.

**Chosen:** after a successful password update, sign the user out of
that recovery-derived session and require a fresh sign-in with the new
password, rather than leaving them logged in.

**Alternatives considered:** leave the user signed in after reset, same
as many apps do (rejected as the less conservative option for a flow
whose whole premise is "something about this account's access needs
resetting").

**Status:** Accepted. Full reasoning: `docs/security/auth-threat-model.md`, threat #9.

---

## Decision #012 — Sidebar navigation split into two sections, not one flat list

**Reason:** reported as the sidebar "colliding with itself" once a
workspace was open — the cross-workspace switcher and the current
workspace's own pages were interleaved in one list with no visual
separation, reading as the same kind of thing when they weren't.

**Chosen:** two labeled sections, "Workspaces" and "This Workspace,"
rendered by the shared `Sidebar` component everywhere.

**Status:** Accepted.

---

## Decision #013 — Research is the one workspace with no AI interpretation panel

**Reason:** the PRD's own design for Research is "minimally interpreted,
maximally transparent" — raw data with full provenance, not an
AI-summarized layer standing in front of it. Building an interpretation
provider here purely for visual consistency with the other four
workspaces would work directly against the one design principle this
workspace exists to embody.

**Alternatives considered:** a thin "metadata summary" provider just to
give the AI panel something to show (rejected — would be interpretation
dressed up as transparency, exactly what this workspace is supposed to
avoid).

**Status:** Accepted — a deliberate exception to an otherwise-consistent
pattern, not an oversight.

---

## Decision #014 — Knowledge Graph built as an explicit two-phase plan; only Phase 1 committed to now

**Reason:** an external review's worked example (rain → soil moisture →
crop yield → insurance risk) describes providers consuming _each other's_
interpretations — an architecture that doesn't exist anywhere in this
codebase yet, since every `InterpretationProvider` built so far consumes
raw records independently. Designing that chaining architecture
sight-unseen, with no real inter-provider relationships yet in evidence,
would be exactly the kind of premature, evidence-free architecture
Decision #002's alternatives already warned against.

**Chosen:** Phase 1 — a small, real, code-derived graph of
`metric → capability → workspace`, checked directly against the actual
provider wiring, not invented. Phase 2 (real cross-domain causal
chaining) explicitly deferred pending real evidence of where the
chaining opportunities actually are.

**Status:** Accepted. Full reasoning: `docs/adr/0004-knowledge-graph-phase-1.md`.

---

## Decision #015 — Telemetry built on the existing structured-logging pipeline, no new vendor

**Reason:** flagged as a real, correct gap by the same external review —
nothing tracked any user action anywhere in this codebase before this.
Adding a third-party analytics vendor is a real decision requiring cost
and consent/privacy-notice work that hadn't happened, so it wasn't made
implicitly by picking a vendor and wiring it in.

**Chosen:** a `logTelemetry` category on the same `write()` pipeline
`logApplication`/`logSecurity` already use — real structured events
(page views, dataset fetches, the auth funnel), visible in Vercel's
existing runtime logs, with no aggregation/dashboard/consent decision
implicitly made by building it this way.

**Status:** Accepted. Aggregation/dashboarding/vendor selection remains
open, explicitly deferred, not silently implied by this decision.

## Decision #016 — Password sign-in made the default; magic link removed from the login page

**Reason:** explicit owner request. The login page's original design
(documented in its own code comments, matching BUILD_PLAN Stage 3's
"magic link + optional SSO" phrasing) made magic link the default,
primary sign-in path, with password as a secondary option one click
away — a deliberate choice at the time, not an oversight, but one the
owner has now decided to reverse for this product.

**Chosen:** password sign-in is now the only sign-in method on
`/login` — the magic-link form, its "sent" confirmation state, and the
link/password mode toggle were all removed from that page. Email links
remain in the product for the genuinely different job of resetting a
forgotten password (`/forgot-password`, unaffected by this change) —
this decision does not remove email-based auth from the app entirely,
only as an alternate sign-in method.

**What was NOT deleted:** `requestMagicLinkAction` (the Server Action),
the underlying `AuthService.requestMagicLink` call, and `/auth/callback`'s
magic-link token verification all remain in the codebase, unreachable
from any UI now but real, working, independently-useful auth
infrastructure — left in place as a real candidate for a future
magic-link re-entry point rather than deleted outright. See that
function's own doc comment in `apps/web/lib/actions.ts`.

**Trade-off, stated honestly:** the removed UI's own code comment cited
real login-page UX research favoring exactly one prominent primary flow
(not a tab strip) — that principle is preserved (password sign-in is
now that one flow), but the specific choice of _which_ method is
primary reverses a documented earlier decision. `docs/security/auth-threat-model.md`
was updated with a scope note pointing to this entry, rather than left
silently describing a flow that's no longer the front door.

**Status:** Accepted.

## Decision #017 — The admin console is a staff-only section of the web app, not a separate app

**Context:** The PRD and Engineering Blueprint call for an internal admin
console. The repository layout reserved a possible `apps/admin`. The first
version needs only four read-mostly screens (overview, one-user lookup,
data-source health and licensing, the staff audit log) for a team of one,
and has to share the app's sign-in, database access, design system and
deployment.

**Chosen:** Build it inside `apps/web` under `/admin`. Access is a
`platform_staff` allow-list (three roles: support, operations, platform
admin), checked twice — once in the `/admin` layout (any active staff),
once in every page and every Server Action (the specific permission). A
visitor who is not allowed gets the ordinary "not found" page, and the
page title is withheld from them so even that does not mention the
console. Staff are granted only by SQL (`docs/runbooks/admin-console.md`);
no screen creates staff. Every action that touches a person's data or
calls out to a provider is written to an append-only `staff_audit_log`
**before** it happens, and fails closed if it cannot be written. Searches
are exact-match only, are posted rather than put in the URL, and the log
records the account found, never what was typed.

**Alternatives considered:**

- _A separate `apps/admin` deployment._ Cleaner blast radius and its own
  domain/IP rules, but a second deployment, a second sign-in surface and a
  second copy of the identity plumbing to keep in step — cost with no
  benefit for a team of one.
- _A hosted admin tool (a database GUI or low-code admin panel)._ Fast, but
  it would sit on the service-role key with no per-role limits and no
  audit trail of its own, which is the opposite of what this console is for.
- _The Supabase dashboard alone._ Remains the break-glass tool (and is how
  staff are granted), but gives support no minimised view and records
  nothing about who looked at whom.

**Trade-offs, stated honestly:** the console shares a deployment, a
service-role key and a process with the customer app, so a bug in the
customer app is closer to staff screens than it would be across a deploy
boundary. The mitigations are the gates above and the fact that the
console has no write action on customer data. There is no second factor
for staff yet (listed in the runbook as the first thing to add). **Extraction
path:** every staff screen reads through `SupabaseStaffService` and the
`lib/staff.ts` gate, and its pages sit under one route segment, so moving
it into `apps/admin` later is a lift of that segment plus its gate, not a
rewrite.

**Status:** Accepted.

---

## Decision #018 — Four plan tiers on Paystack, built switched off; limits wait for customer-owned workspaces

**Context:** The owner chose Paystack as the payment provider and asked what
each plan should limit. Billing had to be built without changing anything
anyone can do today, before prices are known (they depend on the cost of a
commercial weather-data licence), and while the data model has no customer
to attach a limit to: every workspace is one shared copy, keyed by its name
(`agriculture`, `insurance`, …), so fields, properties, locations and field
comments are visible to every signed-in user.

**Chosen:**

- **Tiers:** Basic (free), Standard, Premium (both self-serve through
  Paystack) and Enterprise (contact us, invoiced outside Paystack, set by
  hand). Limits are workspaces / seats / saved items, plus on-or-off
  features. The catalogue is one file, `services/billing-service/src/plans.ts`;
  the table is in `docs/runbooks/billing.md`.
- **Rules on every plan, which no tier can switch off:** official
  life-safety alerts are never paywalled; the Public Explorer is always
  free; people can always export and delete their data; cancelling is one
  click. A downgrade past a limit makes the extra items read-only and never
  deletes them.
- **Switched off by default.** `BILLING_ENABLED` must be exactly `true`.
  Until then the webhook route answers 404, nothing reads the billing
  tables, and everyone gets unlimited entitlements.
- **Fail open.** If a subscription cannot be read, the person is treated as
  unlimited and the error is logged: a payment-system fault must never lock
  someone out of their own data. Failing open can briefly give a feature
  away; failing closed can take someone's work away.
- **Webhooks:** signature checked on the raw body (HMAC-SHA512, constant
  time) before anything is read; applied idempotently, then recorded; a
  storage failure returns 500 so Paystack retries, anything merely
  unrecognised returns 200. Only identifiers and outcomes are stored — never
  the payload, card or bank details.
- **Limits are not wired into the write paths yet.** Counting seats or saved
  items against a shared workspace would count everyone's together. They
  wait for an organisation (account-owned workspace) layer, which is also a
  privacy fix in its own right.

**Alternatives considered:**

- _Wire limits now, counting per creator._ Would work for saved items but
  not seats or workspaces, would need rewriting when organisations arrive,
  and would suggest the tenancy gap is closed when it is not.
- _Price per workspace instead of per tier._ Matches the PRD's per-workspace
  "future premium features", but makes the multi-workspace users (the
  Unified Billing requirement in PRD B.8) pay several bills; tiers keep one.
- _A tier between Standard and Enterprise for civic bodies._ The PRD
  suggests one; Standard roughly covers it for now.
- _Usage-based pricing._ Postponed: nothing metered exists yet (bulk export
  and API access are not built).

**Trade-offs, stated honestly:** the plan system exists but cannot limit
anything yet. Several things a plan lists are not built (email and SMS
alerts, bulk export, API access, integrations, SSO) and are marked so the
pricing page never offers them. No Paystack call has been made from this
build environment — the first test-mode payment is the real check
(`docs/runbooks/billing.md`, "First test payment"). Paystack's plans fix the
currency, so Nigerian customers pay in NGN and enterprise customers in USD
only if a USD settlement account exists.

**Status:** Accepted; enforcement pending the organisation layer.
