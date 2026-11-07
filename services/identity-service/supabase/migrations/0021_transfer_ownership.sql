-- Hand an organisation to another member (BUILD_PLAN "v105").
--
-- An organisation has exactly one owner (0018). Until now nothing could change
-- who it is, which left one owner with no way out: an owner cannot delete
-- their account while other people are in the organisation, and could not
-- give the organisation to someone else either. This is the missing step.
--
-- WHAT A TRANSFER DOES, all in one statement so a crash or a race can never
-- leave an organisation with no owner or two:
--   * the new owner is an existing MEMBER of the organisation (a person
--     outside it, or the owner themselves, is refused);
--   * `organizations.owner_id` and the two `organization_members` roles swap;
--   * the new owner is `admin_owner` everywhere without role rows (0018), so
--     the role rows they had are removed rather than left to clutter the list;
--   * the PREVIOUS owner stays in the organisation as an `admin_owner` in the
--     workspaces the app names (`p_keep_workspaces`), so handing over is never
--     a lock-out: they keep working, and the new owner can remove them from
--     the Team page like anyone else. They are no longer the owner, so they
--     can now delete their account without taking the organisation with it.
--
-- WHAT IT DOES NOT DO. The organisation's plan is its owner's plan
-- (billing_subscriptions, keyed by user), and a subscription does not move
-- between people. The application therefore refuses a transfer while the
-- current owner's plan is in effect (this function knows nothing about
-- billing); once it has ended the organisation is on whatever plan the new
-- owner has.
--
-- Returns:
--   'transferred'  done
--   'not_found'    no such organisation
--   'not_owner'    p_from_user_id is not its owner (nothing changed)
--   'same_person'  the new owner is the current owner
--   'not_member'   the new owner is not a member of this organisation
--
-- Service-role only, like 0018's functions. The caller supplies who is acting
-- (the signed-in session's own id, never a value from the browser); the owner
-- check here makes a wrong caller harmless, not just rejected.

create or replace function public.transfer_organization_ownership(
  p_organization_id uuid,
  p_from_user_id uuid,
  p_to_user_id uuid,
  p_keep_workspaces text[] default '{}'
)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_owner uuid;
begin
  -- Serialise with joins and other transfers on the same organisation.
  select o.owner_id into v_owner
  from public.organizations o
  where o.id = p_organization_id
  for update;
  if not found then
    return 'not_found';
  end if;

  if v_owner is distinct from p_from_user_id then
    return 'not_owner';
  end if;
  if p_to_user_id = p_from_user_id then
    return 'same_person';
  end if;

  perform 1
  from public.organization_members m
  where m.organization_id = p_organization_id
    and m.user_id = p_to_user_id
    and m.role = 'member';
  if not found then
    return 'not_member';
  end if;

  -- Order matters: there is a unique index on "one owner per organisation".
  update public.organization_members
  set role = 'member'
  where organization_id = p_organization_id and user_id = p_from_user_id;

  update public.organization_members
  set role = 'owner'
  where organization_id = p_organization_id and user_id = p_to_user_id;

  update public.organizations
  set owner_id = p_to_user_id
  where id = p_organization_id;

  -- The owner is admin everywhere without role rows; theirs would only clutter.
  delete from public.workspace_members
  where organization_id = p_organization_id and user_id = p_to_user_id;

  -- The previous owner keeps working, as an admin, where the app says so.
  insert into public.workspace_members
    (organization_id, workspace_id, user_id, role, scoped_resource_ids)
  select p_organization_id, w, p_from_user_id, 'admin_owner', null
  from unnest(coalesce(p_keep_workspaces, '{}'::text[])) as w
  on conflict (workspace_id, user_id)
  do update set role = 'admin_owner', scoped_resource_ids = null,
                organization_id = excluded.organization_id;

  return 'transferred';
end;
$$;

revoke all on function public.transfer_organization_ownership(uuid, uuid, uuid, text[])
  from public, anon, authenticated;
grant execute on function public.transfer_organization_ownership(uuid, uuid, uuid, text[])
  to service_role;

comment on function public.transfer_organization_ownership(uuid, uuid, uuid, text[]) is
  'Hands an organisation to another of its members, atomically. The previous owner stays as admin_owner in p_keep_workspaces. Does not move a subscription — the application refuses while the current owner''s plan is in effect. Service-role only.';
