# Applying migrations 0016, 0017 and 0018

Three database changes are written and **not yet applied to the live
Supabase project**. This page is the paste-it-yourself way to apply them
(the Supabase connector was declined when asked, so nothing was applied for
you).

| # | What it adds | Needed for | Safe to apply early? |
| --- | --- | --- | --- |
| 0016 | Staff accounts and an audit log | The admin console (`/admin`) | Yes — nothing reads it until you grant a staff role |
| 0017 | Billing tables | Paystack (still switched off) | Yes — nothing reads it until `BILLING_ENABLED=true` |
| 0018 | Organisations; every saved item and role now belongs to one | **The privacy fix** — without it, any signed-in person can see every other customer's saved fields, properties, locations and comments | Yes — it is additive and the app now live keeps working |

**Order matters: 0016, then 0017, then 0018.** The script below has all
three, in that order, inside one transaction: either everything applies or
nothing does. Running it twice is harmless (every statement is guarded).

## Steps

1. Open the Supabase dashboard → your project (`jjiceqlxayasthrrzlhc`) →
   **SQL Editor** → **New query**.
2. Open `world-vitality-apply-0016-0018.sql` (the file attached to the
   message that sent you here; it is the three migration files joined, in
   order, between `begin;` and `commit;`), select all, copy, paste into the
   editor.
3. Press **Run**. Supabase will show a warning that the query contains a
   destructive operation (it is the `drop policy` on `fields`, which removes
   the "any signed-in user may read fields" rule — that is the point of
   0018). Confirm.
4. Expect "Success. No rows returned." If you see an error instead, nothing
   was applied; copy the error text and send it to me.

## Check it worked

Paste each of these into a new query. They only read.

```sql
-- 1. The six new tables exist (expect 6 rows)
select table_name from information_schema.tables
where table_schema = 'public'
  and table_name in ('platform_staff','staff_audit_log','billing_subscriptions',
                     'billing_events','organizations','organization_members')
order by 1;

-- 2. Every account has an organisation, and exactly one owner each
--    (expect: accounts = organisations = owners)
select
  (select count(*) from auth.users)                                          as accounts,
  (select count(*) from public.organizations)                                as organisations,
  (select count(*) from public.organization_members where role = 'owner')    as owners;

-- 3. Nothing is left without an organisation (expect 0, 0, 0, 0)
select
  (select count(*) from public.fields                 where organization_id is null) as fields,
  (select count(*) from public.insurance_properties   where organization_id is null) as properties,
  (select count(*) from public.government_ngos_locations where organization_id is null) as locations,
  (select count(*) from public.workspace_members      where organization_id is null) as roles;

-- 4. The open read rule on fields is gone (expect 0 rows)
select policyname from pg_policies
where schemaname = 'public' and tablename = 'fields';
```

## After applying 0018

Tell me it is done. I then check it read-only, push the code that uses it,
and confirm the deploy. **That code is not pushed before you apply 0018,**
on purpose: it reads the new tables, so deploying it first would show every
customer an empty app.

Until the new code is live, the code that is live today keeps working with
0018 applied: the database fills in `organization_id` for anything it saves.

## Granting yourself the admin console (0016)

After 0016 is applied, follow `docs/runbooks/admin-console.md` ("How staff
access is granted — SQL only") to make your own account a `platform_admin`.

## Housekeeping

- The dashboard does not record these in Supabase's own migration history
  (the connector would have). That history is informational; nothing in the
  app reads it. Later migrations should be applied the same way, in file
  order.
- Migration 0018 leaves `organization_id` nullable on purpose. A later
  migration can add `NOT NULL` once the new code has run for a while and
  query 3 above still shows zeros.
