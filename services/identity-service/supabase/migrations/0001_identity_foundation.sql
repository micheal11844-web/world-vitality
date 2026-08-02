-- Identity & Access foundation (BUILD_PLAN Stage 3).
-- Run against a Supabase project's SQL editor, or via the Supabase CLI's
-- migration tooling once one is set up. Not yet applied to any real
-- project — no Supabase project has been provisioned for this repo yet.

-- One row per authenticated user, extending Supabase's built-in
-- auth.users with the profile fields this app needs.
create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz not null default now()
);

-- A user's role within a specific workspace. Roles are workspace-scoped
-- (see services/identity-service/src/roles.ts) — the same user can hold
-- different roles in different workspaces.
create table if not exists public.workspace_members (
  workspace_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (
    role in ('admin_owner', 'operational_user', 'scoped_field_user', 'viewer_external')
  ),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

-- Tracks data export requests (Constitution Section 2, Principle 5:
-- "Data export... must be as easy as sign-up"). Actual export file
-- assembly is a separate job/process not defined by this migration —
-- see the doc comment on DataExportRequest in account.ts.
create table if not exists public.data_export_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'ready', 'failed')),
  download_url text,
  requested_at timestamptz not null default now()
);

-- Row Level Security: on by default for any table holding user data,
-- per Constitution Section 11 (Privacy Principles) and Engineering
-- Blueprint security defaults. Policies here are intentionally minimal
-- (a user can read/write their own rows) — extend per-workspace policies
-- once workspace_members has real query patterns to design against.
alter table public.profiles enable row level security;
alter table public.workspace_members enable row level security;
alter table public.data_export_requests enable row level security;

create policy "Users can view their own profile" on public.profiles
  for select using (auth.uid() = user_id);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = user_id);

create policy "Users can view their own workspace memberships" on public.workspace_members
  for select using (auth.uid() = user_id);

create policy "Users can view their own export requests" on public.data_export_requests
  for select using (auth.uid() = user_id);

create policy "Users can create their own export requests" on public.data_export_requests
  for insert with check (auth.uid() = user_id);
