-- Organisations (BUILD_PLAN "v93"): saved items and team roles belong to an
-- organisation, not to a workspace *name*.
--
-- THE PROBLEM THIS CLOSES. Until now `fields`, `insurance_properties` and
-- `government_ngos_locations` were filtered only by a workspace slug
-- ("agriculture", "insurance", ...), and `workspace_members` rows were keyed
-- by the same slug. Every signed-in person fell back to `viewer_external`,
-- which may view data — so anyone with an account could see every other
-- customer's saved fields, insured properties, monitored locations and
-- comments. With one account in the project nobody was exposed yet, but it
-- had to be fixed before the second customer signed up, and plan limits
-- (seats, saved items) have nothing to count against without an owner.
--
-- THE MODEL.
--   organizations         one per paying/free customer; has one owner
--   organization_members  who belongs to it ('owner' | 'member')
-- Rules, enforced here and not only in the app:
--   * a person belongs to exactly ONE organisation (unique user_id) — there
--     is no organisation switcher yet; if one is ever built, this unique
--     constraint is the one thing to drop;
--   * an organisation has exactly one owner, and a person owns at most one;
--   * a workspace role (`workspace_members`) can only exist for someone who
--     is in that organisation (composite foreign key), and goes away with
--     their membership;
--   * every saved item carries `organization_id`; comments inherit it from
--     their field.
-- The owner is `admin_owner` in every workspace of their organisation
-- without needing a `workspace_members` row. Everyone else needs a role row
-- for the workspaces they were invited to, and sees nothing elsewhere.
--
-- The organisation's plan is its OWNER's plan (billing_subscriptions, 0017):
-- seats = organisation members, saved items = rows across the three tables.
--
-- SAFE TO APPLY WHILE THE OLD APP IS STILL LIVE. Everything here is
-- additive: new tables, new nullable columns, and triggers that fill
-- `organization_id` for rows the previous code inserts without it. The
-- columns stay nullable on purpose (a row with no organisation is simply
-- invisible to the new code, never visible to the wrong one); a later
-- migration can add NOT NULL once the new code has been running a while.
--
-- DATA. Backfill is idempotent: every existing account gets a personal
-- organisation it owns, its roles and the items it created move into it,
-- and the original demo rows that nobody created go to the earliest
-- account's organisation (the founder's) so they do not vanish.
--
-- ACCESS. Both new tables: RLS on with zero policies, grants to the browser
-- roles revoked — only the service-role client in apps/web touches them,
-- like 0016/0017. The one policy that let any signed-in browser session read
-- every row of `fields` is dropped; the app never read it that way (all
-- reads go through the service role) but it contradicted the model.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'My organisation' check (char_length(name) between 1 and 100),
  owner_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create unique index if not exists organizations_one_per_owner_idx
  on public.organizations (owner_id);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (organization_id, user_id),
  constraint organization_members_one_org_per_user unique (user_id)
);

create unique index if not exists organization_members_one_owner_idx
  on public.organization_members (organization_id)
  where role = 'owner';

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

revoke all on public.organizations from anon, authenticated;
revoke all on public.organization_members from anon, authenticated;

comment on table public.organizations is
  'A customer account that owns saved items and has members. Its plan is its owner''s plan (billing_subscriptions). Service-role only — see docs/runbooks/organisations.md.';
comment on table public.organization_members is
  'Who belongs to an organisation. A person is in exactly one (unique user_id); the owner row is the organisation''s owner. Service-role only.';

-- ---------------------------------------------------------------------------
-- Columns on the things an organisation owns
-- ---------------------------------------------------------------------------

alter table public.workspace_members
  add column if not exists organization_id uuid;

alter table public.fields
  add column if not exists organization_id uuid
  references public.organizations (id) on delete cascade;

alter table public.insurance_properties
  add column if not exists organization_id uuid
  references public.organizations (id) on delete cascade;

alter table public.government_ngos_locations
  add column if not exists organization_id uuid
  references public.organizations (id) on delete cascade;

create index if not exists fields_organization_id_idx
  on public.fields (organization_id, workspace_id);
create index if not exists insurance_properties_organization_id_idx
  on public.insurance_properties (organization_id, workspace_id);
