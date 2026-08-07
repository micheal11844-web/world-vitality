# Repository Setup — Actions Requiring GitHub/Vercel Account Access

Stage 0 of BUILD_PLAN.md includes two categories of setup that cannot be done
by committing files to the repo — they are account-level configuration on
GitHub and Vercel, and must be performed by someone with admin access to the
`world-vitality` GitHub org/repo and the connected Vercel account.

This doc is the checklist for that person. Once done, check off 0.1, 0.4,
and 0.5 in `BUILD_PLAN.md`.

## 0.1 — Initialize the GitHub repository

1. Create a new repository named `world-vitality` (private, under the
   World Vitality GitHub org).
2. Push this scaffold as the initial commit to `main`.

## 0.4 — Branch protection on `main`

In GitHub repo Settings → Branches → Branch protection rules, add a rule for
`main` with:

- [ ] Require a pull request before merging
- [ ] Require approvals: at least 1
- [ ] Require review from Code Owners (uses `.github/CODEOWNERS`, already in this repo)
- [ ] Require status checks to pass before merging (select the CI workflow(s)
      in `.github/workflows/` once they exist and have run at least once)
- [ ] Require branches to be up to date before merging
- [ ] Do not allow force pushes
- [ ] Do not allow deletions

`.github/CODEOWNERS` and `.github/PULL_REQUEST_TEMPLATE.md` are already
included in this scaffold — branch protection just needs to be turned on
against them.

## 0.5 — Connect to Vercel for auto-deploy-on-merge

1. In Vercel, "Add New Project" → import the `world-vitality` GitHub repo.
2. Set the project root / build settings once `apps/web` exists (Stage 6) —
   for Stage 0, the goal is only to confirm the pipeline works end-to-end,
   per the BUILD_PLAN 0.5 instruction: "confirm a trivial change (e.g.,
   README edit) triggers a successful deploy end-to-end before writing any
   application code." A minimal static placeholder page is enough to prove
   this; it does not need to be `apps/web` itself.
3. Confirm: GitHub → merge to `main` → Vercel deploy fires automatically,
   with no manual `vercel deploy` step, per BUILD_PLAN's operating constraint.
4. Treat the specific Vercel/Cloudflare/Firebase configuration in `infra/`
   as a replaceable implementation detail behind internal abstractions,
   per `infra/README.md` and the Experience/Engineering Blueprint
   recommendation — not a permanent architectural dependency.

## Stage 3 — Provision Supabase (identity-service)

`services/identity-service/` is written against Supabase but no project
has been provisioned yet. Someone with account access needs to:

1. Create a new Supabase project (https://supabase.com/dashboard).
2. In the SQL Editor, run
   `services/identity-service/supabase/migrations/0001_identity_foundation.sql`.
3. Under Authentication → Providers, confirm Email (magic link/OTP) is
   enabled — it is by default.
4. Under Authentication → URL Configuration, set the Site URL and add a
   Redirect URL matching whatever `SUPABASE_AUTH_REDIRECT_URL` will be
   (e.g. `https://<your-domain>/auth/callback`).
5. Copy the values from Project Settings → API into environment variables
   — do **not** commit these. Set them in Vercel (Project Settings →
   Environment Variables) for deployed environments, and in a local
   `.env.local` (already gitignored) for local development. See
   `services/identity-service/.env.example` for the exact variable names.
6. Once done, check off Stage 3 in `BUILD_PLAN.md` and update
   `services/identity-service/README.md`'s "Status" section — the
   `SupabaseAuthService`/`SupabaseAccountService` code has not been
   exercised against a real project yet; this is the step that would
   change that.

## Stage 6 — Point Vercel at `apps/web` (critical, required step)

Before Stage 6, Vercel was deploying a static placeholder from the repo
root (`public/index.html`), which no longer exists — it's been replaced
by the real Next.js app in `apps/web/`. **Vercel will not correctly build
or serve `apps/web` until its Root Directory setting is changed:**

1. In the Vercel dashboard, open the `world-vitality` project.
2. Go to Settings → General → Root Directory.
3. Set it to `apps/web` and save.
4. Trigger a redeploy (push a commit, or use "Redeploy" on the latest
   deployment). Vercel will auto-detect Next.js once Root Directory
   points at a folder containing a `package.json` with `next` as a
   dependency.
5. `apps/web/vercel.json` and `apps/web/package.json`'s `build` script
   together handle building the workspace's internal library packages
   (`packages/*`, `services/*`) before building the Next app itself —
   this repo has no Turborepo, so that sequencing is done by hand via
   `cd ../.. && pnpm run build && cd apps/web && next build`. If a
   future package is added that `apps/web` depends on, no extra wiring
   is needed — `pnpm run build` at the repo root already builds every
   package listed in the root `tsconfig.json`'s `references`.
6. `apps/web` also needs its own environment variables set in Vercel
   (Project Settings → Environment Variables) — the same three from the
   Stage 3 Supabase section above (`SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_AUTH_REDIRECT_URL`), since
   `apps/web/lib/auth.ts` reads them at request time to construct the
   identity-service client for the login/callback flow.
7. **Also required, easy to miss:** Supabase → Authentication → Emails →
   Templates → **Magic Link**. Replace the default template's link
   (which uses `{{ .ConfirmationURL }}`, Supabase's own hosted-redirect
   flow) with one that links directly to this app's callback route
   using `{{ .TokenHash }}`:

   ```html
   <h2>Sign in to World Vitality</h2>
   <p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email">Sign in</a></p>
   ```

   Without this, the email link never reaches `/auth/callback` with a
   `token_hash` it can verify — this app does not use Supabase's default
   PKCE `code` exchange at all (see `AuthService.verifyMagicLinkCallback`'s
   doc comment for the full reason: it structurally cannot work with a
   stateless Server Action that has no persisted `code_verifier`).
   `apps/web/lib/auth.ts` reads them at request time to construct the
   identity-service client for the login/callback flow.
