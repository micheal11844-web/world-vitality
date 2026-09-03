-- Field comment editing/deletion (BUILD_PLAN "STAGE — AGRICULTURE
-- FIELD COMMENTS FOLLOW-UP: EDIT/DELETE"), closing the gap
-- 0007_field_comments.sql's own doc comment named explicitly ("comment
-- editing/deletion is a real, explicitly-deferred gap") — same
-- incremental pattern as `fields` itself (0006 → its own edit/delete
-- follow-up).
--
-- No RLS/policy change needed: writes to `field_comments` have only
-- ever gone through the service-role client (see 0007's own comment —
-- "writes go through the service-role client only, application-gated
-- by can()"), which bypasses RLS entirely regardless of which SQL
-- operation is issued. The only thing missing was the application-
-- layer method and the schema to track an edit.
--
-- `updated_at` starts NULL (never edited) and is set only when a
-- comment is actually edited — distinguishing "never touched" from
-- "edited but happens to match created_at," however unlikely the
-- latter is in practice.

alter table public.field_comments
  add column if not exists updated_at timestamptz;

comment on column public.field_comments.updated_at is
  'NULL until the comment is edited via AccountService.updateFieldComment(); set to the edit time thereafter. Comment ownership (only the original author may edit/delete their own comment) is enforced by AccountService.updateFieldComment/deleteFieldComment via a WHERE user_id = <requester> clause on the write itself, not by a database constraint.';
