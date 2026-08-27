-- Real, previously-undiscovered gap, found and closed while building
-- BUILD_PLAN "STAGE — TEAM/INVITE UI": `profiles` has had zero rows in
-- the live project this entire time (verified directly — 0 rows
-- against 1 real `auth.users` row) because no trigger has ever existed
-- to populate it on signup. `AccountService.getProfile()` (Stage 3.3)
-- has therefore been silently broken for every real signup since it
-- was written — nothing exercised it against live data until
-- `listWorkspaceMembers`'s new join did, here, for the first time.
--
-- Fixes it at the root (a trigger, so every future signup — magic
-- link, password, Google OAuth, or an accepted team invite — populates
-- `profiles` automatically) plus a one-time backfill for the single
-- existing real user, rather than only patching the symptom
-- (`listWorkspaceMembers`'s "(no profile found)" fallback stays as
-- defense in depth, but should no longer actually trigger for real
-- users after this).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, display_name, created_at)
  values (new.id, new.email, new.raw_user_meta_data ->> 'display_name', now())
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- One-time backfill for any real user created before this trigger
-- existed (verified live: exactly one such user in this project today).
insert into public.profiles (user_id, email, display_name, created_at)
select id, email, raw_user_meta_data ->> 'display_name', created_at
from auth.users
where id not in (select user_id from public.profiles)
on conflict (user_id) do nothing;
