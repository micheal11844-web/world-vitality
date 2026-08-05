# packages/ui-components

Shared design-system components (Engineering Blueprint Section 4.5: "built
once... consumed everywhere — no per-app duplication"). React + Next.js
(confirmed with the project owner — no frontend framework was specified in
source docs).

## What's here

**Confidence (Stage 4, ticket 4.3 → real component in 5.2):**

- `confidence.ts` — the framework-agnostic display logic (label,
  description, color token, severity).
- `components/ConfidenceBadge.tsx` — the real component wrapping it.

**Core components (ticket 5.2):**

- `Button`, `Card`, `Text` (the full type scale as one component),
  `Input` (mandatory label + error/helper `aria-describedby` wiring),
  `Modal` (portal-rendered, focus-trapped, Escape-to-close, focus
  returns on close), `Table` (real `<th scope="col">`, not styled
  `<div>`s), `Skeleton`, `StateDisplay` (the shared Empty/Loading/Error/
  Success pattern).

**App shell (ticket 5.4):**

- `layout/Header.tsx`, `layout/Sidebar.tsx`, `layout/AIPanel.tsx` — the
  three wireframe pieces from Experience Blueprint Section 4.
- `layout/AppShell.tsx` — composes them into the exact Header / Sidebar /
  Main / AI-Panel structure the wireframe specifies. AI Panel collapses
  to a slim rail (not hidden space) so Main Content genuinely reclaims
  the width, per Section 4's explicit "never the reverse" constraint.

**Tests:** 63 passing, using `@testing-library/react` + jsdom (set up in
`tools/dom-test-setup.mjs` at the repo root, wired into `pnpm run test`
via `node --import`). Real rendering and interaction tests — Modal's
focus trap, Tab/Shift+Tab wrapping, and focus-return-on-close are all
genuinely exercised, not just typed against an interface.

## Deliberately not React (until now)

Confidence started framework-agnostic (Stage 4) because no framework had
been chosen. Now that React + Next.js is confirmed, `ConfidenceBadge` is
a real component; `confidence.ts`'s pure logic stays as the single source
of truth underneath it.

## Design decisions, flagged as reversible

- **Plain inline styles referencing CSS custom properties** (`var(--wv-
...)`), not Tailwind or CSS-in-JS — neither was specified in source
  docs. This works in any bundler with zero config, respects runtime
  theme switching via `[data-theme]`, and is trivial to migrate off of
  later since every value already routes through named tokens.
- **`colorToken` semantics avoid the `critical` family for low
  confidence** (see `design-tokens/README.md`) — Experience Blueprint
  Section 10 is explicit that uncertainty is not an error state.
- **Never color-alone signaling** (Section 13) — `ConfidenceBadge`'s
  `insufficient-data` state uses a dashed-outline dot shape, not just a
  different color, verified by a real test.

## Not yet built

- No Storybook or visual regression tooling — components are verified by
  behavior/accessibility tests, not visual snapshots.
- `packages/design-tokens` doesn't have icon tokens yet; the few icons
  used here (`StateDisplay`) are inline SVG, not a shared icon set.
- Search, notifications, and profile menu (Header's `actions` slot) are
  unbuilt — Stage 6+, once there's real data to wire them to.
