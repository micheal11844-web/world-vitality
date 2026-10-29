# Organisations Runbook

Saved fields, insured properties, monitored locations and their comments
belong to an **organisation**, not to a workspace name (BUILD_PLAN v93;
Decision #019; migration `0018_organisations.sql`). This page says how it
works, what you will see in the database, and the handful of things staff
may need to do by hand.

## Why it exists

Before v93 every workspace was one shared copy keyed by its slug
(`agriculture`, `insurance`, …) and everyone signed in defaulted to
`viewer_external`, which may view data. Anyone with an account could see
every other customer's saved items and comments. With a single account in
the project nobody was exposed, but it had to be closed before the second
customer signed up — and plan limits (seats, saved items) need an owner to
count against.

## The model

- **One organisation per person.** Everyone gets their own the first time
  they use the app (`ensure_personal_organization`), so nobody "sets up"
  anything. There is no organisation switcher; if one is ever built, the
  unique constraint on `organization_members.user_id` is the one thing to
  drop.
- **One owner per organisation, and one organisation owned per person.**
  The owner is `admin_owner` in **every** workspace of the organisation
  without needing a `workspace_members` row.
- **Members** join by accepting an invitation, and have exactly the role
  they were invited with in the workspaces they were invited to. In a
  workspace they were not invited to they see **none** of the organisation's
  saved items (`viewer_external`, no organisation).
- **Items carry `organization_id`.** Comments inherit it from their field.
  Every read and write in the app goes through
  `AccountService.forOrganization(orgId)`, which puts the organisation in the
  query itself; there is no "list everything" method any more.
- **Plan = the owner's plan.** Seats = people in the organisation; saved
  items = rows across `fields`, `insurance_properties` and
  `government_ngos_locations`. See `docs/runbooks/billing.md`.

## Fails closed

No session, no organisation, no role, or any lookup error ⇒ the person is
`viewer_external` with **no** organisation, so reads are empty and writes
are refused. A database hiccup shows an empty workspace for a moment; it
never shows someone else's data. (Billing does the opposite — it fails
open, because a payment-system fault must not lock a customer out of their
own work.)

## What invitations do

1. The inviter's session supplies the organisation (never a form field), and
   it is stored in the invite's metadata with the workspace and role.
2. Accepting the link runs `join_organization` — one atomic statement that
   also enforces the plan's seat limit, so the last seat cannot be taken
   twice — then creates the role row.
3. A person who already belongs to another organisation that has **other
   members or saved items** is refused (`in_other_organization`); an empty
   personal organisation they never used is dissolved so they can join.
   This is logged as `invite_join_refused`.

## Removing people, deleting accounts

- Removing someone's last role in the organisation also frees their seat.
- The owner cannot be removed, and the last admin cannot be removed.
- **An owner cannot delete their account while other people are still in
  the organisation.** They are told how many remain and to remove them on
  the Team page first. Deleting the account then deletes the organisation's
  saved items too. A member deleting their account leaves the organisation
  and their comments go; items they created stay with the organisation.

## Looking at it in SQL (read-only)

```sql
-- Who belongs to what
select o.name as organisation, u.email, m.role
from public.organization_members m
join public.organizations o on o.id = m.organization_id
join auth.users u on u.id = m.user_id
order by o.created_at, m.role desc, u.email;

-- How full is each organisation?
select o.name,
  (select count(*) from public.organization_members m where m.organization_id = o.id) as people,
  (select count(*) from public.fields f where f.organization_id = o.id)
  + (select count(*) from public.insurance_properties p where p.organization_id = o.id)
  + (select count(*) from public.government_ngos_locations l where l.organization_id = o.id) as saved_items
from public.organizations o
order by o.created_at;

-- Anything the new code cannot see (expect nothing)
select 'fields' as t, id from public.fields where organization_id is null
union all select 'properties', id from public.insurance_properties where organization_id is null
union all select 'locations', id from public.government_ngos_locations where organization_id is null;
```

## Things staff may need to do by hand

Staff screens are read-only on customer data by design, so these are SQL.

**Rename an organisation** (there is no screen yet):

```sql
update public.organizations set name = 'Acme Farms' where id = '<organisation id>';
```

**Move a person into another organisation.** Only do this for someone with
no saved items of their own; items do not follow people. Remove their role
rows, then their membership, then re-run the invitation properly if you can —
it enforces seats for you. By hand:

```sql
delete from public.organization_members
where user_id = '<user id>' and role = 'member';   -- their role rows go with it
```

**A row with no organisation** (shows in the last query above): the
database fills it in for rows the code saves, so this should only happen
for rows that predate 0018 and have no creator. Give it an organisation:

```sql
update public.fields set organization_id = '<organisation id>' where id = '<field id>';
```

## Not built

- Organisation screens (rename, members overview, ownership transfer).
- More than one organisation per person; an organisation switcher.
- A per-workspace **workspaces** limit: the plan catalogue defines
  `workspaces`, but only three workspaces hold saved items, so it is not
  enforced. Seats and saved items are.
- `NOT NULL` on `organization_id` (a later migration, once the new code has
  run a while and the "no organisation" query stays empty).
