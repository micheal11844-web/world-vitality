# Auth/Identity Flow — Threat Model

Per Engineering Blueprint Section 14 ("threat modeling is part of the
design step for any feature touching sensitive data, external input, or
new infrastructure") and the Stage 7 review's honest flag: this flow
was built and iteratively debugged against real production failures,
which caught real bugs, but that's not the same as a deliberate,
upfront threat-modeling pass. This document is that pass, done
retroactively — better late than never, and flagged as such rather
than presented as if it happened at design time.

**Scope:** the magic-link sign-in flow (`services/identity-service`,
`apps/web/lib/auth.ts`, `/auth/callback`) and the account/permission
model built on top of it (`account.ts`, `roles.ts`). Not the NASA
connector or interpretation engine — those have their own concerns per
ADR-0002/0003.

## Assets being protected

1. **User accounts and sessions** — anyone who can complete the
   magic-link flow for an email they don't own gains that person's
   access.
2. **`SUPABASE_SERVICE_ROLE_KEY`** — a Postgres/auth admin credential.
   If exposed, an attacker has full database access, not just this
   app's access.
3. **Workspace membership/role data** — determines who can view/edit
   Agriculture-workspace data, manage team members, etc.

## Actors

- **Legitimate user** — has access to their own email inbox, nothing
  else.
- **Attacker with network access only** — can observe/tamper with
  requests but doesn't control the victim's email or the server.
- **Attacker who compromises the victim's email** — out of scope to
  fully defend against (email account security isn't this app's
  responsibility), but worth naming since magic-link auth is only as
  strong as the email account behind it.
- **Attacker with source/repo access** — relevant given real past
  incidents on this project involved manual file uploads; a malicious
  or mistaken upload is a real vector.

## Threats, walked through the actual flow

### 1. Magic-link interception / replay

The link contains a `token_hash` param, verified server-side via
Supabase's `verifyOtp`. If an attacker obtains the raw link (e.g., a
shared/forwarded email, a browser history sync, a link-preview bot
that pre-fetches URLs), they could complete sign-in as the victim.

**Current mitigation:** Supabase issues these as single-use,
time-limited tokens — a successful verification invalidates the token
for reuse. **Not independently verified** in this codebase (this is
Supabase's behavior, not ours to test) — flagged as an assumption
resting on Supabase's documented behavior, not something proven here.

**Residual risk, accepted for now:** if an email client or corporate
security tool auto-follows links in received emails (a documented real
phenomenon with some email-security products), it could consume the
token before the real user clicks it, causing a confusing "link
already used" failure for the legitimate user — a usability/support
issue more than a security breach, but worth knowing about if "my
magic link doesn't work" reports start coming in.

### 2. `SUPABASE_SERVICE_ROLE_KEY` exposure

This is the single highest-value secret in the system. Verified during
Stage 7's review that it's imported by exactly two server-only files,
never a Client Component, and never committed (`.env*` gitignored
except `.env.example`).

**Threats not fully closed:**
- **Vercel dashboard access** — anyone with access to the Vercel
  project's environment-variable settings can read this key in
  plaintext. Currently: solo owner only, so this reduces to "protect
  the owner's Vercel account," which has its own out-of-scope
  assumptions (Vercel account password/2FA hygiene).
- **Logging accidents** — `logger.ts`'s structured logging was
  reviewed to confirm it doesn't log secrets, but this is a discipline
  that must hold for every future log call, not a structural
  guarantee. A future engineer (or session) adding a debug log that
  includes a full request/env object could reintroduce this — worth a
  lint rule or code-review checklist item, not yet built.

### 3. PKCE-vs-token_hash confusion (a real, previously-exploited-by-
   accident failure mode, not hypothetical)

This isn't an attacker threat so much as a self-inflicted
availability threat, but it's worth threat-modeling because it
already happened: `signInWithOtp` runs in a stateless Server Action
with no persisted `code_verifier`, so a PKCE `code`-exchange flow
structurally cannot complete here. If the Supabase Magic Link email
template is ever "fixed" back to `{{ .ConfirmationURL }}` (which looks
more standard/correct at a glance), sign-in breaks entirely for every
user. This is documented in the incident-response runbook's first
playbook specifically because it's the most likely real incident this
system will have.

### 4. Role/permission model — data-level scoping gap

`scoped_field_user` is documented (in `roles.ts`'s own comment) as
intending narrower *data* access but currently only having a narrower
*permission-type* set — real resource-level (e.g., per-field) access
control isn't modeled. Today this is low real-world risk because the
only workspace (Agriculture) has no sub-workspace resources to
under-scope access to in the first place — there's nothing more
granular than "the whole workspace" to leak access to yet. **This
becomes a real, live threat the moment a second workspace or any
per-resource data model is added** (both currently on BUILD_PLAN's
explicitly-deferred list) — flagged here so that work doesn't proceed
without first revisiting this role model, rather than the gap being
rediscovered the hard way later.

### 5. Account deletion / data export — no additional auth step

`deleteAccount` and `requestDataExport` are single-call, "as easy as
sign-up" by deliberate design (Constitution Privacy Principles). This
is a legitimate UX/privacy tradeoff, but it does mean: anyone with an
active, valid session can permanently delete the account with one
call, no re-authentication or confirmation-email step. Worth naming
explicitly as an accepted tradeoff (ease-of-deletion over
defense-in-depth for this specific action) rather than an oversight —
if this project's risk tolerance changes (e.g., once there are real
users with real data), revisit whether a re-auth step belongs here.

## What this threat model does NOT cover

Per this project's honest-flagging pattern: no formal STRIDE/DREAD
scoring was applied (this is a plain-language walkthrough, not a
scored framework exercise); no penetration testing has been performed
against the live deployment; SSO/OAuth groundwork mentioned in
BUILD_PLAN ticket 3.1 doesn't exist yet so isn't modeled here; the
NASA connector and interpretation engine have their own threat surface
(data integrity/provenance, not identity) not covered by this document.

## Revisit triggers

Per Engineering Blueprint Section 3 (docs reviewed at fixed intervals,
not only on change): revisit this document when any of the following
happen, whichever comes first — a second workspace is added (directly
activates threat #4), real users beyond the owner exist (changes the
stakes on #2 and #5), or SSO/ticket 3.1's "optional SSO groundwork" is
actually built (new flow, new threats).