create index if not exists government_ngos_locations_organization_id_idx
  on public.government_ngos_locations (organization_id, workspace_id);
create index if not exists workspace_members_organization_id_idx
  on public.workspace_members (organization_id, workspace_id);

-- ---------------------------------------------------------------------------
-- Backfill (idempotent — safe to run twice)
-- ---------------------------------------------------------------------------

-- 1. Every existing account gets a personal organisation it owns.
insert into public.organizations (owner_id)
select u.id
from auth.users u
where not exists (select 1 from public.organization_members m where m.user_id = u.id)
  and not exists (select 1 from public.organizations o where o.owner_id = u.id)
order by u.created_at, u.id;

insert into public.organization_members (organization_id, user_id, role)
select o.id, o.owner_id, 'owner'
from public.organizations o
where not exists (select 1 from public.organization_members m where m.user_id = o.owner_id);

-- 2. Their workspace roles belong to that organisation.
update public.workspace_members w
set organization_id = m.organization_id
from public.organization_members m
where m.user_id = w.user_id
  and w.organization_id is null;

-- 3. Items belong to the organisation of the person who created them.
update public.fields t
set organization_id = m.organization_id
from public.organization_members m
where t.organization_id is null and t.created_by = m.user_id;

update public.insurance_properties t
set organization_id = m.organization_id
from public.organization_members m
where t.organization_id is null and t.created_by = m.user_id;

update public.government_ngos_locations t
set organization_id = m.organization_id
from public.organization_members m
where t.organization_id is null and t.created_by = m.user_id;

-- 4. The original demo rows (0006/0011/0012) were seeded with no creator.
--    They go to the earliest account's organisation — the founder's — so
--    they do not vanish. On a fresh database there is no organisation yet
--    and these statements change nothing.
update public.fields t
set organization_id = (
  select o.id from public.organizations o
  join auth.users u on u.id = o.owner_id
  order by u.created_at, o.id limit 1)
where t.organization_id is null and t.created_by is null
  and exists (select 1 from public.organizations);

update public.insurance_properties t
set organization_id = (
  select o.id from public.organizations o
  join auth.users u on u.id = o.owner_id
  order by u.created_at, o.id limit 1)
where t.organization_id is null and t.created_by is null
  and exists (select 1 from public.organizations);

update public.government_ngos_locations t
set organization_id = (
  select o.id from public.organizations o
  join auth.users u on u.id = o.owner_id
  order by u.created_at, o.id limit 1)
where t.organization_id is null and t.created_by is null
  and exists (select 1 from public.organizations);

-- ---------------------------------------------------------------------------
-- A role can only exist for a member of that organisation
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'workspace_members_org_member_fk'
  ) then
    alter table public.workspace_members
      add constraint workspace_members_org_member_fk
      foreign key (organization_id, user_id)
      references public.organization_members (organization_id, user_id)
      on delete cascade;
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Rows inserted by code that does not know about organisations yet
-- ---------------------------------------------------------------------------
-- The previous release inserts items with `created_by` and roles with
-- `user_id` but no organisation. These triggers fill it from the person's
-- membership so that nothing created between applying this migration and
-- deploying the new code is orphaned. The new code always sets the column
-- itself, so for it these are a no-op safety net.

create or replace function public.fill_item_organization_id()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.organization_id is null and new.created_by is not null then
    select m.organization_id into new.organization_id
    from public.organization_members m
    where m.user_id = new.created_by;
  end if;
  return new;
end;
$$;

create or replace function public.fill_member_organization_id()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.organization_id is null then
    select m.organization_id into new.organization_id
    from public.organization_members m
    where m.user_id = new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists fields_fill_organization on public.fields;
create trigger fields_fill_organization
  before insert on public.fields
  for each row execute function public.fill_item_organization_id();

drop trigger if exists insurance_properties_fill_organization on public.insurance_properties;
create trigger insurance_properties_fill_organization
  before insert on public.insurance_properties
  for each row execute function public.fill_item_organization_id();

drop trigger if exists government_ngos_locations_fill_organization on public.government_ngos_locations;
create trigger government_ngos_locations_fill_organization
  before insert on public.government_ngos_locations
  for each row execute function public.fill_item_organization_id();

