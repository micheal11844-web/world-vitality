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
