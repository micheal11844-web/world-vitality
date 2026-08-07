/**
 * Color tokens (BUILD_PLAN ticket 5.1), per Experience Blueprint Section
 * 13's color philosophy: "deep, quiet neutrals as the dominant canvas...
 * a restrained, purposeful accent palette reserved specifically for
 * meaning: one consistent hue family for informational states, a
 * distinct family reserved exclusively for warning/critical states...
 * never used decoratively for critical-meaning colors."
 *
 * Two accent families exist, and exactly two:
 * - `accent` (teal-green) — informational / primary brand meaning.
 * - `critical` (amber-red) — reserved *exclusively* for warning/critical
 *   states (destructive actions, error states, critical alerts). Never
 *   used decoratively.
 *
 * Confidence levels (Stage 4, `packages/ui-components`'s `ConfidenceBadge`)
 * deliberately do NOT borrow from `critical` — low confidence is not an
 * error state (Experience Blueprint Section 10). They use `accent` and
 * plain `neutral` shades instead — see `ConfidenceBadge`'s own comments.
 *
 * Values are real, chosen hex colors — not verified against a formal
 * brand guideline (none exists in the source docs) — but contrast
 * ratios below are checked against WCAG AA (4.5:1 for body text) via
 * the test suite, per Section 13's "sufficient contrast... treated as
 * core visual design constraints from the start."
 */

export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

export const neutralLight: ColorScale = {
  50: "#fbfaf7",
  100: "#f3f1eb",
  200: "#e5e2da",
  300: "#cfccc2",
  400: "#a8a89e",
  500: "#7d7d73",
  600: "#5b6660",
  700: "#454f4a",
  800: "#2b332f",
  900: "#1f2320",
};

export const neutralDark: ColorScale = {
  50: "#14171a",
  100: "#1c2024",
  200: "#262b2f",
  300: "#343b3f",
  400: "#4a5257",
  500: "#6b7570",
  600: "#8f948d",
  700: "#b3b6ae",
  800: "#d6d5cd",
  900: "#eceae4",
};

export const accentLight: ColorScale = {
  50: "#e9f5ef",
  100: "#c9e6d8",
  200: "#a0d4bf",
  300: "#6fbd9f",
  400: "#3f9f7e",
  500: "#1d6e56",
  600: "#175a46",
  700: "#124737",
  800: "#0d3427",
  900: "#082218",
};

export const accentDark: ColorScale = {
  50: "#0e2a21",
  100: "#153c30",
  200: "#1e5240",
  300: "#2c7057",
  400: "#409675",
  500: "#5dcaa5",
  600: "#7fd8bb",
  700: "#a3e5cf",
  800: "#c7f1e2",
  900: "#e5f9f1",
};

export const criticalLight: ColorScale = {
  50: "#fdf1ec",
  100: "#fadbcb",
  200: "#f3b494",
  300: "#e88a5e",
  400: "#d4652f",
  500: "#b3401f",
  600: "#8f3218",
  700: "#6b2512",
  800: "#4a190c",
  900: "#2e0f07",
};

export const criticalDark: ColorScale = {
  50: "#2e150c",
  100: "#4a2013",
  200: "#6f3220",
  300: "#9a4a2e",
  400: "#c2643f",
  500: "#e08858",
  600: "#eba57d",
  700: "#f2c1a2",
  800: "#f8dcc6",
  900: "#fcedde",
};

export interface Theme {
  neutral: ColorScale;
  accent: ColorScale;
  critical: ColorScale;
}

export const lightTheme: Theme = {
  neutral: neutralLight,
  accent: accentLight,
  critical: criticalLight,
};
export const darkTheme: Theme = {
  neutral: neutralDark,
  accent: accentDark,
  critical: criticalDark,
};