drop trigger if exists workspace_members_fill_organization on public.workspace_members;
create trigger workspace_members_fill_organization
  before insert on public.workspace_members
  for each row execute function public.fill_member_organization_id();

-- ---------------------------------------------------------------------------
-- The two operations that must be atomic
-- ---------------------------------------------------------------------------
-- Called only by the service-role client. Doing them as single statements in
-- the database (rather than several calls from the app) means a crash or a
-- race can never leave an organisation without an owner row, and two people
-- accepting the last seat at the same moment cannot both get it.

-- A person's own organisation, created on first use. Returns its id; if they
-- already have one (of any kind) that one is returned unchanged.
create or replace function public.ensure_personal_organization(p_user_id uuid)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_org uuid;
begin
  select m.organization_id into v_org
  from public.organization_members m
  where m.user_id = p_user_id;
  if v_org is not null then
    return v_org;
  end if;

  begin
    insert into public.organizations (owner_id) values (p_user_id) returning id into v_org;
    insert into public.organization_members (organization_id, user_id, role)
    values (v_org, p_user_id, 'owner');
  exception when unique_violation then
    -- Another request created it first; use theirs.
    select m.organization_id into v_org
    from public.organization_members m
    where m.user_id = p_user_id;
    if v_org is null then
      raise;
    end if;
  end;
  return v_org;
end;
$$;

-- Accepting an invitation into someone else's organisation. Returns:
--   'joined'                the person is now a member
--   'already'               they were already a member of it
--   'seat_limit'            it has p_max_seats members already (null = no cap)
--   'in_other_organization' they already belong to a different organisation
--                           that has other members or saved items
--   'not_found'             no such organisation
-- A person whose only organisation is their own empty personal one (no other
-- members, nothing saved) leaves it behind and joins — that is what happens
-- to someone who signs up through an invitation.
create or replace function public.join_organization(
  p_user_id uuid,
  p_organization_id uuid,
  p_max_seats integer default null
)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_current uuid;
  v_members integer;
  v_items integer;
begin
  -- Serialise joins to the same organisation so the seat count cannot be raced.
  perform 1 from public.organizations o where o.id = p_organization_id for update;
  if not found then
    return 'not_found';
  end if;

  select m.organization_id into v_current
  from public.organization_members m
  where m.user_id = p_user_id;

  if v_current = p_organization_id then
    return 'already';
  end if;

  if v_current is not null then
    select count(*) into v_members
    from public.organization_members m where m.organization_id = v_current;
    select (select count(*) from public.fields t where t.organization_id = v_current)
         + (select count(*) from public.insurance_properties t where t.organization_id = v_current)
         + (select count(*) from public.government_ngos_locations t where t.organization_id = v_current)
      into v_items;
    if v_members > 1 or v_items > 0 then
      return 'in_other_organization';
    end if;
  end if;

  select count(*) into v_members
  from public.organization_members m where m.organization_id = p_organization_id;
  if p_max_seats is not null and v_members >= p_max_seats then
    return 'seat_limit';
  end if;

  if v_current is not null then
    -- Their empty personal organisation (and its role rows) goes with it.
    delete from public.organizations o where o.id = v_current;
  end if;

  insert into public.organization_members (organization_id, user_id, role)
  values (p_organization_id, p_user_id, 'member');
  return 'joined';
end;
$$;

revoke all on function public.ensure_personal_organization(uuid) from public, anon, authenticated;
revoke all on function public.join_organization(uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.ensure_personal_organization(uuid) to service_role;
grant execute on function public.join_organization(uuid, uuid, integer) to service_role;

-- ---------------------------------------------------------------------------
-- Close the one browser-readable policy
-- ---------------------------------------------------------------------------

drop policy if exists "Authenticated users can view fields" on public.fields;

comment on table public.fields is
  'Agriculture workspace fields (PRD A.1 Field Overview), owned by an organisation (organization_id). RLS on with zero policies — service-role access only, application-gated by organisation and can(role, "data:view"). See AccountService.forOrganization.';
comment on column public.workspace_members.organization_id is
  'The organisation this role belongs to. Must be an organisation the user is a member of (composite foreign key). Null only for rows written by pre-organisation code before the triggers filled it.';
