# Stage 7 Review — Observability, Security, Accessibility

Findings from BUILD_PLAN Stage 7 (tickets 7.1–7.3), run against the repo as
of Stage 6's completion. This is the actual audit record — what was
checked, what was found, what was fixed immediately, and what's flagged
as real remaining work rather than silently considered "done."

## 7.1 — Logging (Engineering Blueprint Section 12)

**Built:** `apps/web/lib/logger.ts` — structured JSON logging with two
categories (`application`, `security`), per Section 12's requirement that
security events be logged separately from general application events.
Wired into the login/callback flow (`requestMagicLinkAction`, the
`/auth/callback` route), replacing raw `console.error` calls — including
one real, live bug this uncovered: the original code caught auth errors
and returned a generic message to the user _without logging the real
cause anywhere_, which is exactly what made the first production sign-in
failure (documented earlier in this project's history) undebuggable
until logging was added.

**Not built, flagged honestly:**

- **Correlation/trace IDs.** Section 12 wants one user action traceable
  across ingestion → interpretation → presentation. No service currently
  accepts or forwards a request ID. Real work — not a quick addition.
- **Monitoring dashboards and alerting.** No observability vendor
  (Sentry, Axiom, Vercel's own observability, etc.) has been chosen or
  confirmed with the project owner. Logs currently land in Vercel's
  built-in runtime log capture only — visible via dashboard/API, not a
  dashboard with thresholds or paging.
- **Audit logs** (immutable who-changed-what). No admin/config mutation
  surface exists yet to audit.

## 7.2 — Security (Engineering Blueprint Section 14)

**Checked and confirmed clean:**

- No `dangerouslySetInnerHTML`, `eval()`, or `new Function()` anywhere in
  our own source (grep-verified, scoped to exclude Next.js's own build
  output which does use these internally — that's Next's code, not
  ours).
- No hardcoded secrets or embedded API keys anywhere in source.
- No `.env` file (only `.env.example`) is tracked in git.
- The Supabase service-role key path (`apps/web/lib/auth.ts`) is
  imported by exactly two files — the login Server Action and the
  `/auth/callback` Route Handler — both server-only, neither marked
  `"use client"`. Verified by grep across every file that imports it, not
  assumed from the architecture alone.

**Fixed during this review, not just noted:**

- **Dependency vulnerabilities.** `pnpm audit` found **25 vulnerabilities
  (10 high)**, nearly all in Next.js 14.2.35 itself, patched in
  15.5.21+. Upgraded to Next.js 15.5.22 — reduced to **5 (3 high, 2
  moderate)**, all transitive dependencies bundled inside Next's own
  package (`postcss`, `sharp` — used for Next's build tooling and image
  optimization, not for processing user-supplied input in this app).
  These remain until Next.js ships its own patch; not independently
  fixable from here. Re-verified the full test suite and a real
  `next build` after the major-version upgrade — both still pass clean.
- **Missing security headers.** Added `X-Content-Type-Options`,
  `X-Frame-Options: DENY`, `Referrer-Policy`, and a restrictive
  `Permissions-Policy` (camera/microphone/geolocation all denied — none
  are used yet) in `apps/web/next.config.mjs`.

**Not built, flagged honestly:**

- **No Content-Security-Policy.** Components use inline `style={{...}}`
  throughout (see `packages/ui-components/README.md`'s design-decisions
  section), so a CSP strict enough to matter needs `style-src
'unsafe-inline'` at minimum — weak enough that it's better done
  properly later (nonce or hash-based) than added now as a token gesture.
- **No automated dependency-scanning in CI.** `pnpm audit` was run
  manually for this review; Section 14 wants it running on every build.
  Wiring `pnpm audit` (or a dedicated tool) into `.github/workflows/ci.yml`
  is real, small, undone work.
- **No incident-response runbook** (`docs/runbooks/`, per Section 14) —
  doesn't exist yet.
- **No formal threat model** for the identity/auth flow — Stage 3/6 were
  built and iteratively debugged against real production failures (see
  `services/identity-service/README.md` and the BUILD_PLAN changelog),
  which caught real bugs, but that's different from a deliberate
  upfront threat-modeling pass.

## 7.3 — Accessibility (Experience Blueprint Section 15)

Section 15 is broad — it covers features that don't exist yet (Disaster
Monitoring, Education workspace, offline mode). This audit only covers
what's actually built: Stage 5 components and the Stage 6 Agriculture
workspace. Claiming a full Section 15 pass would be dishonest; this is a
scoped pass against real, existing surface area.

**Already covered (built earlier, verified here):**

- WCAG AA contrast — real computed checks in
  `packages/design-tokens/src/__tests__/contrast.test.ts`, not a visual
  guess.
- Never color-alone signaling — `ConfidenceBadge`'s `insufficient-data`
  state uses a dashed-outline shape, not just a different color
  (tested).
- Modal: real focus trap, Tab/Shift+Tab wrapping, Escape-to-close, focus
  returns to the trigger on close (all tested, not just implemented).
- `Input` requires a label prop and wires `aria-describedby` for
  error/helper text.
- `Table` uses real `<th scope="col">`, not styled `<div>`s.
- `:focus-visible` is styled consistently everywhere via `theme.css`.

**Fixed during this review, not just noted:**

- **The map had no accessible description at all** — Section 15's own
  example is explicit: "a screen reader describing a map should convey
  the _finding_, not just 'image of a map.'" `MapView.tsx` now renders a
  visually-hidden but screen-reader-accessible description stating the
  actual soil-moisture finding, and the MapLibre canvas itself is marked
  `aria-hidden` since its rendering has no meaningful DOM structure to
  expose.
- **`Button`'s `sm` size computed to roughly 31px tall** — under the
  accepted 44px minimum touch target (WCAG 2.5.5, Apple HIG, Material
  Design), which is a direct violation of Section 15's motor-disability
  requirement ("generous touch/click target sizes"). Added a 44px
  `min-height`/`min-width` to every `Button` size.

**Not built, flagged honestly:**

- **MapView has zero automated test coverage.** MapLibre GL requires
  real WebGL/canvas support that jsdom (this repo's test environment)
  doesn't provide. The accessible-description fix above was verified by
  reading the rendered output during a real build, not by an automated
  test — a real gap versus everything else in this codebase, which has
  been test-verified throughout.
- **Text scaling under real browser zoom/OS font-size settings** hasn't
  been manually tested in an actual browser — components use `rem` units
  throughout (should scale correctly in principle), but "should scale"
  is not the same bar as "verified to scale."
- **Everything outside what's built** — low-vision high-contrast _mode_
  (as opposed to baseline contrast, which is covered), poor-internet
  graceful degradation, slow-device "essential mode," older-user text
  scaling options, children's/Education-workspace safeguards, and the
  entire Disaster Monitoring emergency-usability requirement. None of
  these have a surface to audit yet.
  ## Post-Stage-7 Follow-Up (Stage 8)

Recorded as an addendum rather than editing the audit above — the
original review stays an accurate record of what Stage 7 itself found,
per this project's own norm of not silently rewriting past findings.

- **eslint-config-next gap — closed.** `@next/eslint-plugin-next`'s
  flat-config `core-web-vitals` export wired into root
  `eslint.config.js`, scoped to `apps/web/**`. Verified with a clean
  repo-wide `pnpm run lint`.
- **No Content-Security-Policy — partially closed.** Added a
  `script-src 'self'`-focused CSP (see `apps/web/next.config.mjs`),
  which meaningfully blocks arbitrary injected-script execution — the
  primary XSS vector. `style-src` still includes `'unsafe-inline'`
  because of the inline-style pattern noted in the original review;
  the fully nonce/hash-based policy remains real, undone future work.
  Also flagged: the CSP's `connect-src` allowlist references a
  `<SUPABASE_PROJECT_REF>` placeholder that needs replacing with the
  real project ref before deploy, and the whole policy was written
  from static code inspection — verify against real browser CSP
  violation reports before trusting it fully in production.
- **No dependency-scanning in CI — closed, informationally.** Added a
  `dependency-audit` job to `.github/workflows/ci.yml` running `pnpm
audit --audit-level=high` on every push/PR. Set to
  `continue-on-error: true` for now because 3 known high-severity
  findings are currently pinned inside `next@15.5.22`'s own dependency
  tree with no available fix from this repo's side — see
  `docs/security/known-vulnerabilities.md` for the full record and why
  a `pnpm.overrides` force-fix was attempted and reverted (it destabilized
  ~300 unrelated lockfile lines). The job still surfaces every run, so a
  _new_ finding from a direct dependency won't be silently missed.
- **No incident-response runbook — closed.** Added
  `docs/runbooks/incident-response.md`, scoped honestly to what this
  project actually is right now (solo-maintained, no paging/on-call) —
  includes specific playbooks for the sign-in failure modes that have
  already happened for real on this project, not generic boilerplate.
- **No formal threat model for auth — closed.** Added
  `docs/security/auth-threat-model.md`, walking the actual magic-link
  flow's real threats (token replay, service-role-key exposure, the
  PKCE/token_hash confusion that already caused a real incident, the
  `scoped_field_user` data-scoping gap, and the no-re-auth deletion
  tradeoff). Explicitly not a scored STRIDE/DREAD exercise, and
  explicitly done retroactively rather than at design time — flagged
  as such rather than presented as if it happened earlier.
- **`scoped_field_user` resource-level scoping — still open, and
  correctly so.** Investigated rather than papered over: real
  resource-level (e.g., per-field) access control needs an actual
  sub-workspace resource to scope against, and none exists yet — the
  Agriculture workspace has no per-field data model, only
  workspace-wide data. Building scoping infrastructure with nothing
  real to scope to would be premature engineering, not a fix. This
  stays open until a second workspace or per-resource data model
  exists (both already on BUILD_PLAN's explicitly-deferred list) — see
  the threat model's threat #4 for why this matters once that happens.
