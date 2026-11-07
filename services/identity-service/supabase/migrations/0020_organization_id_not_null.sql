-- Make the organisation mandatory on saved items and roles (BUILD_PLAN "v105").
--
-- 0018 added `organization_id` to the three saved-item tables and to
-- `workspace_members`, and left it nullable on purpose: the previous release
-- was still live and inserted rows without it (the triggers in 0018 filled it
-- in). The new code has been running since, and every place it writes one of
-- these rows sets the column itself, so the safety margin can go:
--
--   * a saved item (field, insured property, monitored location) can no
--     longer exist without an owner organisation;
--   * a workspace role can no longer exist for someone who is not in the
--     organisation. Until now this rule had a hole: the composite foreign key
--     `workspace_members_org_member_fk` does not check a row whose
--     organization_id is null (the default foreign-key matching skips it), so a
--     role row with no organisation slipped past it. With the column
--     mandatory the foreign key applies to every row.
--
-- The fill-in triggers from 0018 stay. They run BEFORE the not-null check, so
-- an insert from older code that names `created_by` / `user_id` but no
-- organisation still gets one filled in rather than being refused.
--
-- SAFE TO APPLY WHILE THE APP IS LIVE. The tables are tiny, the statement
-- takes its lock for a moment, and nothing the app does inserts a row without
-- an organisation (every insert in `organization-data.ts` sets it).
--
-- ALL OR NOTHING. First it checks that no row lacks an organisation. The only
-- rows it ever removes are saved items with NO organisation AND NO creator:
-- the demo rows seeded by 0006, 0011 and 0012. On a database that has accounts,
-- 0018 already handed those to the first account's organisation, so there is
-- nothing to remove; on a brand-new database with no accounts they have no
-- owner and the application never shows them (a row with no organisation is
-- invisible to it). If any other row still lacks an organisation (a role for
-- someone in no organisation, or an item whose creator is in none), the script
-- stops with a message that says how many, and NOTHING is changed, including
-- the removal above (the check is one statement).
--
-- Safe to run twice.

do $$
declare
  v_fields int;
  v_properties int;
  v_locations int;
  v_roles int;
begin
  delete from public.fields where organization_id is null and created_by is null;
  delete from public.insurance_properties where organization_id is null and created_by is null;
  delete from public.government_ngos_locations where organization_id is null and created_by is null;

  select count(*) into v_fields from public.fields where organization_id is null;
  select count(*) into v_properties
    from public.insurance_properties where organization_id is null;
  select count(*) into v_locations
    from public.government_ngos_locations where organization_id is null;
  select count(*) into v_roles from public.workspace_members where organization_id is null;

  if v_fields + v_properties + v_locations + v_roles > 0 then
    raise exception
      'Cannot make organization_id mandatory yet: % field(s), % insured propert(ies), % monitored location(s) and % workspace role(s) have no organisation. Assign each one to an organisation (or delete it) and run this again. Nothing was changed.',
      v_fields, v_properties, v_locations, v_roles;
  end if;
end
$$;

alter table public.fields alter column organization_id set not null;
alter table public.insurance_properties alter column organization_id set not null;
alter table public.government_ngos_locations alter column organization_id set not null;
alter table public.workspace_members alter column organization_id set not null;

comment on column public.workspace_members.organization_id is
  'The organisation this role belongs to. Mandatory, and must be an organisation the user is a member of (composite foreign key). Older code that omits it gets it filled in from the person''s membership by a trigger before this check.';
