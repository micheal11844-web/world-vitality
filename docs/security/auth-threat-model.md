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
intending narrower _data_ access but currently only having a narrower
_permission-type_ set — real resource-level (e.g., per-field) access
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

### 6. Password auth — credential stuffing / brute force (new attack surface)

Added alongside magic link, not replacing it. This is a genuinely
different threat class from anything above: magic link and OAuth both
delegate "does this person control this identity" to a third party
(the email inbox, or Google) with no secret for an attacker to guess.
A password is a secret the _user_ chooses, and password-guessing
attacks are automatable at scale — the specific thing NIST SP
800-63B's current guidance (researched before building this) is
designed around.

**What's real here:** `signInWithPasswordAction` returns a
deliberately generic "Invalid email or password" error (doesn't
distinguish wrong-password from no-such-account, matching magic
link's own account-existence-shouldn't-leak principle) and requires an
8-character minimum, and `PasswordStrengthMeter` gives real,
pattern-aware (not naive character-class) feedback beyond that floor.
New passwords (sign-up and password reset) are also checked against
Have I Been Pwned's k-anonymity range API and rejected if they've
appeared in a known breach corpus (`apps/web/lib/password-breach-check.ts`)
— fails open on a third-party outage, logged, never blocking a
legitimate user over an unrelated service being briefly unreachable.

Account lockout / rate limiting on sign-in attempts is now built: a
Postgres table (`auth_rate_limits`) and three RPC functions
(`is_signin_locked`, `record_failed_signin_attempt`,
`record_successful_signin`), applied directly to the live Supabase
project and verified against real inputs (5 simulated failures
triggering lockout, a success clearing the record) before the calling
code was written. `signInWithPasswordAction` checks lockout status
_before_ ever calling Supabase's own sign-in API, so a known-
locked-out account doesn't spend that budget on a request already
known to fail. Sliding window: 5 failures within 15 minutes locks the
account for 15 minutes; a successful sign-in clears the record
entirely, since the point of a lockout is to stop guessing, not to
punish an account once it's proven the caller knows the real password.
This table is per-email, RLS-enabled with zero policies (service-role
access only, same trust boundary every other identity table in this
schema already uses), never touched by a user-scoped client.

**What's honestly NOT built:** IP-based rate limiting was scoped and
built as a follow-up (see below) — this section originally flagged it
as absent and that has since changed.

**Per-IP lockout, added as a follow-up:** `checkSignInIpLockout`/
`recordFailedSignInIp` lock an IP address out for 15 minutes after 20
failed sign-in attempts within 15 minutes (a deliberately higher
threshold than the per-email lockout, since one IP can represent many
real users behind NAT/a shared network) — protecting against an
attacker rotating through many different target emails from one IP,
which the per-email lockout alone doesn't slow down. Deliberately
never cleared on a successful sign-in, unlike the per-email lockout: a
successful sign-in from one account on a shared IP doesn't prove that
IP itself is safe — an attacker could otherwise reset the IP counter
at will by controlling one throwaway account. The client IP is read
from the `x-forwarded-for` header (Vercel's documented behavior for
identifying the real client behind its edge network) via
`apps/web/lib/get-client-ip.ts`; if neither `x-forwarded-for` nor
`x-real-ip` is present, IP-based limiting is skipped for that request
rather than rate-limiting against a fabricated key.

### 7. Google OAuth — new PKCE-based flow, new client, new credential class

Adding OAuth required introducing `@supabase/ssr` and a cookie-based
client (`lib/supabase-ssr.ts`) specifically for the PKCE handshake —
see that file's own doc comment for why the existing service-role
client architecture can't complete this exchange (the same class of
failure that already broke magic link once, deliberately avoided
here rather than repeated).

**New credential in play:** `SUPABASE_ANON_KEY` — weaker privileges
than `SUPABASE_SERVICE_ROLE_KEY`, but still a distinct real credential.
Mixing the two up (e.g. a future edit accidentally using the anon key
where the service-role key belongs, or vice versa) would be a real,
easy-to-make mistake worth watching for in review — the anon key is
_meant_ to be public-safe in typical Supabase apps, but this app's
existing threat model assumed only one server-side credential class
existed; that assumption is no longer quite true.

**What's real here:** the PKCE `code_verifier` cookie is genuinely
transient (only exists between initiating sign-in and completing the
callback), and the callback converts the result into this app's own
`Session`/cookie shape immediately — no ongoing parallel session store
exists.

