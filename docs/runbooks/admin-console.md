# Admin Console Runbook

The internal console for the World Vitality team lives at `/admin` inside
the web app (BUILD_PLAN v87; why it is inside the app and not a separate
one is Decision #017). It is for staff only: everyone else — signed-in
customers included — gets the ordinary "not found" page.

## Before first use

1. Apply `services/identity-service/supabase/migrations/0016_platform_staff.sql`
   to the Supabase project (SQL editor, or `supabase db push`). Until it is
   applied, `/admin` shows an error page to anyone signed in who opens it,
   because the staff table does not exist yet. Nothing else in the app is
   affected.
2. Grant yourself access with the SQL below. There is no other way in.

## What it does today

| Screen | Address | Who may open it | What it is |
| --- | --- | --- | --- |
| Overview | `/admin` | any staff | Platform-wide counts only (accounts, recent sign-ups, onboarding, memberships, active staff). No names or emails. Also shows the licence notice below. |
| User lookup | `/admin/users` | support, platform admin | Find **one** account by its **exact** email or user id. Shows email, name, joined, email confirmed, last signed in, onboarding, language, workspace memberships. Nothing from inside a workspace, no home place, no notifications. |
| Data sources | `/admin/sources` | operations, platform admin | Licence and commercial-use status for every data source, and an on-demand live check of the three that have a probe (NASA POWER, Open-Meteo, USGS streamflow). |
| Audit log | `/admin/audit` | platform admin | Who did what in the console, newest first, 50 at a time. |

The roles and what each may open are defined in
`services/identity-service/src/staff.ts` (`STAFF_PERMISSIONS`). That split
is this project's own reasonable reading — the PRD names an admin console
but no staff roles — so review it against how the team actually works.

## How staff access is granted — SQL only

There is deliberately **no screen** that creates or changes staff. A
compromised staff account therefore cannot make more staff. Grants are
rows in `public.platform_staff`; run these in the Supabase SQL editor.

The person must already have an account (they sign up through the normal
sign-up page first).

**Grant (or change a role, or re-enable someone):**

```sql
insert into public.platform_staff (user_id, role, note)
select id, 'platform_admin', 'Project owner'   -- or 'support' / 'operations'
from auth.users
where lower(email) = lower('person@example.com')
on conflict (user_id) do update
  set role = excluded.role, note = excluded.note,
      granted_at = now(), revoked_at = null;
```

If it reports `INSERT 0 0`, no account has that email. Nothing was granted.

**Revoke** (keeps the history; access stops on their next page load):

```sql
update public.platform_staff
set revoked_at = now()
where user_id = (select id from auth.users where lower(email) = lower('person@example.com'));
```

**See who has access:**

```sql
select p.email, s.role, s.granted_at, s.revoked_at, s.note
from public.platform_staff s
left join public.profiles p on p.user_id = s.user_id
order by s.granted_at;
```

Deleting someone's account removes their staff row (it cascades). Their
past entries in the staff audit log stay, by design.

## The audit log

Every account lookup, every run of the data-source checks and every visit
to the audit log page writes a row to `public.staff_audit_log`: who (id and
an email snapshot), what, which account (an id), and when. It does **not**
store what was typed into the search box.

- The entry is written **before** anything about the person is read. If it
  cannot be written, the lookup fails and nothing is shown.
- It is append-only: a database trigger refuses UPDATE, DELETE and
  TRUNCATE for every role, the service role included. There is no
  retention job; entries are kept. Changing that is a deliberate migration
  that drops the trigger.
- It has no foreign keys, so it survives a staff member or a customer
  deleting their account. The account id then simply stops resolving to
  anyone.

If a customer asks who has looked at their account (a data-access
request), the answer comes from this table:

```sql
select created_at, staff_email, action, detail
from public.staff_audit_log
where target_user_id = '<their user id>'
order by created_at;
```

## The data-source licence notice

The Overview shows a notice when any source is restricted for commercial
use. Today that is Open-Meteo: its free tier is non-commercial only
(`docs/data-provenance/open-meteo.md`, Decision #004). **Resolve it before
the product starts charging** — move to a paid Open-Meteo plan or replace
the source. The catalogue behind this is
`services/data-ingestion/src/source-catalog.ts`; a test fails if it and
the provenance documents drift apart.

## What it deliberately cannot do

No impersonating a user, no changing or deleting an account, no resetting a
password, no viewing workspace content, no exporting user lists, no editing
data. Each of those is a separate decision with its own consent and audit
questions, not something to add casually to a lookup screen.

## Known gaps

- **No second factor for staff.** A staff account is protected by the same
  password sign-in as anyone's. Supabase supports TOTP; requiring it for
  staff is the first thing to add before the team grows or the console
  gains any write action.
- **English only**, unlike the customer pages.
- **No alerting** when someone is denied or when lookups spike; denied
  attempts are only logged (`admin_access_denied` in the security log).
- **Organization admin portal and billing management are not here.** They
  need an organizations model and a payment provider respectively.
- The console has not yet been exercised against the production database
  with a real staff account; see the v87 entry in BUILD_PLAN for exactly
  what was verified and how.
