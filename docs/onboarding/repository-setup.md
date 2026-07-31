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
