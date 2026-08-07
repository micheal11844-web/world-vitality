# services/identity-service

Authentication, permissions, and account settings foundation (BUILD_PLAN
Stage 3).

## What's here

- **`AuthService.ts`** — magic-link authentication contract (ticket 3.1).
- **`SupabaseAuthService.ts`** — Supabase Auth-backed implementation.
- **`roles.ts`** — the core permission-role model (ticket 3.2): `Role`,
  `Permission`, `ROLE_PERMISSIONS`, and `can()`.
- **`account.ts`** — account settings contract + Supabase implementation
  (ticket 3.3): profile, workspace memberships, data export, account
  deletion.
- **`supabase/migrations/0001_identity_foundation.sql`** — the Postgres
  schema this all runs against: `profiles`, `workspace_members`,
  `data_export_requests`, with Row Level Security policies.
- **`.env.example`** — required environment variables, documented with no
  actual values.
- **`__tests__/roles.test.ts`** — full coverage of the permission matrix.
  Run via `pnpm run test` from the repo root.

## Backend choice

Supabase (Postgres + built-in magic-link auth), chosen over rolling a
custom Postgres + email-provider + token-signing stack — no database or
auth vendor was specified anywhere in the source docs, so this was
confirmed directly rather than assumed. Fastest path to a working,
reasonably secure auth flow without hand-rolling token security.

## Status — what's real vs. what's scaffolding

- **`roles.ts`** is fully implemented and tested — pure logic, no external
  dependency, verified with real passing tests.
- **`SupabaseAuthService` and `SupabaseAccountService`** are written
  directly against Supabase's documented client API (not guessed), but
  **have not been run against a live Supabase project** — none has been
  provisioned yet. That's an account-level step (see
  `docs/onboarding/repository-setup.md`), not a code change. Treat these
  two files as unverified until exercised against a real project.
- **Data export (`requestDataExport`)** only records the request and
  returns `pending` — it does not assemble a real export of the user's
  data from `data-ingestion` or `interpretation-engine`. Per ADR-0002,
  identity-service can't reach into those services directly; a real
  cross-service export job is future work, out of scope for this
  foundational ticket.
- **`scoped_field_user`'s** intended "scoped to specific data" meaning
  isn't modeled yet — today it just has a smaller permission _set_, not
  resource-level scoping. See the doc comment on `Role` in `roles.ts`.

## Documentation gap, flagged not fixed

BUILD_PLAN ticket 3.2 cites "PRD Section C.2" for the permission-role
model. Section C.2 is actually the Third-Party Workspace Marketplace — the
four role names (`Admin/Owner`, `Operational User`, `Scoped/Field User`,
`Viewer/External`) appear exactly once, in passing, in Section C's
introduction. No detailed permission matrix exists in any source doc.
`ROLE_PERMISSIONS` in `roles.ts` is this implementation's own
interpretation of what each role name implies — worth a product review,
not a transcription of a spec.
