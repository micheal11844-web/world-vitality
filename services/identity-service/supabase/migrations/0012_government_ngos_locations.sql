-- Real resource type for Government & NGOs (BUILD_PLAN "STAGE —
-- GOVERNMENT & NGOS FOLLOW-UP: MONITORED LOCATIONS"), the third real
-- resource type in this app after Agriculture's `fields` and
-- Insurance's `insurance_properties` — closing the same "genuinely
-- incomplete" institutional permission gap those two stages already
-- closed for their own workspaces: PRD A.10 names "Field Staff
-- (mobile-optimized, scoped regional access)," but this role has had
-- no populated data to scope to, so it has always behaved
-- workspace-wide.
--
-- **Named "Monitored Locations," not "jurisdictions" or "regions,"
-- and that's a deliberate scope decision, not a rename for
-- convenience.** PRD A.10 separately names real "jurisdiction-boundary-
-- aware" maps (GIS polygon data) as this workspace's map ambition —
-- this app has no polygon/boundary data source anywhere, and calling a
-- single point a "jurisdiction" or "region" would overclaim exactly
-- the geographic precision this table doesn't have. What's real and
-- buildable is a point-based monitored location within whatever area
-- Field Staff cover — same honesty discipline Insurance's "properties,
-- not claims" naming decision already established. Real jurisdiction
-- boundaries, if built later, are a separate, larger GIS feature; nothing
-- here needs to precede or block that.
--
-- **Deliberately its own table, not a reuse of `fields` despite an
-- identical column shape (label + coordinates, same as a field's name +
-- coordinates).** Engineering Blueprint 4.5's "promote to shared once a
-- genuine second consumer exists" is about avoiding *speculative*
-- abstraction where nothing yet justifies two copies — it is not a
-- mandate to merge two tables whenever their columns happen to match.
-- Here a real, substantive reason for separation exists even though the
-- shape doesn't differ: `fields`' RLS deliberately allows "any
-- authenticated user" to read every row, reasoned as safe because
-- field name/coordinates carry no real sensitivity for Agriculture.
-- A Government & NGOs monitored location can meaningfully describe a
-- humanitarian program site, a disaster-response staging area, or
-- similar location whose visibility PRD A.10 itself treats as
-- access-controlled ("Partner Agency... scoped by data-sharing
-- agreement") — the same stricter trust-boundary reasoning
-- `0011_insurance_properties.sql` already used for policy data. Two
-- tables, same shape, different real reasons to keep them separate.
--
-- Create + read only, no update/delete — same explicit, non-oversight
-- deferral `0006_agriculture_fields.sql` and `0011_insurance_properties.sql`
-- both made before their own edit/delete follow-ups.

create table if not exists public.government_ngos_locations (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null default 'government-ngos',
  label text not null,
  latitude double precision not null,
  longitude double precision not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists government_ngos_locations_workspace_id_idx
  on public.government_ngos_locations (workspace_id);

-- RLS enabled with zero policies — service-role access only, the same
-- stricter trust boundary `insurance_properties` uses (see this file's
-- own comment above for why), not `fields`' more permissive "any
-- authenticated user" policy.
alter table public.government_ngos_locations enable row level security;

comment on table public.government_ngos_locations is
  'Government & NGOs workspace monitored locations (PRD A.10 "Field Staff... scoped regional access"). Named "locations," not "jurisdictions," deliberately -- no GIS boundary data exists. RLS enabled with zero policies -- service-role access only, same stricter trust boundary insurance_properties uses, unlike fields'' "any authenticated user" policy. See AccountService.listLocations/createLocation and this table''s own migration comment for why.';

-- One-time seed, same reasoning as the demo rows in 0006/0011:
-- preserves the page's existing single-demo-point continuity rather
-- than every Government & NGOs user suddenly seeing an empty list the
-- moment this migration lands. Same coordinates the page has always
-- used.
insert into public.government_ngos_locations (workspace_id, label, latitude, longitude, created_by)
select 'government-ngos', 'Demo Jurisdiction', 7.3775, 3.947, null
where not exists (
  select 1 from public.government_ngos_locations where workspace_id = 'government-ngos' and label = 'Demo Jurisdiction'
);
