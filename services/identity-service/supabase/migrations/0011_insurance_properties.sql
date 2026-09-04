-- Real resource type for Insurance (BUILD_PLAN "STAGE — INSURANCE
-- FOLLOW-UP: INSURED PROPERTIES / RESOURCE-SCOPED CLAIMS ADJUSTER"),
-- the second real resource type in this app after Agriculture's
-- `fields` — closing the honest gap Insurance's own `workspace-shell.tsx`
-- named explicitly: "resource-level scoping (PRD's 'scoped to relevant
-- claims') has no populated data to scope to yet, so this role
-- currently behaves workspace-wide."
--
-- **Named "properties," not "claims," and that's a deliberate scope
-- decision, not a rename for convenience.** PRD A.3 says Claims
-- Adjuster is "scoped to relevant claims," but this codebase has no
-- claims-event data model anywhere (no claim number, date, adjuster
-- notes, payout status) and fabricating one with invented claim
-- records would misrepresent real data the same way a fabricated risk
-- score would (see this workspace's own already-declined "multi-hazard
-- AI-synthesized score" reasoning). What's real and buildable is the
-- underlying **insured property** a claim would always be about — the
-- "portfolio upload (addresses/geographies covered)" PRD A.3's own
-- sign-up journey describes. A real claims-event log, if built later,
-- would reference this table's `id`; it does not need to precede it.
--
-- Deliberately Insurance-only, not a merge into Agriculture's `fields`
-- table or a new generic cross-workspace "resources" table — same
-- Engineering Blueprint 4.5 reasoning `0006_agriculture_fields.sql`
-- already used ("promote to shared/generic only once a genuine second
-- consumer exists"): a property has a `policy_number`, a field does
-- not, and the domains don't actually share a schema just because both
-- happen to have a name and coordinates.
--
-- Create + read only, no update/delete — same explicit, non-oversight
-- deferral `0006_agriculture_fields.sql` made for editing/deleting a
-- field (which later got its own real follow-up once the read/create
-- path was proven); this migration's actual goal is making
-- `scoped_field_user` (labeled "Claims Adjuster" in this workspace)
-- resource-scoping real for a second workspace, not full CRUD.

create table if not exists public.insurance_properties (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null default 'insurance',
  policy_number text not null,
  property_address text not null,
  latitude double precision not null,
  longitude double precision not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists insurance_properties_workspace_id_idx
  on public.insurance_properties (workspace_id);

-- **Deliberately stricter than `fields`' RLS, not the same pattern
-- copied by default.** `fields`' read policy is "any authenticated
-- user" because field name/coordinates carry no real sensitivity and
-- every Agriculture member benefiting from the shared Field Overview
-- is the whole point of that dashboard (see `0006`'s own comment). A
-- policy number and the property address it's written against are
-- real financial/business data, and PRD A.3 explicitly separates
-- "Analyst/Read-only (portfolio-level reporting, no individual policy
-- detail)" from the other three roles — an "any authenticated user can
-- read every row" policy would directly contradict that stated
-- permission model at the database layer, undermining the
-- resource-scoping this migration exists to make real. RLS is enabled
-- with **zero policies at all** — the same "service-role access only"
-- trust boundary `audit_log` and the rate-limit tables already use —
-- so every read, not just every write, goes through
-- `AccountService.listProperties()`, gated by application-layer
-- `can(role, "data:view", { resourceId, scopedResourceIds })` on each
-- row, exactly like every other permission check in this app.
alter table public.insurance_properties enable row level security;

comment on table public.insurance_properties is
  'Insurance workspace insured properties (PRD A.3 portfolio; the real resource type scoped_field_user/"Claims Adjuster" is scoped to). RLS enabled with zero policies -- service-role access only, unlike fields'' "any authenticated user" read policy, since policy numbers and addresses are real financial/business data. See AccountService.listProperties/createProperty and this table''s own migration comment for why.';

-- One-time seed, same reasoning as `0006`'s demo field: preserves
-- Insurance's existing single-demo-address Underwriting Risk Context
-- widget's continuity rather than every Insurance user suddenly
-- seeing an empty portfolio the moment this migration lands. Same
-- coordinates the page has always used.
insert into public.insurance_properties (workspace_id, policy_number, property_address, latitude, longitude, created_by)
select 'insurance', 'DEMO-0001', 'Demo Insured Location', 7.3775, 3.947, null
where not exists (
  select 1 from public.insurance_properties where workspace_id = 'insurance' and policy_number = 'DEMO-0001'
);
