-- BACKFILL, not a new change: this migration was applied directly to
-- the live Supabase project on 2026-08-22 (Supabase migration
-- `20260822112412_auth_rate_limits`, per `Supabase:list_migrations`)
-- as part of BUILD_PLAN "STAGE — SIGN-IN RATE LIMITING", but the SQL
-- itself was never committed to this repo — only described in prose
-- in BUILD_PLAN's changelog. That's real infra/version-control drift:
-- infra/README.md's own stated principle is "no manual, undocumented
-- console changes to production infrastructure... the same PR review
-- and audit trail as application code," and a migration applied live
-- but absent from git fails that for any fresh clone, disaster-
-- recovery restore, or new environment (rate limiting would silently
-- no-op there, since `checkSignInLockout`/`checkSignInIpLockout` fail
-- open on an RPC-does-not-exist error).
--
-- The table/function definitions below were pulled directly from the
-- live project via read-only introspection (`information_schema`,
-- `pg_proc`) to guarantee this file matches production exactly,
-- rather than being reconstructed from BUILD_PLAN's prose description
-- alone. Written as `create table if not exists` / `create or replace
-- function` so it is safe to run again against the same database this
-- was already applied to (no-op) as well as against a fresh one.
--
-- Sliding window: 5 failures within 15 minutes locks the account for
-- 15 minutes (see `record_failed_signin_attempt`'s defaults). Per
-- email only, not per IP — that's `0009`.

create table if not exists public.auth_rate_limits (
  email text primary key,
  failed_attempts integer not null default 0,
  window_started_at timestamptz not null default now(),
  locked_until timestamptz
);

-- RLS on, zero policies: service-role access only, same trust
-- boundary every other identity table in this app already uses. The
-- three `security definer` functions below are the only sanctioned
-- way anything ever reads or writes this table.
alter table public.auth_rate_limits enable row level security;

comment on table public.auth_rate_limits is
  'Per-email sign-in failure tracking for account lockout (BUILD_PLAN "STAGE — SIGN-IN RATE LIMITING"). Service-role access only via is_signin_locked/record_failed_signin_attempt/record_successful_signin. See docs/security/auth-threat-model.md.';

create or replace function public.is_signin_locked(p_email text)
returns table(locked boolean, locked_until timestamptz)
language sql
stable security definer
set search_path to 'public'
as $$
  select
    (auth_rate_limits.locked_until is not null and auth_rate_limits.locked_until > now()) as locked,
    auth_rate_limits.locked_until
  from public.auth_rate_limits
  where email = p_email
  union all
  select false, null::timestamptz
  where not exists (select 1 from public.auth_rate_limits where email = p_email)
  limit 1;
$$;

create or replace function public.record_failed_signin_attempt(
  p_email text,
  p_max_attempts integer default 5,
  p_window_minutes integer default 15,
  p_lockout_minutes integer default 15
)
returns auth_rate_limits
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_row public.auth_rate_limits;
begin
  insert into public.auth_rate_limits (email, failed_attempts, window_started_at)
  values (p_email, 1, now())
  on conflict (email) do update
  set
    failed_attempts = case
      when public.auth_rate_limits.window_started_at < now() - make_interval(mins => p_window_minutes)
        then 1
      else public.auth_rate_limits.failed_attempts + 1
    end,
    window_started_at = case
      when public.auth_rate_limits.window_started_at < now() - make_interval(mins => p_window_minutes)
        then now()
      else public.auth_rate_limits.window_started_at
    end
  returning * into v_row;

  if v_row.failed_attempts >= p_max_attempts then
    update public.auth_rate_limits
    set locked_until = now() + make_interval(mins => p_lockout_minutes)
    where email = p_email
    returning * into v_row;
  end if;

  return v_row;
end;
$$;

create or replace function public.record_successful_signin(p_email text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  delete from public.auth_rate_limits where email = p_email;
end;
$$;

-- Least-privilege hardening, applied alongside this backfill (found
-- during a repo-wide security audit): Postgres grants EXECUTE on new
-- functions to PUBLIC by default, so `anon`/`authenticated` could call
-- these directly via Supabase's REST RPC endpoint given only the
-- project's anon key — e.g. `record_successful_signin` to clear a
-- real lockout mid-attack, or `record_failed_signin_attempt` to lock
-- out an arbitrary victim account. This app's own code never needs
-- that: `SupabaseAuthService` calls these exclusively via the
-- service-role client (see its constructor). Revoking closes the gap
-- between the stated intent ("service-role access only, same trust
-- boundary every other identity table already uses") and what the
-- default grants actually allowed.
revoke execute on function public.is_signin_locked(text) from public, anon, authenticated;
revoke execute on function public.record_failed_signin_attempt(text, integer, integer, integer) from public, anon, authenticated;
revoke execute on function public.record_successful_signin(text) from public, anon, authenticated;
