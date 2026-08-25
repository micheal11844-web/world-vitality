-- Reconciliation migration — brings this repo's migration history in
-- line with what is already live. This exact schema fix was applied
-- directly to the live Supabase project (tracked there as
-- `fix_workspace_members_schema`, 2026-08-24) during the Government &
-- NGOs workspace build, but no corresponding file was ever committed
-- to this migrations folder — a real gap, caught and closed here
-- while building the Insurance workspace, which touches this same
-- table's neighborhood (see 0004_audit_log.sql). This file changes
-- nothing live; it documents what already happened so a fresh
-- environment (or `Supabase:list_migrations` audit) reflects reality.
--
-- The problem `0001_identity_foundation.sql` had: `workspace_id` was
-- typed `uuid`, but no workspace anywhere in this app has ever had a
-- UUID identifier — every workspace is addressed by a short text slug
-- ("agriculture", "government-ngos", "insurance", etc.), the same
-- convention `workspace-nav.ts` and every `WORKSPACE_ID` constant in
-- `apps/web` use. The `uuid` column would have rejected every real
-- insert. Caught and fixed against a live-but-still-empty table
-- (verified via real insert/read/delete before this fix, zero data
-- at risk) rather than discovered later against real membership rows.

alter table public.workspace_members
  alter column workspace_id type text using workspace_id::text;

comment on column public.workspace_members.workspace_id is
  'Short text slug (e.g. "agriculture", "government-ngos"), matching apps/web''s WORKSPACE_ID convention — not a UUID. Originally mistyped uuid in 0001; corrected here.';
