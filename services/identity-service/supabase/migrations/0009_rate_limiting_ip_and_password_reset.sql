-- BACKFILL, not a new change — same situation as `0008_auth_rate_limits.sql`:
-- applied directly to the live Supabase project on 2026-08-22
-- (Supabase migration `20260822212758_rate_limiting_ip_and_password_reset`,
-- per `Supabase:list_migrations`) as part of BUILD_PLAN "STAGE — PER-IP
-- SIGN-IN LOCKOUT + PASSWORD-RESET RATE LIMITING", but never committed
-- to this repo. See `0008`'s doc comment for why that's a real gap,
-- not a cosmetic one. Definitions below pulled directly from the live
-- project via read-only introspection.
--
-- Two independent mechanisms:
-- - Per-IP sign-in lockout: 20 failures within 15 minutes locks an IP
--   for 15 minutes — deliberately higher than the per-email threshold
--   (`0008`), since one IP can represent many real users behind
--   NAT/a shared network. No "clear on success" function, unlike the
--   per-email table: a successful sign-in from one account on a
--   shared IP doesn't prove that IP is safe, so the sliding window's
--   natural decay is the only reset mechanism, on purpose.
-- - Password-reset request cooldown: 3 requests per email per 15
--   minutes — a volume cooldown, not a lockout (a reset request has
--   no "wrong password" outcome to distinguish), enforced identically
--   whether or not the email belongs to a real account so it never
--   leaks account existence.

create table if not exists public.auth_signin_ip_rate_limits (
  ip_address text primary key,
  failed_attempts integer not null default 0,
  window_started_at timestamptz not null default now(),
  locked_until timestamptz
);

alter table public.auth_signin_ip_rate_limits enable row level security;

comment on table public.auth_signin_ip_rate_limits is
  'Per-IP sign-in failure tracking (BUILD_PLAN "STAGE — PER-IP SIGN-IN LOCKOUT + PASSWORD-RESET RATE LIMITING"). Service-role access only via is_signin_ip_locked/record_failed_signin_attempt_ip. See docs/security/auth-threat-model.md.';

create table if not exists public.auth_password_reset_requests (
  email text primary key,
  request_count integer not null default 0,
  window_started_at timestamptz not null default now()
);

alter table public.auth_password_reset_requests enable row level security;

comment on table public.auth_password_reset_requests is
  'Per-email password-reset request cooldown (same stage as auth_signin_ip_rate_limits). Service-role access only via record_password_reset_request.';

create or replace function public.is_signin_ip_locked(p_ip text)
returns table(locked boolean, locked_until timestamptz)
language sql
stable security definer
set search_path to 'public'
as $$
  select
    (auth_signin_ip_rate_limits.locked_until is not null and auth_signin_ip_rate_limits.locked_until > now()) as locked,
    auth_signin_ip_rate_limits.locked_until
  from public.auth_signin_ip_rate_limits
  where ip_address = p_ip
  union all
  select false, null::timestamptz
  where not exists (select 1 from public.auth_signin_ip_rate_limits where ip_address = p_ip)
  limit 1;
$$;

create or replace function public.record_failed_signin_attempt_ip(
  p_ip text,
  p_max_attempts integer default 20,
  p_window_minutes integer default 15,
  p_lockout_minutes integer default 15
)
returns auth_signin_ip_rate_limits
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_row public.auth_signin_ip_rate_limits;
begin
  insert into public.auth_signin_ip_rate_limits (ip_address, failed_attempts, window_started_at)
  values (p_ip, 1, now())
  on conflict (ip_address) do update
  set
    failed_attempts = case
      when public.auth_signin_ip_rate_limits.window_started_at < now() - make_interval(mins => p_window_minutes)
        then 1
      else public.auth_signin_ip_rate_limits.failed_attempts + 1
    end,
    window_started_at = case
      when public.auth_signin_ip_rate_limits.window_started_at < now() - make_interval(mins => p_window_minutes)
        then now()
      else public.auth_signin_ip_rate_limits.window_started_at
    end
  returning * into v_row;

  if v_row.failed_attempts >= p_max_attempts then
    update public.auth_signin_ip_rate_limits
    set locked_until = now() + make_interval(mins => p_lockout_minutes)
    where ip_address = p_ip
    returning * into v_row;
  end if;

  return v_row;
end;
$$;

create or replace function public.record_password_reset_request(
  p_email text,
  p_max_requests integer default 3,
  p_window_minutes integer default 15
)
returns table(allowed boolean, request_count integer)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_row public.auth_password_reset_requests;
begin
  insert into public.auth_password_reset_requests (email, request_count, window_started_at)
  values (p_email, 1, now())
  on conflict (email) do update
  set
    request_count = case
      when public.auth_password_reset_requests.window_started_at < now() - make_interval(mins => p_window_minutes)
        then 1
      else public.auth_password_reset_requests.request_count + 1
    end,
    window_started_at = case
      when public.auth_password_reset_requests.window_started_at < now() - make_interval(mins => p_window_minutes)
        then now()
      else public.auth_password_reset_requests.window_started_at
    end
  returning * into v_row;

  return query select (v_row.request_count <= p_max_requests) as allowed, v_row.request_count;
end;
$$;

-- Same least-privilege hardening as `0008` — see that migration's
-- comment for the full reasoning. These three functions have the same
-- "service-role only" stated intent that default PUBLIC grants
-- silently didn't enforce.
revoke execute on function public.is_signin_ip_locked(text) from public, anon, authenticated;
revoke execute on function public.record_failed_signin_attempt_ip(text, integer, integer, integer) from public, anon, authenticated;
revoke execute on function public.record_password_reset_request(text, integer, integer) from public, anon, authenticated;
