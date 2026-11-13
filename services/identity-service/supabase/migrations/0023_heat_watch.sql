-- Heat alerts near the places a person saved (BUILD_PLAN "v116", Decision #033).
--
-- When a satellite sees heat within 10 km of a place someone saved (their home
-- place, a field, an insured property or a monitored location) the app now adds
-- a notification to their inbox. It is neither an agency's alert ('official_alert')
-- nor a teammate's activity ('collaboration') nor a plan notice ('billing'): it is
-- a satellite heat detection, which is not a confirmed fire. It gets its own source
-- so that it can have its own on/off switch and is never mistaken for an official
-- alert.
--
-- Three small changes, all safe to run twice, none touching existing rows:
--
--  1. 'heat_watch' becomes an allowed `notifications.source` value.
--  2. `notification_settings.heat_watch_enabled`: the person's own switch. On by
--     default, so everyone with a saved place is covered; one tap turns it off.
--  3. `notification_settings.heat_synced_at`: when this person's places were last
--     checked (the re-check throttle, like `alerts_synced_at` for official alerts).
--
-- Until this is applied the app that reads these columns must not be live: the
-- code that needs them is held back on a branch and merged after this is applied
-- and read back.

alter table public.notifications
  drop constraint if exists notifications_source_check;

alter table public.notifications
  add constraint notifications_source_check
  check (source in ('official_alert', 'collaboration', 'billing', 'heat_watch'));

alter table public.notification_settings
  add column if not exists heat_watch_enabled boolean not null default true;

alter table public.notification_settings
  add column if not exists heat_synced_at timestamptz;
