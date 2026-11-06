-- A third source for notifications: "billing" (BUILD_PLAN "v105").
--
-- Until now a notification was either an agency's alert ('official_alert')
-- or a teammate's activity ('collaboration'). The app now also tells the
-- owner when a subscription renewal fails ("Your payment didn't go through"),
-- which is neither: a collaboration setting must not be able to switch it
-- off, and it is not an agency's word. It gets its own source.
--
-- Only the allowed values change. Existing rows are untouched, the other two
-- sources behave exactly as before, and the statement is safe to run twice.
-- Until it is applied the app keeps working: writing a billing notice just
-- fails on the old constraint, is logged, and the webhook still answers 200
-- (the notice is a courtesy that follows a successful webhook, never part
-- of it).

alter table public.notifications
  drop constraint if exists notifications_source_check;

alter table public.notifications
  add constraint notifications_source_check
  check (source in ('official_alert', 'collaboration', 'billing'));
