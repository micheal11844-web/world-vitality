-- Per-user preferences, starting with Adaptive Onboarding (BUILD_PLAN
-- "STAGE — ADAPTIVE ONBOARDING", PRD B.1): who the user is here as (a
-- "persona") and the one place they care about most (a "home place").
-- The Home Dashboard and the location-driven workspaces read the home
-- place instead of the old hard-coded demo coordinates.
--
-- Deliberately its own table rather than more columns on `profiles`:
-- `profiles` is identity (email, display name) and its RLS lets a user
-- read/update their own row directly; preferences are application
-- state that only server code touches, and later stages add to them
-- (language, notification settings) without re-touching `profiles`.
--
-- Zero RLS policies on purpose — service-role access only, the same
-- stricter trust boundary `insurance_properties` and
-- `government_ngos_locations` use. A home place is personal location
-- data; nothing needs a browser client to read it directly, and
-- "no policy" cannot be loosened by accident.
--
-- `onboarded_at` is set when the person finishes OR skips onboarding,
-- so a skip is remembered and they're never asked twice. `persona` and
-- the home place stay NULL after a skip. Persona ids are validated in
-- application code (they are product content and will grow), not by a
-- CHECK constraint that would need a migration for each new one.
--
-- Cascades on account deletion (references auth.users ... on delete
-- cascade), like every other per-user table.

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  persona text check (persona is null or char_length(persona) <= 40),
  home_name text check (home_name is null or char_length(home_name) <= 120),
  home_region text check (home_region is null or char_length(home_region) <= 120),
  home_country text check (home_country is null or char_length(home_country) <= 120),
  home_latitude double precision check (home_latitude is null or home_latitude between -90 and 90),
  home_longitude double precision check (home_longitude is null or home_longitude between -180 and 180),
  onboarded_at timestamptz,
  updated_at timestamptz not null default now(),
  -- A home place is all-or-nothing: a name without coordinates (or the
  -- reverse) can't be shown or fetched for.
  constraint user_preferences_home_place_complete check (
    (home_name is null and home_latitude is null and home_longitude is null)
    or (home_name is not null and home_latitude is not null and home_longitude is not null)
  )
);

alter table public.user_preferences enable row level security;