**What's honestly NOT verified:** this flow has not been exercised
against a live Google Cloud OAuth app or a live Supabase project from
this environment — it's correct against Supabase's and Next.js's
documented behavior (verified this time, unlike the CSP incident) and
builds/typechecks cleanly, but "typechecks" and "actually completes a
real OAuth round-trip in a browser" are different claims. Treat the
first real sign-in attempt as the actual test, and watch server logs
(`oauth_initiation_failed`, `oauth_callback_verification_failed`)
closely when it happens.

### 8. "Remember Me" — new refresh-token cookie, new persistent-access window

Before this, no session-refresh mechanism existed in this codebase at
all — sessions simply expired with the short-lived Supabase access
token. `REFRESH_COOKIE` is new: a long-lived (30-day), httpOnly cookie
holding a real refresh token, set only when the user opts in.

**Real consequence worth naming plainly:** a stolen `REFRESH_COOKIE`
(e.g. via a device left logged in and physically accessed, or a
successful XSS despite the CSP's defenses) grants an attacker up to 30
days of silent re-access, not just the original short-lived token's
window. This is the standard, accepted tradeoff "remember me" features
make everywhere — convenience for a longer persistent-access window —
but it's a real tradeoff, not a free feature, and is being named as
one rather than left implicit.

**What's real here:** explicitly cleared (not just left unset) when a
user signs in again without Remember Me checked, so a stale long-lived
cookie from an earlier choice can't silently persist past a later,
different choice.

### 9. Forgot Password — a token that authenticates, by design

`requestPasswordReset` → emailed link → `/auth/callback?type=recovery`
→ `verifyPasswordResetCallback` → `/reset-password`. The recovery
`token_hash`, once verified, genuinely authenticates the user (this is
Supabase's own designed behavior, not a bug this app introduced) —
necessary so the reset-password Server Action can identify _whose_
password to change without trusting a client-submitted user ID, which
would be trivially spoofable.

**Real consequence worth naming plainly:** anyone with access to the
recovery email link (inbox access, a forwarded email, a shared/public
computer where it was opened) briefly holds an authenticated session
for that account — the same property every "reset link" flow in every
app has, not unique to this implementation.

**What's real here, mitigating that:** (1) the recovery session is
short-lived (bounded by Supabase's JWT expiry, same as any other
session — no extended lifetime granted), (2) `rememberMe` is forced
`false` for this session regardless of any query param, so it can never
become a persistent 30-day `REFRESH_COOKIE`, and (3) `updatePasswordAction`
signs the user **out** of this session immediately after a successful
password change, rather than leaving it active — a person completing a
reset is required to sign in fresh with the new password, which is the
more conservative choice for a flow that only proves inbox access, not
necessarily physical device control.

**What's honestly NOT added:** ~~no rate limiting on `requestPasswordReset`~~ **Closed** — `recordPasswordResetRequest` caps this at 3 requests per email per 15 minutes before any reset email goes out, verified against real inputs directly in Postgres before the calling code was written. This does not leak account existence: the cap is enforced identically regardless of whether the email belongs to a real account.

## What this threat model does NOT cover

Per this project's honest-flagging pattern: no formal STRIDE/DREAD
scoring was applied (this is a plain-language walkthrough, not a
scored framework exercise); no penetration testing has been performed
against the live deployment; the NASA connector and interpretation
engine have their own threat surface (data integrity/provenance, not
identity) not covered by this document. (Threats #6–#8 above replace
what this section previously said about SSO/OAuth "not existing yet"
— it now does, and is modeled above.)

## Revisit triggers

Per Engineering Blueprint Section 3 (docs reviewed at fixed intervals,
not only on change): revisit this document when any of the following
happen, whichever comes first — a second workspace is added (directly
activates threat #4), real users beyond the owner exist (changes the
stakes on #2, #5, #6, #7, and #8 substantially), or the OAuth flow
(#7) is actually exercised against a live Google/Supabase setup for
the first time — its "not verified" status above should be updated to
a real result, not left stale.

**Trigger fired and acted on:** rate limiting and breached-password
screening were both added for password auth — threat #6's body text
above reflects this now-current state, not the original "not built"
status. This document is itself the evidence the review-on-trigger
process works, not just an aspiration.
