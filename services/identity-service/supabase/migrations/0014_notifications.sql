-- Notification Center (BUILD_PLAN "STAGE — NOTIFICATION CENTER", PRD B.6):
-- an in-app inbox with three severity tiers, plus per-user settings.
--
-- `notifications` holds what a person sees in the inbox. Two sources
-- exist today: official weather alerts relayed for the user's home place
-- (`official_alert`) and collaboration activity (`collaboration`).
-- There is no push/SMS/email channel — those need a vendor and a consent
-- decision (BUILD_PLAN records this as deliberately not built).
--
-- Why a table at all rather than computing alerts live: read/dismissed
-- state must survive, collaboration events have no live source to
-- recompute from, and a short history lets someone see what was
-- relayed while they weren't looking.
--
-- Tiers: 'critical' (life-safety; reserved visual language), 'alert',
-- 'info'. The tier is stored, not derived at read time, because the
-- agency classification it came from is only available at creation.
--
-- `dedupe_key` makes creation idempotent per user (e.g. `nws:<alert id>`
-- so re-checking the same active alert never duplicates it or resets
-- its read state). NULL keys are allowed and never collide.
--
-- `href` is an in-app path only (CHECK below) so a stored link can never
-- be an open redirect or a `javascript:` URL. `detail` is the full
-- official text for an alert, shown on expand.
--
-- Zero RLS policies on purpose — service-role access only, the same
-- trust boundary as `user_preferences`: notifications can name a user's
-- home area, and nothing needs a browser client to read them directly.
-- Cascades on account deletion like every other per-user table.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source text not null check (source in ('official_alert', 'collaboration')),
  tier text not null check (tier in ('critical', 'alert', 'info')),
  title text not null check (char_length(title) between 1 and 160),
  body text check (body is null or char_length(body) <= 400),
  detail text check (detail is null or char_length(detail) <= 4000),
  href text check (
    href is null
    or (char_length(href) <= 200 and href like '/%' and href not like '//%')
  ),
  dedupe_key text check (dedupe_key is null or char_length(dedupe_key) <= 200),
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  read_at timestamptz,
  dismissed_at timestamptz,
  constraint notifications_user_dedupe_key unique (user_id, dedupe_key)
);

create index if not exists notifications_user_recent_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

-- Per-user settings. Critical alerts are deliberately NOT a setting:
-- safety-critical notices can't be switched off. `official_min_tier`
-- only chooses whether informational official alerts are shown.
-- `alerts_synced_at` is the throttle for re-checking official alerts
-- (a re-check at most every few minutes, not on every page view).
create table if not exists public.notification_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  official_min_tier text not null default 'info' check (official_min_tier in ('info', 'alert')),
  collaboration_enabled boolean not null default true,
  alerts_synced_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.notification_settings enable row level security;
