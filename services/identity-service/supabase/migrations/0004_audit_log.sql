-- Adds this app's first audit log (Insurance workspace, BUILD_PLAN
-- "STAGE — INSURANCE WORKSPACE"). `logger.ts`'s own doc comment has
-- flagged "Audit logs (immutable who-changed-what) — no admin/config
-- mutation surface exists yet to audit" as an honest, open gap since
-- Stage 7. This is the first real surface that needs one: PRD A.3
-- (Insurance) explicitly requires "Shared portfolio views... with
-- audit-logged access (per Constitution security/privacy principles)."
--
-- Deliberately a plain, append-only table, not a generic cross-app
-- audit framework — Engineering Blueprint 4.5's "promote once a
-- genuine second consumer exists" applies here exactly as it did to
-- `packages/`: build the real, narrow thing this one workspace needs
-- first; generalize only once a second workspace actually needs audit
-- logging too.
--
-- `workspace_id` is `text`, matching the now-reconciled convention in
-- 0003 (short slug, not a UUID) — no FK to `workspace_members` by
-- design, since this app's workspace IDs are route constants, not
-- rows in any table.

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  action text not null,
  resource_description text,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_workspace_id_created_at_idx
  on public.audit_log (workspace_id, created_at desc);

-- Same trust boundary as every other identity-adjacent table in this
-- project (profiles, workspace_members, data_export_requests,
-- auth_rate_limits): RLS on, minimal policy. Written server-side only
-- via the service-role client (see apps/web/lib/account.ts), which
-- bypasses RLS by design — the policy below governs a user reading
-- their own trail, not writes.
alter table public.audit_log enable row level security;

drop policy if exists "Users can view their own audit log entries" on public.audit_log;
create policy "Users can view their own audit log entries" on public.audit_log
  for select using (auth.uid() = user_id);

comment on table public.audit_log is
  'Append-only record of audit-relevant actions (currently: report generation in the Insurance workspace). Written server-side via the service-role client only — see AccountService.recordAuditEvent in services/identity-service/src/account.ts.';
