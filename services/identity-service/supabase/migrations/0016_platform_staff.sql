-- Internal admin console (BUILD_PLAN "v87"): who on the team may use it,
-- and an append-only record of what they did there.
--
-- `platform_staff` is the allow-list. A person is staff only if they have
-- a row here with `revoked_at` null. Staff are granted and revoked with
-- SQL (docs/runbooks/admin-console.md), never through the app: the
-- console has no screen that can create staff, so a compromised staff
-- account cannot mint more of them. Three roles:
--   support         — look up a user to help them
--   operations      — see data-source health and licensing
--   platform_admin  — everything above, plus the staff audit log
-- What each role may do lives in services/identity-service/src/staff.ts.
--
-- `staff_audit_log` records every time staff touch a person's data or run
-- an action (a user lookup, a data-source check, opening this log). It is
-- separate from `audit_log` (0004) on purpose: that table is a customer-
-- facing trail of what happened inside a workspace and cascades away
-- with the account, while this one is an accountability trail about
-- *staff* and has to outlive both the staff member and the person they
-- looked at. So it has no foreign keys: `staff_email` is a snapshot, and
-- `target_user_id` is a bare id that simply stops resolving to anyone if
-- that person later deletes their account. It never stores what was
-- typed into a search box, only the id that search resolved to.
--
-- Append-only is enforced by a trigger, not just by convention: UPDATE,
-- DELETE and TRUNCATE all raise, for every role including the service
-- role (triggers fire regardless of RLS). Retention is therefore
-- "keep" — if that ever has to change it is a deliberate migration that
-- drops the trigger, not something an app bug can do by accident.
--
-- Both tables: RLS on with zero policies, and every grant to the browser
-- roles revoked. Only the service-role client in apps/web can touch them.

create table if not exists public.platform_staff (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('support', 'operations', 'platform_admin')),
  granted_at timestamptz not null default now(),
  note text check (note is null or char_length(note) <= 200),
  revoked_at timestamptz
);

create table if not exists public.staff_audit_log (
  id uuid primary key default gen_random_uuid(),
  staff_user_id uuid not null,
  staff_email text not null check (char_length(staff_email) between 3 and 320),
  action text not null check (char_length(action) between 1 and 80),
  target_user_id uuid,
  detail text check (detail is null or char_length(detail) <= 500),
  created_at timestamptz not null default now()
);

create index if not exists staff_audit_log_recent_idx
  on public.staff_audit_log (created_at desc);

create index if not exists staff_audit_log_target_idx
  on public.staff_audit_log (target_user_id, created_at desc)
  where target_user_id is not null;

create or replace function public.staff_audit_log_append_only()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'staff_audit_log is append-only';
end;
$$;

drop trigger if exists staff_audit_log_no_change on public.staff_audit_log;
create trigger staff_audit_log_no_change
  before update or delete on public.staff_audit_log
  for each row execute function public.staff_audit_log_append_only();

drop trigger if exists staff_audit_log_no_truncate on public.staff_audit_log;
create trigger staff_audit_log_no_truncate
  before truncate on public.staff_audit_log
  for each statement execute function public.staff_audit_log_append_only();

alter table public.platform_staff enable row level security;
alter table public.staff_audit_log enable row level security;

revoke all on public.platform_staff from anon, authenticated;
revoke all on public.staff_audit_log from anon, authenticated;

comment on table public.platform_staff is
  'Allow-list for the internal admin console. Granted/revoked with SQL only — see docs/runbooks/admin-console.md. Read server-side via the service-role client.';
comment on table public.staff_audit_log is
  'Append-only record of staff actions in the admin console (user lookups, data-source checks, audit-log views). No foreign keys by design so it outlives staff and users. Written server-side only — see SupabaseStaffService.recordStaffAction.';
