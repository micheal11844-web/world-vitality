-- Real commentary threads on specific fields (BUILD_PLAN "STAGE —
-- AGRICULTURE FIELD COMMENTS"), closing PRD A.1's "Collaboration:
-- Shared farm access for farm managers/agronomists with commentary
-- threads on specific fields." Deliberately Agriculture-only, same
-- reasoning as `fields` itself (0006_agriculture_fields.sql) — no
-- other workspace has PRD language supporting a comparable per-resource
-- commentary concept yet.
--
-- Create + read only, same as `fields` was before its own edit/delete
-- follow-up — comment editing/deletion is a real, explicitly-deferred
-- gap, not required for a first real collaboration feature to exist.

create table if not exists public.field_comments (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references public.fields (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists field_comments_field_id_created_at_idx
  on public.field_comments (field_id, created_at asc);

-- Same read-access reasoning as `fields` itself: a comment thread on a
-- shared field is shared team visibility, not a private per-user
-- record — every authenticated user can read it, same as the field
-- data it's attached to. Writes go through the service-role client
-- only, application-gated by can(role, "comments:create", {
-- resourceId, scopedResourceIds }) — the first permission check in
-- this app that is both resource-scoped AND workspace-role-gated
-- together (a scoped_field_user must both hold comments:create and
-- have this specific field in their scope).
alter table public.field_comments enable row level security;

drop policy if exists "Authenticated users can view field comments" on public.field_comments;
create policy "Authenticated users can view field comments" on public.field_comments
  for select using (auth.role() = 'authenticated');

comment on table public.field_comments is
  'Commentary threads on Agriculture fields (PRD A.1 Collaboration). Read-gated to authenticated users; writes via service-role client only, application-gated by can(role, "comments:create", { resourceId, scopedResourceIds }). See AccountService.listFieldComments/createFieldComment.';
