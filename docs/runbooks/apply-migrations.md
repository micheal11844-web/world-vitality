# Applying database migrations

Migrations live in `services/identity-service/supabase/migrations/` and are
applied to the live Supabase project (`jjiceqlxayasthrrzlhc`) **in file
order, only with the owner's approval**: every one is written and tested
here first (on a real Postgres engine, running the whole chain), and none is
applied to the live database without asking.

## Where things stand

Checked read-only against the live project on 2026-11-07 (0019 and 0020 were applied that day, at the owner's request, through the Supabase connector; the connector's confirmation for 0021 timed out unanswered). **0021 was applied on 2026-11-08, at the owner's request, and its read-only checks passed, so every migration through 0021 is now in the live project.**

| #         | What it does                                                                                                                               | State       | If you wait                                                                                                                                                                                                                                     |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0016–0018 | Staff accounts, billing tables, organisations (every saved item and role belongs to one)                                                   | **Applied** | —                                                                                                                                                                                                                                               |
| 0019      | Lets the app save the "your payment didn't go through" notice (widens `notifications_source_check` to allow `billing`)                     | **Applied** | A failed renewal is still recorded and the plan still lapses correctly; only the in-app notice is not saved (logged as `notify_user_failed`, the webhook still answers 200).                                                                    |
| 0020      | Makes `organization_id` mandatory on fields, insured properties, monitored locations and workspace roles, closing a hole in the role check | **Applied** | Nothing breaks. The rule is already followed by every insert the app makes; this makes the database refuse a row that breaks it.                                                                                                                |
| 0021      | Adds the function that hands an organisation to another member                                                                             | **Applied** | The "Hand over ownership" section only shows to an owner with at least one other person in the organisation (today nobody). If it were used, the button says it couldn't, and nothing changes.                                                  |
| 0022      | Adds the table that keeps each successful payment (payment history, receipts, refund status)                                               | **Pending** | The plan screen shows "couldn't load your payment history", and a payment notice from Paystack gets an error so Paystack retries it for up to 72 hours. **Apply it before deploying the code that uses it, and before the first live payment.** |

Supabase's own migration history list stops at 0015 because 0016–0018 were
pasted in by hand (the objects exist; the list is informational and nothing
in the app reads it). Migrations applied through the connector do appear in
it.

**One is pending: 0022** (`billing_payments`, BUILD_PLAN v111). It only adds a
new table with no existing data touched, so it is safe to apply while the site is
live. The code that uses it is written and tested and sits on the branch
`billing-payment-history`, **not merged to `main`, so it is not on the live site
until 0022 is applied** (the connector's confirmation for it was declined on
2026-11-11). Once 0022 is applied, merge that branch into `main`. 0019 to 0021 are applied.

## What each one checked before it changed anything

- **0019** only replaces one check constraint with a wider one.
- **0020 is all or nothing.** It first checks that no row lacks an
  organisation. The only rows it ever removes are saved items with no
  organisation _and_ no creator (the demo rows seeded by migrations
  0006/0011/0012 on a database that never had an account; the app never shows
  them). If any other row lacks an organisation it stops with a message that
  counts them and changes nothing. **On the live database today that count is
  zero** (fields, properties, locations and roles), so it will go straight
  through.
- **0021** only adds a function (service role only).
- **0022** only creates `billing_payments` (new, empty) with an index, turns row-level security on, and takes away every grant from the browser roles. Before it ran, the tables `billing_subscriptions` and `billing_events` were confirmed present and `billing_payments` absent.

## Ways to apply

**1. Ask me (recommended).** Say "apply 0021". I apply it through the Supabase
connector and run the read-only checks below. The connector asks you to
confirm the change in the app; **answer that prompt within two minutes**, or it
expires and nothing is applied (that is what happened the first time).

**2. Paste them yourself.** Supabase dashboard → project → **SQL Editor** →
**New query**; open the migration file, copy all of it, paste, **Run**. Do
0019, then 0020, then 0021, one query each. For 0020 Supabase warns that the
query contains a destructive operation (the guarded `delete` of unowned demo
rows described above, which matches nothing here); confirm. "Success. No rows
returned." means it worked. An error means nothing was applied; copy the text
and send it to me. Running any of them twice is harmless.

## Check it worked

Each only reads.

```sql
-- 0019: the allowed sources now include billing (expect the list to contain 'billing')
select pg_get_constraintdef(oid) from pg_constraint
where conname = 'notifications_source_check';

-- 0020: all five columns are mandatory (expect is_nullable = 'NO' on every row)
select table_name, is_nullable from information_schema.columns
where table_schema = 'public' and column_name = 'organization_id'
order by table_name;

-- 0021: the function exists (expect 1), and the public roles cannot run it (expect false, false, true)
select count(*) from pg_proc where proname = 'transfer_organization_ownership';
select
  has_function_privilege('anon', 'public.transfer_organization_ownership(uuid,uuid,uuid,text[])', 'execute') as anon,
  has_function_privilege('authenticated', 'public.transfer_organization_ownership(uuid,uuid,uuid,text[])', 'execute') as signed_in,
  has_function_privilege('service_role', 'public.transfer_organization_ownership(uuid,uuid,uuid,text[])', 'execute') as service;
```

## Before applying 0020 on another database (staging, a copy)

Run this first. It should return zeros; anything else means 0020 will stop
and tell you which rows need an organisation.

```sql
select
  (select count(*) from public.fields where organization_id is null and created_by is not null) as fields,
  (select count(*) from public.insurance_properties where organization_id is null and created_by is not null) as properties,
  (select count(*) from public.government_ngos_locations where organization_id is null and created_by is not null) as locations,
  (select count(*) from public.workspace_members where organization_id is null) as roles;
```

## Undoing one (only if something unexpected shows up)

```sql
-- 0021: remove the function (the hand-over button then reports it couldn't)
drop function if exists public.transfer_organization_ownership(uuid, uuid, uuid, text[]);

-- 0020: make the columns optional again (rows are untouched)
alter table public.fields alter column organization_id drop not null;
alter table public.insurance_properties alter column organization_id drop not null;
alter table public.government_ngos_locations alter column organization_id drop not null;
alter table public.workspace_members alter column organization_id drop not null;

-- 0019: only safe while no billing notice has been saved
alter table public.notifications drop constraint notifications_source_check;
alter table public.notifications add constraint notifications_source_check
  check (source in ('official_alert', 'collaboration'));
```

## Granting yourself the admin console (0016)

0016 is applied, but `platform_staff` has no rows, so nobody can open the
admin console yet. Follow `docs/runbooks/admin-console.md` ("How staff access
is granted — SQL only") to make your own account a `platform_admin`.
