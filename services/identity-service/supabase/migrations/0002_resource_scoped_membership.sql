-- Adds resource-level scoping capability to workspace_members, closing
-- the mechanism gap flagged in services/identity-service/src/roles.ts
-- for scoped_field_user. See that file's module doc comment for full
-- context: this column exists ahead of any product surface that
-- populates it — nullable, defaulting to null (workspace-wide access,
-- unchanged from before this migration) for every existing and new row
-- until a real sub-workspace resource type exists to reference.

alter table public.workspace_members
  add column if not exists scoped_resource_ids uuid[];

comment on column public.workspace_members.scoped_resource_ids is
  'Optional resource-level access restriction (see services/identity-service/src/roles.ts ResourceScopeContext). Null = workspace-wide access. No product surface writes a non-null value here yet — added ahead of the resource type it will eventually constrain, per ADR-0003''s interfaces-before-implementations ordering.';
