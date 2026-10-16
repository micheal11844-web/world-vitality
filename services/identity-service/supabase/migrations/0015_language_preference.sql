-- Multi-language support (BUILD_PLAN "STAGE — MULTI-LANGUAGE", PRD B.11).
--
-- 1. `user_preferences.language`: the language a person chose for
--    menus and messages, so the choice follows them across devices.
--    NULL = never chosen (the app then uses the browser's
--    Accept-Language, then English).
--
--    Validated in application code against the supported-language list,
--    not by a CHECK on specific codes: the list is product content and
--    will grow, and a migration per language would be churn — the same
--    reasoning `persona` uses. The length check is only a backstop.
--
-- 2. `notifications.message_key` / `message_params`: collaboration
--    notifications ("Ada commented on North Field", "You now have
--    access to Agriculture") are written once but read in whatever
--    language the person has chosen by the time they open the inbox.
--    So they store *what happened* (a short internal id plus its
--    parameters) and the app renders the sentence in the reader's
--    language; `title`/`body` keep the English rendering as the
--    fallback. Official weather alerts leave both NULL on purpose:
--    their text is the agency's own and is never re-worded or
--    machine-translated (an altered emergency message is worse than an
--    untranslated one).

alter table public.user_preferences
  add column if not exists language text
  check (language is null or char_length(language) between 2 and 10);

alter table public.notifications
  add column if not exists message_key text
  check (message_key is null or char_length(message_key) <= 60);

alter table public.notifications
  add column if not exists message_params jsonb
  check (message_params is null or jsonb_typeof(message_params) = 'object');
