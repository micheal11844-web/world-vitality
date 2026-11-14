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

**Status:** Accepted. Enforcement of seats and saved items followed the
organisation layer (Decision #019).

---

## Decision #019 — Saved items and roles belong to an organisation; every read fails closed

**Context:** Every workspace was one shared copy keyed by its name, and every
signed-in person defaulted to `viewer_external`, which may view data — so any
account could read every other customer's saved fields, insured properties,
monitored locations and comments (found while building billing, Decision
#018). Nobody had been exposed (one account in the project), but it had to be
closed before a second customer signed up, and plan limits had nothing to
count against.

**Chosen:**

- **An organisation per customer** (migration 0018): `organizations` and
  `organization_members`. A person belongs to exactly one, has one owner per
  organisation, and owns at most one. Everyone gets a personal organisation
  the first time they need one, so nothing has to be "set up".
- **The owner is `admin_owner` in every workspace of their organisation**
  without a role row; members need an explicit role row for each workspace
  they were invited to (a composite foreign key keeps a role from existing
  for someone outside the organisation) and see nothing in workspaces they
  were not invited to.
- **Every saved item carries `organization_id`**; comments inherit it from
  their field. The permissive "any signed-in user may read fields" database
  policy is dropped. **Every access in the app goes through
  `AccountService.forOrganization(orgId)`**, and every write carries the
  organisation on the write itself (`… where id = ? and organization_id = ?`),
  so a forged id from another organisation matches nothing. The old
  unscoped list/create/update/delete methods no longer exist.
- **Fail closed.** No session, no organisation, no role, or any lookup error
  gives `viewer_external` with no organisation: reads are empty and writes
  are refused. This is the opposite of billing's fail-open (#018) on purpose —
  the cost of failing open for billing is a feature given away, for
  organisations it is one customer seeing another's data.
- **The organisation's plan is its owner's plan.** Seats and saved items are
  now enforced when something is _added_ (saved item, invitation; the last
  seat is claimed in one atomic statement). Nothing is hidden, locked or
  deleted over a limit. The `workspaces` limit is not enforced (only three
  workspaces hold saved items).
- **Invitations carry the inviter's organisation**, set from the inviter's
  session and never from a form field; accepting joins it (with the seat cap)
  and then creates the role. A person already in another organisation with
  members or saved items is refused.
- **An owner cannot delete their account while others remain** in the
  organisation; they are told to remove them first.
- **Safe to apply before the code ships:** additive, `organization_id`
  nullable, triggers fill it for rows the old code writes, and the backfill
  is idempotent (a personal organisation per account; items by creator;
  creator-less demo rows to the earliest account's organisation).

**Alternatives considered:**

- _Row-level security with the user's own token._ Would put the guarantee in
  the database, but the app reads everything with a service-role client by
  design (Decision #017's console, the webhook, notifications), so the
  guarantee is made in one place instead: `forOrganization`, tested to put the
  organisation in every query.
- _Many organisations per person, with a switcher._ The right end state for
  consultants and advisers; not needed yet, and the single unique constraint
  that forbids it is the one thing to drop if it is built.
- _Keep workspace-keyed data and add a "private" flag._ Leaves the default
  wrong: a forgotten flag would again share someone's data.
- _A separate migration to make `organization_id` `NOT NULL` now._ Postponed
  until the new code has run for a while; a row with no organisation is
  invisible to the new code, never visible to the wrong organisation.

**Trade-offs, stated honestly:** items are shared by everyone in an
organisation who has a role in that workspace (a colleague's field is visible
to you); there is no per-item privacy inside an organisation. Because the
database can no longer be read through the browser's own token, a future
feature that wants client-side reads would need its own policies. The
organisation screens (rename, ownership transfer, members overview) are not
built; rename is one line of SQL (`docs/runbooks/organisations.md`).

**Status:** Accepted. Migration 0018 must be applied (`docs/runbooks/apply-migrations.md`)
before the code that uses it is deployed.

---

## Decision #020 — Prices, and how the weather-data licence is handled

**Context:** The owner asked what would be convenient for buyers, and what
to do about Open-Meteo's free tier being non-commercial, and delegated the
choice ("I trust your judgment").

**Chosen:**

- **Prices** (tax-inclusive; `services/billing-service/src/prices.ts`):
  Standard ₦7,500/month or ₦75,000/year; Premium ₦25,000/month or
  ₦250,000/year; USD $9/$90 and $29/$290 only once USD is enabled on the
  Paystack account and USD plan codes are configured; Enterprise by contact,
  invoiced outside Paystack. A year costs ten months — the only discount.
  **Launch with the four NGN plans.**
- **Why:** local prices are set for local purchasing power rather than
  converted from USD; Paystack takes the amount from the plan, so each price
  is one Paystack plan; four numbers keep the pricing page simple. Paystack's
  local fee (1.5% + ₦100) leaves about ₦7,290 and ₦24,525 per month; with
  roughly $74/month of paid services (Open-Meteo Standard $29, Vercel Pro
  $20, Supabase Pro $25) at an assumed ~₦1,550/$, that is covered by about 16
  Standard or 5 Premium customers.
- **Licence:** subscribe to Open-Meteo **Standard** ($29/month, 1M calls; the
  app only calls the forecast and geocoding APIs, which it includes) and set
  `OPEN_METEO_API_KEY`. With the key the app uses Open-Meteo's `customer-`
  hosts; without it, nothing changes. Replacing the source was the
  alternative (below).

**Alternatives considered:**

- _Replace Open-Meteo with a source that permits commercial use._ NASA POWER
  already does but gives observations, not forecasts, so the forecast
  workspaces (Weather, Construction, Logistics, Renewable Energy) would lose
  their main feature. A paid plan is $29/month.
- _Charge in USD only._ Simplest to price, but a poor fit for Nigerian
  customers paying by local card or bank transfer, and it needs a USD
  settlement account first.
- _More tiers, or per-seat pricing._ Premature before there is any usage data;
  the limits in `plans.ts` can be tuned without touching prices.
- _A free trial._ Not decided; Paystack plans support it, but it is a pricing
  question to settle with real usage in view.

**Trade-offs, stated honestly:** the exchange-rate and cost figures are
assumptions to check at launch, not quotes; VAT and income tax are not
handled (an accountant's question); the paid Open-Meteo hosts were
implemented from its published documentation and **have not been run with a
real key**; and no customer can buy yet — there is no pricing page or upgrade
button (`docs/runbooks/billing.md`, "Not built yet").

**Status:** Accepted. Prices and launch plan to be revisited after the first
paying customers.

## Decision #021 — The plan screen: owner-only, no mid-subscription plan switch, and deletion cancels the subscription first

**Context:** With prices decided (#020) and the organisation model in place
(#019), customers needed a way to buy, update their card and cancel — and an
account holder who deletes their account must not keep being charged.

**Chosen:**

- **Everything goes through Paystack's own pages.** Subscribe sends the
  person to Paystack's hosted checkout; "Update card" opens Paystack's hosted
  page; the app never sees card details. Payment methods (cards, and Google
  Pay if it is switched on in the dashboard) are Paystack's, because the
  checkout request does not restrict channels — so Google Pay needed no code.
- **Only the organisation's owner can buy, update or cancel.** The plan is the
  owner's, so a member sees it read-only. Each action acts on the signed-in
  person's own id; nothing from the browser names a subscription.
- **The page never says "paid" before the webhook does.** Returning from
  Paystack shows "confirming" and re-checks briefly; the stored subscription,
  written only by the signed webhook, is the one source of truth.
- **No plan switch while subscribed.** Paystack has no "change plan" on a
  running subscription, so the screen says: cancel, then subscribe to the
  other plan once it ends. Cancelling keeps the plan until the paid term
  ends.
- **Deleting an account cancels its Paystack subscription first, and if that
  cannot be confirmed the account is not deleted.** The owner-with-members
  check runs before the cancel, so a refused deletion cancels nothing.
- `/billing` is a 404 and Settings shows no billing card while
  `BILLING_ENABLED` is off.

**Alternatives considered:**

- _Delete the account anyway and tell the person to cancel in Paystack._
  Simpler and never blocks deletion, but a customer could keep being charged
  for something they can no longer reach or cancel — worse than being asked to
  try again. Deletion stays "as easy as sign-up" in the normal case; it only
  waits on Paystack when there is a live subscription.
- _Offer plan switching by cancelling and re-subscribing automatically._
  Needs two steps that can half-fail around a payment; left out until
  Paystack's behaviour is seen in test mode.
- _A custom card form or an on-site Google Pay button._ More to build and to
  secure; Paystack's hosted checkout already offers both card and Google Pay,
  and its standalone Google Pay button is not supported yet.

**Trade-offs, stated honestly:** the Paystack calls (fetch subscription, card
link, disable) were written from Paystack's documentation and tested only
against a stand-in; the first real test payment is where they are checked.
A Paystack outage can briefly stop a paying customer deleting their account.
The new screen text is machine-drafted and unreviewed in four languages.

**Status:** Accepted.

## Decision #022 — Plan feature switches decide what a screen offers, not who may see data

**Context:** The plan catalogue (#018) lists on/off features (forecast
outlooks, CSV export, print/PDF, auditable report, team tools, audit log, …)
but nothing asked for them, so every plan behaved like Enterprise once billing
was on. Before wiring them, "what does a locked feature look like?" needed an
answer that fits the rules already fixed for every plan: official life-safety
alerts and the Public Explorer are never paywalled, saved data is never
hidden or deleted over a plan, and people can always export and delete their
own account data.

**Chosen:**

- **A locked feature is replaced by one plain sentence and a "See plans"
  link**, in the place where it would have been: "Forecast outlooks are
  included in the Standard plan and above. Your plan is Basic." The rest of
  the page is untouched; nothing is hidden, greyed out or nagged about.
- **Wired where a real screen exists:** the 7-day forecast cards (Weather &
  Climate, Construction, Logistics, Renewable Energy's wind and solar) —
  which are not even requested from the weather provider when locked — and
  the Download CSV and Print buttons on the three reports (Agriculture,
  Insurance, Government & NGOs). The plan is the organisation's (its owner's),
  so a member sees what the organisation has.
- **It is a convenience switch, not access control.** The data on screen is
  data the person can already read; the switch decides what the screen
  offers. Printing from the browser's own menu still works; that is not
  something a web page can or should prevent.
- **Same rules as the limits:** billing off ⇒ nothing is locked and the plan
  is not looked up; if the plan cannot be read, nothing is locked and the
  error is logged.

**Not wired, deliberately:** _team tools_ (Basic's single seat already stops
invitations with a clearer message), _audit log_ (no customer-facing screen
exists), _auditable report_ (the Insurance report is one page with no separate
"auditable" version to lock), and the unbuilt features (alerts, bulk export,
API, integrations, SSO — never offered). The Research dataset explorer's
CSV and forecast are left open: it is a raw-data tool by design. The
`workspaces` limit is still not enforced.

**Alternatives considered:**

- _Hide the locked cards and buttons._ Cleaner pages, but a customer cannot
  learn what a paid plan adds, and a missing button looks like a bug.
- _Show them greyed out with an upgrade modal._ Closer to a dark pattern
  (Constitution §7); a sentence and a link says the same thing.
- _Lock the whole Insurance report behind the auditable-report switch._
  Would remove the page's main purpose from Standard customers for a feature
  that has no separate version to sell.

**Trade-offs, stated honestly:** when billing is switched on, everyone who has
not subscribed (including the owner's own account) loses the forecast cards
and the report downloads until they do, so existing customers should be put on
a plan first if that is not wanted (`billing.md`, "Putting a customer on
Enterprise (invoiced, by hand)", with `'standard'` in place of `'enterprise'`). The note was English only, like the other workspace-page limit
text (translated since v104).

**Status:** Accepted.

## Decision #023 — Desktop and phone apps are thin windows around the live site

**Context:** The owner asked for real downloadable installers for the desktop
and the phone, not only the installable web app of v86, so customers can
"download World Vitality" like any other app. The website already does all the
work (sign-in, data, plans, language), is deployed continuously, and is the one
thing kept correct and secure.

**Chosen:**

- **Each app is a locked-down window that opens the live site**: Electron for
  Windows, Mac and Linux (`native/desktop`), Capacitor for Android
  (`native/mobile`). The site is not copied into the apps, so a site change
  reaches every installed app immediately, and there is one product to keep
  correct, not three.
- **Only the site is trusted.** Other addresses open in the person's browser;
  the desktop window has no Node access (context isolation, sandbox, web
  security on) and refuses camera, microphone and location; the phone app asks
  Android for the internet only, with no backups, no plain `http`, no web
  debugging.
- **Outside the pnpm workspace**, in `native/`, with their own npm lock files:
  the website's install, build and Vercel deploy are unaffected. The installers
  are built only on GitHub's machines (`.github/workflows/native-apps.yml`) and
  published as a GitHub Release when a `native-v*` tag is pushed or the
  workflow is run by hand with "Publish" ticked.
- **Sign in with email and password only.** Google refuses sign-in from app
  windows, and the code-exchange cookie the site sets cannot follow a browser
  hand-off. The site recognises the apps by one word each adds to the user
  agent (`WorldVitalityDesktop/`, `WorldVitalityApp/`) and hides "Continue with
  Google" there. The word is cosmetic only and unlocks nothing.
- **Unsigned for now.** Installers carry the operating systems' "unknown
  publisher" warnings until signing certificates exist; the runbook says what
  each costs and what to add. Android builds sign with a throwaway key until a
  permanent one is supplied as GitHub secrets.
- **Not built:** an iPhone app, automatic updates, push notifications on the
  phone, Google sign-in inside the apps, store listings.

**Alternatives considered:**

- _Tauri (Rust) for desktop._ Smaller downloads, but a second toolchain and
  less mature web-view differences between systems; Electron's one bundled
  Chromium behaves the same everywhere, which matters for a site that must
  look identical.
- _React Native or Flutter for the phone._ A second codebase for every screen
  the site already has, to re-implement plan limits, languages and roles.
  Rejected while the website is the product.
- _Bundle the site inside the apps._ Works offline, but every site fix would
  need a new download, and the apps would drift from the site.
- _Browser hand-off for Google sign-in._ Needs a short-lived one-time code
  exchanged between browser and app: a database table, expiry and replay
  rules, and a security review. Proposed for later, not needed to ship.
- _Wait for certificates before releasing._ Delays everything on accounts
  and fees; unsigned installers with clear instructions let people use the
  apps now.

**Trade-offs, stated honestly:** the Windows and Mac installers show warnings
that some people will not click through; the Android file installs from
outside the Play store; the phone app cannot show push notifications; people
who signed up with Google need to set a password once. The Windows, Mac and
Android builds were built on GitHub but never started on a real machine or
phone by the person who wrote them. Apple may refuse an iPhone app that is
only a website.

**Status:** Accepted.

## Decision #024 — A separate downloads website that reads GitHub Releases

**Context:** The desktop and Android apps (Decision #023) exist as installers on
GitHub's Releases page, but a person who wants "to download World Vitality"
expects an app's own download page: their system picked for them, plain
install steps, and an honest word about the unknown-publisher warnings. The
owner asked for that page, with sections for Windows, Mac and Linux.

**Chosen:**

- **A separate static website** in `sites/download`, deployed as its own Vercel
  project (`world-vitality-downloads`) from the same repository. Plain HTML,
  CSS and two small scripts: no framework, no build, no dependencies.
- **The page reads GitHub Releases when it is opened** (the public API, no key)
  instead of having versions written into it. Publishing a release is then the
  only step needed for the page to offer it: no change to the site, no redeploy,
  and no way for the page and the files to disagree.
- **Only this repository's release files are ever offered**, checked by address
  in the logic and again by the site's Content-Security-Policy, which also lets
  the page contact nothing but `api.github.com`.
- **It works in every state:** before any release exists it says the first
  version is being prepared and shows no download buttons; if GitHub cannot be
  reached it says so and links to the list of versions; with scripts off it is a
  plain page whose buttons lead to the Releases page.
- **Sections for Windows, Mac (Apple chip and Intel), Linux, and also Android**
  (the phone app exists), plus a short note for iPhone and iPad (no app; add
  the website to the Home Screen). The visitor's own system is highlighted and
  listed first.
- **Its tests run in their own workflow** (`downloads-site.yml`), not in the
  apps' build, so a problem with the website can never hold back a release.

**Alternatives considered:**

- _A page inside the main website (`apps/web`)._ Ties the downloads page to the
  website's build and deploys, and puts a page about the apps behind the
  website's login and plan machinery. Rejected: the page is public marketing
  with no account, and a separate project cannot take the website down.
- _Versions and file names written into the page (or a manifest committed to
  the repository)._ Needs an edit and a deploy after every release, and the two
  can drift. Rejected for reading the release itself.
- _A server-side function that asks GitHub and caches the answer._ Would avoid
  GitHub's per-visitor limit and the flash before the answer, but adds a server
  and a failure mode to a page that does not need one; the limit (60 an hour per
  visitor) is not a problem for a person downloading one file. Revisit if the
  page is ever linked from somewhere very busy.
- _Link straight to GitHub Releases._ Works, but shows a developer page with
  many files and no guidance about which to choose.

**Trade-offs, stated honestly:** before the page can show a download, someone
must publish the first release on GitHub (Actions, Native apps, Run workflow,
Publish ticked); until then the page says the first version is being prepared.
The download buttons point at github.com, so a visitor who cannot reach GitHub
cannot download. The page cannot tell an Apple-chip Mac from an Intel one (the
browser does not say), so it offers both and explains how to check. It does
not make the installers signed; the warnings are explained on the page, not
removed.

**Status:** Accepted.

## Decision #025 — Handing an organisation to another member, and why it waits for the plan to end

**Context:** An organisation has one owner (Decision #019) and the plan is the
owner's (Decisions #018 and #021). Nothing could change who the owner was, which
trapped the owner: they cannot delete their account while other people are in
the organisation, and could not give the organisation away either. A transfer
also touches money, because a Paystack subscription belongs to a person and
does not move.

**Chosen:**

- **One atomic database function** (`transfer_organization_ownership`,
  migration 0021) does the whole swap, so a crash or a race cannot leave an
  organisation with no owner or two. It checks again, inside the database, that
  the caller is the owner and that the new owner is already a member; the
  application checks too, from the session's own id.
- **The new owner must already be a member.** There is no invitation to accept.
  They get an inbox notice and the change is in the security log.
- **The previous owner stays on as an admin in every workspace** instead of
  being removed or demoted, so handing over can never lock them out of their own
  work. The new owner can remove them like anyone else.
- **While billing is on, a transfer is refused for as long as the owner's plan
  is in effect** (anything but Free), with a message that names the plan and
  says to hand over once it ends. If the plan cannot be read, the answer is "we
  couldn't", never "go ahead". With billing off there is no check.
- A two-step confirmation on the screen that says what changes and that only the
  new owner can hand it back.

**Alternatives considered:**

- _Let the transfer go through and drop the organisation to Free._ The new
  owner would find limits applied that the old owner had paid to avoid, with the
  caps possibly exceeded, and the old owner would still be charged. Rejected.
- _Move the subscription with the organisation._ Paystack has no way to change
  the customer on a subscription; it would mean cancelling and re-creating it,
  with a charge in between. Not worth building before anyone has paid.
- _Let the new owner subscribe first, then allow the transfer._ Reasonable, but
  needs a way to know they have, and a window where both are charged. Left for
  when it is asked for.
- _A pending offer the receiver must accept._ Safer against being handed an
  organisation you do not want, but needs a table of pending offers, expiry and
  a second screen. The receiver is already inside the organisation and the owner
  can be handed it back, so the plain version was judged enough for now.
- _Ask for the owner's password again._ The app has no password re-check today;
  it would be a separate piece of work for all sensitive actions.

**Trade-offs, stated honestly:** an owner on a paid plan cannot leave until the
plan ends (cancelling keeps the plan until the end of the period they paid for,
so that is up to a month or a year). The transfer is immediate, so a mistaken
choice is undone only by the new owner handing it back. Handing it over leaves
the previous owner with admin rights everywhere until the new owner removes
them, which is deliberate (no lock-out) but means "I handed it over" and "I have
left" are two separate steps.

**Revisit when:** the first paying customer asks to hand over, or to leave,
while on a paid plan.

**Status:** Accepted.

---

## Decision #026 — Orbi redrawn as a globe with a leaf; the 3D version and the honey-pot bear are retired

**Context:** The owner looked at the sign-in page on a real screen and sent two
screenshots: the top of the page was cut off (Orbi's head and the space above it)
and there was no room below the last link. They also said they no longer wanted
the honey-bear look and asked for one consistent character across the app, smaller
if needed. Two things were behind the cut-off page: a form column that centred its
content with `align-items: center` (when the window is shorter than the card, the
top of the card sits above the scrollable area where nothing can reach it), and the
picture panel beside it being one padding wider than its column, so it painted over
the edge of the card. Separately, a WebGL `GuideCharacter3D` still sat in the
repository, unused since Decision #007, along with `three` and its types.

**Chosen:**

- **One new drawing, in plain SVG:** a pale-blue globe with green land, a sprout
  with two leaves on top, a gold ring tilted around the middle, and two mitten hands
  holding the ring. Original to this project, with the logo's own globe, leaf and
  gold as its colours. The component's props (`mood`, `wave`, `walkAway`, `size`,
  `onWalkAwayComplete`) did not change, so no caller had to.
- **Moods are drawn, not described:** thinking shows a dashed ring that moves
  around the globe and one raised brow, concerned has brows tilted up in the middle
  (not down, which reads as angry), happy has a wide smile and lifted brows. Still
  or reduced-motion settings turn the movement off and keep the expression.
- **Smaller everywhere:** 104 px on sign-in, 96 on the other account pages and
  Welcome, 72 docked in the app and in the tutorial, 80 in the picture panel.
- **The 3D version is deleted,** with its `three` dependencies and lockfile entries.
  The crash it caused is recorded in Decision #007 and it had been unused since.
- **Account pages scroll safely:** the form column is a column with the language
  picker on top and the card in a wrapper with `margin: auto`, so a tall card on a
  short window scrolls from its top instead of losing it. Cards are `border-box`
  and the picture panel is `border-box`, `min-width: 0` and clipped.
- **Translated pages hide zxcvbn's own hints in other languages.** The password
  meter's word and colour are translated; the extra hint line exists in English only
  and is shown only when the page is English, rather than putting English under
  translated text.

**Alternatives considered:**

- _Keep the honey-pot bear and only shrink it._ The owner asked for a new shape.
- _Keep the 3D version for devices that can draw it._ It crashed once in
  production, needs a large library for a small mascot and was never switched back
  on; two characters would also make the app inconsistent.
- _Draw a person or an animal._ A globe with a leaf says what the product is about
  and cannot be mistaken for another company's mascot.

**Trade-offs, stated honestly:** the character has fewer moving parts than a 3D
model, so it cannot turn its head. Translated hints for weak passwords would need
the zxcvbn language packs for each language, which are large; the label and colour
carry the meaning meanwhile.

**Revisit when:** the owner confirms or changes the name "Orbi", or wants a
turn-around or voice for the tutorial.

**Status:** Accepted.

## Decision #027 — Live fire detections and public cameras on the Globe, with limits

**Context:** The owner asked for the Globe to include fire detection and live
CCTV, "so a random app user can use it for fun or observation, see a fire hazard
going on, and if it is not reported yet use the cameras to see what is actually
going on and call a fire fighter, so the app also works to save lives". At the
Globe's first version (BUILD_PLAN v57) the reference project's CCTV, flights and
ships layers were left out as off-mission. Saving lives from fire is squarely
the mission, so this reverses that part of the earlier scoping, but not the rest.

**Chosen:**

- **Fires:** one day of NASA FIRMS (VIIRS) heat detections for the whole world,
  folded into about 11 km squares, low confidence dropped, strongest 2,500 plus
  every one with a camera nearby. Replaces the Los-Angeles-only demo dots.
- **Cameras:** only official public traffic or road-weather camera services whose
  terms let other apps show the pictures with credit: Caltrans (California),
  Live Traffic NSW (Australia), DriveBC (British Columbia), Transport for London,
  Digitraffic (Finland). Each picture's address must sit on the agency's own host
  and the page's Content-Security-Policy allows pictures from those five hosts only.
- **Pictures are never touched by us:** the viewer's browser loads a picture
  straight from the agency, only after they open a camera, with no referrer.
  Nothing is recorded, copied or stored. The server handles camera lists only.
- **A panel that helps decide, not one that decides:** a heat detection is shown as
  possibly a fire ("it is not a confirmed fire"); cameras within 25 km are listed
  with distance and direction; a camera is labelled a still that can be minutes old;
  the call button comes with "call only if you believe there is a real, current
  fire" and "this is not an official alert and does not replace emergency services".
- **Emergency numbers:** a national number only where the country is known from a
  nearby camera's agency (911, 999, 000, 112); otherwise 112 with an explanation.
  Countries are never guessed from coordinates.
- **Independent loading:** floods and shelters, fires and cameras are three
  requests, so the slow one (a world fire day is several megabytes) never holds
  back the others. A failed agency removes only itself and is logged by name.

**Alternatives considered:**

- _Connect to every camera the reference project lists._ Several agencies forbid
  reuse (FL511, Houston TranStar, NYC DOT) and others are private or unsecured
  streams. Using them would put the owner at legal and ethical risk. Excluded.
- _Proxy or store the pictures through our server._ More load and cost, and it
  would make us a copier of other organisations' images. Excluded.
- _Windy Webcams API for worldwide coverage (including Nigeria)._ Needs an owner
  account and key and has its own terms; left as a possible later addition.
- _Send every camera to every visitor._ About 3,000 cameras per page open for
  markers nobody looks at. Thinned instead; fires always carry their own cameras.

**Trade-offs, stated honestly:**

- Coverage is five regions. **Nothing for Nigeria or most of Africa**; the panel says so.
- Satellite passes are a few hours apart and heat is not fire; pictures are stills,
  possibly minutes old. This will sometimes show nothing for a real fire and
  something for a harmless heat source. The wording says so.
- Anyone signed in can use the call button; a prank or mistaken call is possible
  and the advice text discourages it. No call is made by the app itself.
- Feed formats and licence wording could not be checked live from the build
  environment (see `docs/runbooks/globe-cameras.md`, "Not verified").

**Revisit when:** the logs show a source changed format or refused us; an agency
changes its terms; the owner obtains a Windy Webcams key or another open feed
covering Africa; or fire services ask for a different message.

**Status:** Accepted.

## Decision #028 — Google Maps imagery is linked to, not embedded, on the Globe

**Context:** The owner saw that the Globe's cameras were sometimes about an hour
behind and had shown no fire, and asked to integrate Google Maps' satellite view
because zooming in on it felt like a live walk through the place; they asked us
to find out whether it is live video or only images.

**Finding:** It is images. What they walked through was Street View (photographs
taken on a past date, cities re-photographed every few years, rural areas far
less often); the satellite layer is stored imagery too. Neither shows a fire as
it happens or a moving vehicle.

**Chosen:**

- **Link out, do not embed.** Each fire and camera panel gets "Look at the place":
  Google Maps satellite and Street View links (Google's documented Maps URLs,
  new tab, no key), labelled as older photos, not live. The person sees what kind
  of place it is (houses, forest, factory) and can describe it to a dispatcher.
- **Why not embed:** it cannot show a fire as it happens, so it would give a false
  sense of watching; and Google's terms forbid use where failure could cause death
  or injury (emergency response is named) and forbid mixing Google imagery with a
  non-Google map, which is exactly what the Globe is.
- **Address the lateness where it comes from:** three VIIRS satellites instead of
  one, a 10-minute server cache instead of 30, picture requests that cannot be
  answered from a browser's old copy, a **Reload picture** button, and the time the
  picture was loaded shown in the person's own clock.

**Alternatives considered:**

- _Embed Google's photorealistic 3D tiles or satellite tiles._ Not live, and not
  permitted for this use (above). Excluded.
- _NASA GIBS imagery layer._ Free and public, with daily true-colour imagery, fire
  layers and 10-minute GOES views for the Americas. Coarse (hundreds of metres to
  kilometres per pixel), so it shows smoke and burned land, not buildings. Possible
  later addition.
- _Geostationary fire detections (GOES, Meteosat, Himawari)._ Would be fresher, but
  are not in the FIRMS download this app reads.

**Trade-offs, stated honestly:** a fire can still show up hours after it starts
(satellite passes and NASA's processing), and nothing here makes the Globe a live
view. The wording already says so.

**Revisit when:** the owner wants a coarse "see the smoke from space" layer (GIBS),
or a way to receive geostationary fire detections.

## Decision #029 — Cameras stay as labelled still pictures that reload themselves; video waits for facts

**Date:** 2026-11-11. **Status:** accepted.

**Context:** The owner opened a camera and asked why it is not live video. Every
agency feed the Globe reads publishes stills that are replaced every few minutes
(Transport for London, NSW, DriveBC, Digitraffic; Caltrans lists a video address for
only some cameras and does not state its format). The panel already said "not live
video" in a small note under the picture, and it was missed.

**Decision:**

- Put a **"Still picture, not live video"** label on the picture itself.
- Fetch the open picture again by itself on the agency's own rhythm (1 to 5
  minutes), in the background, and swap it in only once it has loaded, so a failed
  refresh never turns a good picture into an error. Paused while the tab is hidden.
- Log how many California cameras offer video (`globe_caltrans_video_offered`)
  rather than build video playback on a guess.
- Do **not** add camera sources that cannot be tested from the build environment
  (Singapore is the first candidate; see the runbook for what is needed).

**Alternatives considered:**

- _Play Caltrans' video now._ Format, hosts and conditions of use are unconfirmed;
  needs a player library and CSP changes. Waits for the log line.
- _Add Singapore now._ Open licence and no key, but its location fields and picture
  host could not be verified from here; a wrong CSP host gives a dot with no picture.
- _Scrape or embed agencies' own live pages, or use private or unsecured streams._
  Not permitted; excluded as before.

**Trade-offs, stated honestly:** the picture still lags the agency's own publishing
by up to the agency's interval, and nothing here is live video. The coverage gap
(nothing in Africa) is unchanged.

**Revisit when:** the log shows California video in a known format and Caltrans'
conditions allow it, or a sample from Singapore (or another open feed) is available.

## Decision #030 — Pin patched PostCSS parts with overrides until Next 16

**Date:** 2026-11-11. **Status:** accepted.

**Context:** A quick check of the app (`docs/security/checkup-2026-11-11.md`)
found six known vulnerabilities (four high) in shipped dependencies, all in
PostCSS 8.4.31 and two of its parts. Next.js 15 pins that exact PostCSS, and even
the newest 15.x (15.5.29) still does; the patched PostCSS arrives only with
Next 16.

**Decision:** Add `pnpm.overrides` for `postcss`, `nanoid` and `source-map-js`,
keep Next on 15, and verify with the full suite, a production build and browser
tests. Remove the overrides when moving to Next 16.

**Alternatives considered:**

- _Upgrade to Next 16 now._ A major upgrade for a hygiene fix; much more to test.
- _Leave it._ The advisories concern hostile CSS or source-map files, which this
  app does not process, so exposure was low. But a failing audit hides new,
  relevant findings, and the override cost one line each.

**Trade-offs:** Next runs on a PostCSS version it was not released with. Next only
uses it internally here (the app has no PostCSS config), and everything built and
rendered as before; a future Next upgrade must re-check this.

**Revisit when:** upgrading to Next 16.

## Decision #031 — Singapore cameras, with the latest picture address asked for on demand

**Date:** 2026-11-11. **Status:** accepted.

**Context:** Decision #029 held Singapore back because its feed could not be tested
from the build environment. The owner pasted a real response, which settled the
field names and the picture host (`images.data.gov.sg`) and showed that every new
picture gets a **new address**, unlike every other agency (one address, replaced).

**Decision:** Add Singapore (about 90 cameras; Singapore Open Data Licence, no key,
commercial use allowed with attribution; fire and ambulance number 995). Because an
address in a list is out of date within seconds, mark these cameras `freshAddress`
and add a small signed-in route, `/api/globe/camera-picture`, that returns one
camera's latest address from a 30-second shared copy of the agency's list. The panel
uses it on open, on Reload and every minute while open, shows the agency's own
"picture taken at" time, and the nearby-cameras list shows "Open for the latest
picture" instead of a thumbnail that could be minutes old.

**Alternatives considered:**

- _Show the list's address and a Reload that does nothing new._ A picture up to the
  list's age old with a button that cannot refresh it, which is the "an hour late"
  complaint again. Rejected.
- _Proxy the pictures through this server._ Breaks the rule that pictures load
  straight from the agency and are never copied. Rejected.
- _Refresh the whole camera list in the browser every minute._ Heavier (every
  agency's cameras) for one agency's need. Rejected.

**Trade-offs, stated honestly:** Singapore
cameras have a plain numbered name; coverage is one small island, so it does nothing
for Africa; and without a key the agency may rate-limit us (logged; a key can be added).

**Revisit when:** Singapore rate-limits, or another agency also changes the address of
every picture (the `freshAddress` route is written for the `lta-` prefix only).

## Decision #032 — Place names on the 3D Globe, from bundled public-domain data

**Date:** 2026-11-12. **Status:** accepted.

**Context:** The owner opened the Globe and found no text on it: the 3D base map is
Natural Earth II pictures only, so there were no country or city names, and a fire dot
in the middle of a blank map tells a person nothing about where they are looking. (The
flat preview map uses street-map tiles, which carry names; the 3D globe replaces it.)

**Decision:** Draw country and city names on the 3D globe as one batch of Cesium labels
and points (`apps/web/app/globe/globe-places.ts`), not as entities. Data is Natural
Earth (public domain), generated once and checked in (`packages/hazard-feeds/src/places-data.ts`):
175 countries and 492 cities (every capital plus every city of about a million people).
Country names are **not stored**: the browser's own `Intl.DisplayNames` gives each in the
person's language (all five). City names are English. What is shown depends on
distance (`COUNTRY_VISIBLE_M`, `CITY_VISIBLE_M` in `places.ts`): the whole-Earth view has
only the biggest country names, and cities arrive in steps (very large, then capitals
and big cities, then the rest). Clicks look **through** a name to the fire or camera dot
under it (`drillPick`). The person can no longer zoom in closer than 600 km or out
beyond 20,000 km: closer, the bundled picture is a flat patch of colour; further, the
globe shrinks to a speck.

**Alternatives considered:**

- _A hosted street-map or satellite layer with its own names._ Sharper when zoomed in
  and no name data to carry, but a new outside host in the CSP, a usage policy that
  (for the free street map) does not suit an app that charges, and a paid key for the
  good ones. Not done; it is the next step if the zoomed-in view must be sharper.
- _Names as `Entity` labels like the person's own pins._ Hundreds of entities make the
  globe heavy to open and turn, and each gets a selection box when clicked. Rejected.
- _Translating city names._ Natural Earth carries only English for these; the country
  names are the ones people look for first. Left in English.

**Trade-offs, stated honestly:** names can overlap where cities are close (Kinshasa and
Brazzaville, Kigali and Bujumbura); the map is still low detail when close in, so the
names are what make it readable there; a small country or a city not in the list shows
no name. Names are a drawing aid, not an authority on borders: disputed territories carry
only the names the data lists, and two places without an ISO code (Somaliland, Northern
Cyprus) have no label of their own.

**Revisit when:** the zoomed-in view needs more than names (then choose a tile source and
add its host to the CSP and the drift test), or users ask for city names in their own language.

## Decision #033 — Heat alerts: tell people when a satellite sees heat near a place they saved

**Date:** 2026-11-12/13. **Status:** accepted and live. Held on the branch `heat-watch` until the owner applied migration 0023 (read back 2026-11-14), then merged.

**Context:** The owner's reason for the Globe is that anyone can check a reported or
unreported fire and call the fire service. In practice the cameras show nothing: the
orange dots are satellite heat readings (up to about 3 hours old, often farm burning
or gas flares), traffic cameras exist only in six regions and none in Nigeria, so
"see it on a camera, then call" rarely happens, and a person has no reason to open the
Globe at all. The useful thing the data can do is **tell people about heat near what
they care about**, so they know where to look and whether to call.

**Decision:** When a satellite heat detection (NASA FIRMS, the data the Globe already
shows) lies within **10 km** of a place a person saved, add a notification to their
inbox. "Places" are their home place and every field, insured property and monitored
location they are allowed to open (`apps/web/lib/watched-places.ts`, the same
permission filtering as the Globe pins, extracted from the Globe page so there is one
copy). Rules, all tested:

- **`alert`, never `critical`.** A detection is not a confirmed fire, and `critical` is
  reserved for an agency's own life-safety alert. The text says it is not a confirmed
  fire and may be farm burning or a gas flare, in the person's language (five).
- **Its own source** (`heat_watch`) and its **own switch** in Settings, on by default;
  never narrowed by the official-alert setting.
- **One per place per day** (the dedupe key carries the day), with the nearest
  detection's distance and how long ago the satellite passed, and the count. A dismissed
  notice is not brought back the same day. Expires after a day, the age of the data.
- **Low-confidence detections, ones older than a day and ones stamped in the future are
  ignored** (the same low-confidence rule as the Globe).
- **The link opens the Globe on the detection** (`/globe?heat=<lat>,<lon>`, read strictly:
  two numbers on Earth or nothing), selecting the fire area within 6 km of that point once,
  so the camera list, "Look at the place" and the call button are one tap away.
- **No place names or coordinates in logs**, only counts.

**How it runs, and the honest limit:** like official alerts there is **no background
job**. The header bell asks the server every few minutes while the app is open; the check
runs at most every 15 minutes per person, claims its slot before working so two tabs do
not both run it, and does the slow part (the world file from NASA, the comparison, the
notifications) after the answer has gone (`after()`), so the bell never waits for NASA.
The new notice shows on the bell's next refresh. **Nobody is woken up**: nothing is pushed
to a phone, SMS or email, so a person who has the app closed hears nothing. On the free
Vercel plan a scheduled job can run only once a day, which is too slow to be worth building.

**Alternatives considered:**

- _A daily scheduled job over every user._ Allowed on the free plan, but a notice that
  arrives up to a day late, into an inbox nobody is looking at, does not help someone decide
  whether to call. Rejected for now.
- _Email, SMS or push._ The real answer to "nobody is looking", but each needs a vendor, a
  cost and a consent decision (BUILD_PLAN records them as deliberately not built). The next
  step if heat alerts prove useful.
- _A radius setting._ One fixed 10 km is easier to explain and test; a field or a site
  rarely needs more or less. Revisit if people ask.
- _Using the `official_alert` source with a lower tier._ Rejected: it would put a
  satellite reading in the same bucket as an agency's warning and under that setting.

**Trade-offs, stated honestly:** in a dry-season farming region this can fire often (a
farmer burning stubble next door is a detection); the one-per-day limit and the switch are
the answer, and the text says what it is. A detection over open land with no camera is
still "go and look", which only the person can do. People without any saved place get
nothing: the alerts are for places the app knows.

**Revisit when:** people use it and ask to be reached when the app is closed (email or push),
or to choose the distance, or when more satellites (geostationary) are added to the feed.
