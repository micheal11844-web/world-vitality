-- Real resource type for Agriculture (BUILD_PLAN "STAGE — AGRICULTURE
-- FIELDS", Part B of the "scoped_field_user resource-scoping + no
-- invite UI" gap-closing work). Closes the *product* gap roles.ts's own
-- module doc comment named explicitly: "no sub-workspace resource type
-- (a 'field,' a 'site') exists anywhere... so nothing in this codebase
-- actually calls can() with a resourceId yet." PRD A.1 (Agriculture)
-- names this concept directly: "Field Overview (per-field cards...)."
--
-- Deliberately Agriculture-only, not a generic cross-workspace
-- "resources" table — no other workspace's PRD language supports a
-- comparable sub-workspace resource concept yet (Engineering Blueprint
-- 4.5: promote to shared/generic only once a genuine second consumer
-- exists). `workspace_id` is still a column, defaulted to
-- 'agriculture', for that same reason a generic table would eventually
-- need it — not dead weight, forward-compatible without being
-- speculative.
--
-- Create + read only in this migration — no update/delete. Editing or
-- removing a field is a real, deferred gap (see BUILD_PLAN), not an
-- oversight: it isn't required to make scoped_field_user's
-- resource-scoping mechanism real for the first time, which is this
-- stage's actual goal.

create table if not exists public.fields (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null default 'agriculture',
  name text not null,
  latitude double precision not null,
  longitude double precision not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists fields_workspace_id_idx on public.fields (workspace_id);

-- Field name/coordinates are not sensitive — every workspace member
-- benefiting from seeing the shared Field Overview is the whole point
-- (PRD A.1's dashboard). Read access is any authenticated user, not
-- scoped to "own rows" like audit_log or workspace_members — this
-- table has no per-row owner concept the way those do. Writes go
-- through the service-role client only (see AccountService.createField),
-- gated by can(role, "data:edit") in application code, same trust
-- boundary as every other write in this app.
alter table public.fields enable row level security;

drop policy if exists "Authenticated users can view fields" on public.fields;
create policy "Authenticated users can view fields" on public.fields
  for select using (auth.role() = 'authenticated');

comment on table public.fields is
  'Agriculture workspace fields (PRD A.1 Field Overview). Read-gated to authenticated users; writes via service-role client only, application-gated by can(role, "data:edit"). See AccountService.listFields/createField.';

-- One-time seed: preserves the existing demo field's continuity rather
-- than every Agriculture user suddenly seeing an empty list the moment
-- this migration lands. created_by is null deliberately — this seed
-- predates any real field-creation event, so attributing it to a
-- specific user would misrepresent history.
insert into public.fields (workspace_id, name, latitude, longitude, created_by)
select 'agriculture', 'Demo Field', 7.3775, 3.947, null
where not exists (
  select 1 from public.fields where workspace_id = 'agriculture' and name = 'Demo Field'
);
