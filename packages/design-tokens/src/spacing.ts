/**
 * Spacing tokens (ticket 5.1), per Experience Blueprint Section 13:
 * "Generous, consistent spacing that reinforces calm and reduces visual
 * noise — density is earned only in data-dense professional views
 * (Research, Insurance portfolios), never imposed by default."
 *
 * Base-4 scale, named by relative size rather than raw pixel count so
 * components read intent ("space.lg between sections") not magic
 * numbers. `compact` exists specifically for the "earned density" case —
 * components should default to `space`, and only data-dense views
 * (tables in Research/Insurance workspaces) opt into `spaceCompact`.
 */
export const space = {
  xs: "0.25rem", // 4px
  sm: "0.5rem", // 8px
  md: "1rem", // 16px — default gap between related elements
  lg: "1.5rem", // 24px — default gap between distinct sections
  xl: "2.5rem", // 40px
  xxl: "4rem", // 64px — page-level top/bottom breathing room
} as const;

/**
 * Reduced-density variant for the specific, opt-in "data-dense
 * professional views" case — never the default.
 */
export const spaceCompact = {
  xs: "0.125rem", // 2px
  sm: "0.25rem", // 4px
  md: "0.5rem", // 8px
  lg: "0.75rem", // 12px
  xl: "1.25rem", // 20px
  xxl: "2rem", // 32px
} as const;

export const radius = {
  sm: "0.375rem", // 6px — inputs, buttons
  md: "0.625rem", // 10px — cards
  lg: "1rem", // 16px — modals, larger surfaces
  full: "9999px", // pills, avatars
} as const;

export type SpaceToken = keyof typeof space;
