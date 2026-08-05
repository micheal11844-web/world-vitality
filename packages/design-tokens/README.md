# packages/design-tokens

Color, typography, and spacing tokens (BUILD_PLAN Stage 5, ticket 5.1),
per Experience Blueprint Section 13. Single source of truth — no
component should hardcode a color, font size, or spacing value.

## What's here

- **`colors.ts`** — `neutralLight`/`neutralDark` (the dominant canvas),
  `accentLight`/`accentDark` (informational/brand meaning),
  `criticalLight`/`criticalDark` (warning/critical states, exclusively —
  never decorative). Exactly two accent families, per Section 13's
  explicit restraint principle.
- **`typography.ts`** — system-font stack, a deliberately small
  `fontSize` scale (6 semantic sizes, not a numeric 1–10), weights, line
  heights.
- **`spacing.ts`** — a generous default `space` scale plus an opt-in
  `spaceCompact` variant for the "earned density" case (Research/
  Insurance data-dense views) — never the default.
- **`theme.css`** — the same values as real CSS custom properties, for
  both light and dark mode (ticket 5.3), switchable via `[data-theme]`
  with an OS-level `prefers-color-scheme` fallback.
- **`__tests__/contrast.test.ts`** — actually computes WCAG 2.1 relative
  luminance and contrast ratios for every primary text/background pairing
  in both themes. All 10 checks pass. This isn't a claim in a comment —
  it's a real, runnable calculation against the real hex values, so a
  future color change that breaks contrast fails CI instead of shipping.

## Design decisions, flagged as reversible

- **Two accent families only** (`accent`, `critical`) — Section 13 is
  explicit that color is a "trustworthy, consistent signal system," so a
  third ad-hoc family wasn't added even where it might have been
  tempting (e.g. for confidence levels — see
  `packages/ui-components/README.md` for how that was resolved instead).
- **System font stack**, not a named/licensed typeface — no typeface was
  specified in any source doc. Every component should reference
  `fontFamily.sans`, never a hardcoded font name, so swapping this later
  touches one file.
- **Dark mode is a fully separate token set**, not a CSS filter/invert —
  per Section 13's explicit requirement that it be "designed with the
  same rigor... not a simple color inversion." Verified by the contrast
  tests running against dark-theme values independently, not derived
  from light-theme math.
