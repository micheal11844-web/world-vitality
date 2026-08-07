/**
 * Typography tokens (ticket 5.1), per Experience Blueprint Section 13:
 * "a clean, highly legible typeface family prioritizing readability at
 * small sizes and in bright outdoor/mobile-field conditions... a clear,
 * limited type scale (few sizes, used consistently) rather than an
 * expansive, inconsistent hierarchy."
 *
 * System-font stack (no specific typeface was named in any source doc —
 * this is a deliberate, reversible choice, not an assumption presented
 * as settled): loads instantly, no FOUT/FOIT, and every platform's
 * default system font is itself tuned for on-device legibility, which
 * directly serves the "bright outdoor/field conditions" requirement.
 * Swap for a licensed typeface later without touching any component,
 * since everything references `fontFamily`, never a hardcoded name.
 */
export const fontFamily = {
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
} as const;

/**
 * Deliberately few sizes. Named semantically (what it's for), not by
 * numeric scale, so a component's intent stays legible in code review —
 * "sectionTitle" vs. "lg".
 */
export const fontSize = {
  caption: "0.8125rem", // 13px — metadata, timestamps, helper text
  body: "1rem", // 16px — default body copy, never smaller for primary reading content
  bodyLarge: "1.125rem", // 18px — emphasized body copy, lead paragraphs
  sectionTitle: "1.375rem", // 22px — card/section headings
  pageTitle: "1.75rem", // 28px — page-level headings
  display: "2.25rem", // 36px — hero/landing-only
} as const;

export const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
} as const;

/** Unitless, per CSS best practice — scales correctly with the
 *  element's own font-size rather than compounding rem calculations. */
export const lineHeight = {
  tight: 1.25, // headings
  normal: 1.5, // body copy
  relaxed: 1.7, // long-form reading content
} as const;

export type FontSizeToken = keyof typeof fontSize;
