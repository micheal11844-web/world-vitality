# Incident Response Runbook

Per Engineering Blueprint Section 14 (Security Lifecycle → Maintenance:
"a defined incident-response runbook maintained in `docs/runbooks/`").
This is a first version scoped to what's actually deployed today — a
solo-maintained project with one production surface (`apps/web` on
Vercel), Supabase for auth/data, and the NASA POWER connector. It will
need real revision once there's a team, paging, or actual users beyond
the owner — flagged here rather than pretending this is more mature
than it is.

## Who runs this

Currently: the project owner, solo. No on-call rotation, no paging
service. "Response" means the owner sees a problem (via Vercel's
dashboard/logs, a failed CI run, or a user report) and acts.

## Severity tiers

Adapted from Engineering Blueprint Section 12's "page immediately vs.
next-business-day review" principle, scaled to this project's actual
current stakes (no paying customers, no SLA, currently pre-limited-beta
per BUILD_PLAN Stage 8.2):

- **SEV-1 — Act now.** Users cannot sign in at all, or the site is
  fully down, or there's evidence of a real security compromise
  (leaked service-role key, unauthorized data access).
- **SEV-2 — Act same day.** A real feature is broken for some/all users
  (e.g., the soil-moisture widget silently fails, the map doesn't
  load) but sign-in and the rest of the app work.
- **SEV-3 — Next available session.** Cosmetic issues, a flaky test, a
  non-blocking CI warning, degraded-but-functional behavior.

## Immediate triage steps (any severity)

1. **Check Vercel's deployment dashboard first** — is the latest
   deployment `READY`, or did a deploy fail/roll back unexpectedly?
   This alone has been the cause of real past incidents on this
   project (see BUILD_PLAN's operational history around the Framework
   Preset and build-command settings).
2. **Check Vercel's runtime logs** for the affected route. Application
   errors go through `apps/web/lib/logger.ts`'s structured
   `application`/`security` categories — search by category first,
   not raw text, since security-relevant events are logged separately
   on purpose.
3. **Check Supabase's dashboard** (Authentication → Logs, and the
   Postgres logs) if the issue involves sign-in, sessions, or data
   access — many past real bugs on this project (see
   `services/identity-service/README.md`) were Supabase-side
   configuration issues (Site URL, email template, SMTP), not
   application code.
4. **Check the NASA POWER API's own status** if the Agriculture
   workspace's data is missing/stale — this is an external dependency
   outside our control; per ADR-0002/0003, the interpretation layer
   must show an honest "data unavailable" state rather than fabricate
   a value. If it's showing fabricated-looking data instead of an
   honest gap, that itself is the bug to fix, not the NASA outage.

## Known incident classes and their specific playbooks

### Sign-in broken (SEV-1)

This has happened for real on this project before (see BUILD_PLAN
changelog / `services/identity-service/README.md`). Check, in order:

1. **Supabase Site URL** (Authentication → URL Configuration) —
   defaults to `localhost:3000` on any project reset/recreation. If
   magic-link emails point at localhost, this is why.
2. **Supabase Magic Link email template** — must use
   `{{ .TokenHash }}` in a `token_hash`-based callback URL, NOT
   `{{ .ConfirmationURL }}` or a PKCE `code` param. `signInWithOtp`
   runs in a stateless Server Action with no persisted
   `code_verifier`, so a PKCE-style flow will structurally never work
   here — if someone "fixes" the template back to `ConfirmationURL`,
   this breaks again. See `apps/web/lib/auth.ts` and
   `SupabaseAuthService.verifyMagicLinkCallback`.
3. **Resend SMTP configuration** (Supabase → Authentication → Emails →
   SMTP Settings) — Supabase's default email sender is rate-limited to
   2/hour and not for production use; if emails stop arriving, confirm
   this hasn't silently reverted to the default sender.
4. **Env vars** — `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
   `SUPABASE_AUTH_REDIRECT_URL` on Vercel. `getAuthService()` throws a
   clear error at call time if any are missing (by design — see its
   doc comment), so a missing-env-var failure should be loud and
   specific in the logs, not a silent 500.

### Suspected credential/key leak (SEV-1, security)

`SUPABASE_SERVICE_ROLE_KEY` is the highest-value secret in this system
— it's a Postgres/auth admin key. Per the Stage 7 security review, it's
imported by exactly two server-only files
(`apps/web/lib/auth.ts` and the `/auth/callback` route), never a
Client Component.

If leak is suspected:

1. Rotate the key immediately in Supabase (Project Settings → API →
   generate new service role key).
2. Update `SUPABASE_SERVICE_ROLE_KEY` in Vercel's environment
   variables and redeploy.
3. Check Supabase's auth logs for any suspicious admin-level activity
   in the window the key may have been exposed.
4. Grep the git history for the key value (`git log -p -S <partial
key>`) to confirm whether it was ever actually committed, versus
   exposed some other way (e.g., pasted somewhere outside the repo).

### Data-provider failure / bad data shown (SEV-2)

Per ADR-0003, the ingestion interface must report gaps explicitly
rather than silently omit or fabricate. If a NASA POWER outage/rate-
limit is producing a confident-looking-but-wrong result instead of an
honest "data unavailable" state, treat that as the actual bug — it's
Engineering Blueprint Risk #1 ("silent AI misinterpretation presented
as fact"), the single highest-ranked risk in the whole Blueprint.

### CI failure (SEV-3, usually)

`dependency-audit` failing is expected/informational right now — see
`docs/security/known-vulnerabilities.md`; it won't block a merge.
`lint-typecheck-format` failing means something real broke; don't
merge until it's green.

## After any SEV-1 or SEV-2

Write a short postmortem entry in `BUILD_PLAN.md`'s changelog (what
happened, what the actual root cause was, what — if anything — changed
to prevent recurrence). This project's own established pattern
(verify for real, flag gaps honestly rather than silently) applies to
incidents too — a fixed-but-unrecorded incident is a lost lesson.

## What this runbook does NOT cover yet

Honestly flagged, per this document's own opening: no paging/alerting
system exists (Engineering Blueprint Section 12 — "monitoring
dashboards for system health" isn't built), no on-call rotation
(team of one), no rollback rehearsal beyond "Vercel's instant
rollback exists and is believed to work" (not drilled). These should
be revisited once there's more than one person and/or real users
depending on uptime.
