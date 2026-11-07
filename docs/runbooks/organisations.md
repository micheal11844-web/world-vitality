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
  the organisation.** They are told how many remain and that they can hand
  the organisation to one of them (below) or remove them on the Team page
  first. Deleting the account while still the owner deletes the
  organisation's saved items too; after handing it over, the person is no
  longer the owner and can leave without taking anything with them. A member deleting their account leaves the organisation
  and their comments go; items they created stay with the organisation.
- With billing on, an owner's Paystack subscription is cancelled first, and
  the account is left alone if that cannot be confirmed
  (`docs/runbooks/billing.md`).

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

## Handing an organisation to another member (v105)

An organisation has exactly one owner, and until v105 nothing could change
who. An owner who wanted out could not leave (see above) and could not give
the organisation away. Now: **Settings → "Your organisation" → "Hand over
ownership"**, shown only to the owner and only when someone else is in the
organisation. Choose a person, press "Hand over ownership…", read the
confirmation, press "Yes, hand it over". Two steps, and the second spells
out what changes.

What happens, in one database call (`transfer_organization_ownership`,
migration 0021, so a crash or a race can never leave the organisation with no
owner or two):

- **The new owner must already be a member.** A person outside the
  organisation, or yourself, is refused. There is no "pending offer" to
  accept: the new owner is told with a notice in their inbox ("<name> made
  you the owner of <organisation>", linking to Settings), which is informational
  and follows their collaboration-notices setting.
- The owner and member roles swap, and `organizations.owner_id` follows.
- **The previous owner stays on as an admin in every workspace**, so handing
  over is never a lock-out. The new owner can remove them from a workspace's
  Team page like anyone else; once their last role is gone they have left the
  organisation, and (no longer an owner) they can delete their account.
- The new owner's own role rows are removed: the owner is admin everywhere
  without them.
- Saved items, comments and seats do not change.

**While billing is on, a hand-over is refused for as long as the current
owner's plan is in effect** (anything but Free: active, ending, past due, or
set by staff). The plan belongs to its owner and a Paystack subscription does
not move between people, so handing over would otherwise drop the
organisation to Free without warning. The message names the plan and says to
hand over once it has ended. If the plan cannot be read the answer is
"couldn't hand over", not "go ahead". With billing off there is no plan check.
This is a rule to revisit (moving a subscription, or letting the new owner
subscribe first), not a law: see Decision #025 in `docs/Decision-Log.md`.

Every hand-over is written to the security log as
`organization_ownership_transferred`. Handing it back is the same action in
the other direction.

**By hand (SQL), if the owner cannot reach the screen:**

```sql
select public.transfer_organization_ownership(
  '<organisation id>', '<current owner id>', '<new owner id>',
  array['agriculture','weather','construction','renewable-energy','research',
        'logistics','disaster-monitoring','government-ngos','insurance','education']
);  -- 'transferred', or the reason it refused
```

The last argument is the list of workspaces the previous owner stays admin
in (the workspace keys are in `apps/web/app/workspaces/workspace-nav.ts`).
This does not check billing; look at the owner's plan first.

## Things staff may need to do by hand

Staff screens are read-only on customer data by design, so these are SQL.

**Rename an organisation.** The owner can do this themselves: Settings →
"Your organisation" → "Save organisation name" (1–100 characters, owner
only; a member sees the name but cannot change it). Staff only need SQL if
the owner cannot reach the screen:

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

## What the organisation card shows

Settings has a "Your organisation" card (v96). The **owner** sees the name
(editable), and the list of people in the organisation: each person's email
and name, whether they are the owner, and, for members, their workspace roles.
A **member** sees the organisation's name and a note that the owner manages
it; they do not see the people list. If the people list cannot be loaded the
card says so and still lets the owner rename. Adding and removing people stays
where it was: open a workspace and choose Team.

## Not built

- Moving a **subscription** with an organisation (v105 hands over the
  organisation but refuses while the owner's plan is in effect).
- A hand-over the receiver has to accept, and asking the owner to confirm with
  their password again. Today it is immediate, to someone already inside, with a
  notice and a security-log line.
- More than one organisation per person; an organisation switcher.
- A per-workspace **workspaces** limit: the plan catalogue defines
  `workspaces`, but only three workspaces hold saved items, so it is not
  enforced. Seats and saved items are.
- `NOT NULL` on `organization_id` is written and tested (migration 0020) and
  waits for approval to apply; see `docs/runbooks/apply-migrations.md`.
