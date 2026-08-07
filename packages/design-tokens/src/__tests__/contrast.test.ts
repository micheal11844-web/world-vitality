import { test } from "node:test";
import assert from "node:assert/strict";
import { lightTheme, darkTheme } from "../colors.js";

/**
 * Real WCAG 2.1 contrast-ratio computation (relative luminance formula,
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance) — not a claim,
 * an actual calculation run against the real token hex values. Section
 * 13's "sufficient contrast... treated as core visual design constraints
 * from the start" is meaningless as a comment; this is what makes it
 * real.
 */
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const [rl, gl, bl] = [channel(r), channel(g), channel(b)];
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexToRgb(hexA));
  const lB = relativeLuminance(hexToRgb(hexB));
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

const WCAG_AA_BODY_TEXT = 4.5;
const WCAG_AA_LARGE_TEXT = 3.0;

// Real background values used in theme.css (--wv-bg / --wv-surface).
const LIGHT_BG = "#fbfaf7";
const LIGHT_SURFACE = "#ffffff";
const DARK_BG = "#14171a";
const DARK_SURFACE = "#1c2024";

test("light theme: primary text on bg meets WCAG AA for body text", () => {
  const ratio = contrastRatio(lightTheme.neutral[900], LIGHT_BG);
  assert.ok(ratio >= WCAG_AA_BODY_TEXT, `contrast ${ratio.toFixed(2)} < ${WCAG_AA_BODY_TEXT}`);
});

test("light theme: secondary text on bg meets WCAG AA for body text", () => {
  const ratio = contrastRatio(lightTheme.neutral[600], LIGHT_BG);
  assert.ok(ratio >= WCAG_AA_BODY_TEXT, `contrast ${ratio.toFixed(2)} < ${WCAG_AA_BODY_TEXT}`);
});

test("light theme: primary text on surface meets WCAG AA", () => {
  const ratio = contrastRatio(lightTheme.neutral[900], LIGHT_SURFACE);
  assert.ok(ratio >= WCAG_AA_BODY_TEXT, `contrast ${ratio.toFixed(2)} < ${WCAG_AA_BODY_TEXT}`);
});

test("light theme: accent-500 on bg meets at least WCAG AA large-text (used for links/icons at bodyLarge+)", () => {
  const ratio = contrastRatio(lightTheme.accent[500], LIGHT_BG);
  assert.ok(ratio >= WCAG_AA_LARGE_TEXT, `contrast ${ratio.toFixed(2)} < ${WCAG_AA_LARGE_TEXT}`);
});

test("light theme: critical-500 on bg meets at least WCAG AA large-text", () => {
  const ratio = contrastRatio(lightTheme.critical[500], LIGHT_BG);
  assert.ok(ratio >= WCAG_AA_LARGE_TEXT, `contrast ${ratio.toFixed(2)} < ${WCAG_AA_LARGE_TEXT}`);
});

test("dark theme: primary text on bg meets WCAG AA for body text", () => {
  const ratio = contrastRatio(darkTheme.neutral[900], DARK_BG);
  assert.ok(ratio >= WCAG_AA_BODY_TEXT, `contrast ${ratio.toFixed(2)} < ${WCAG_AA_BODY_TEXT}`);
});

test("dark theme: secondary text on bg meets WCAG AA for body text", () => {
  const ratio = contrastRatio(darkTheme.neutral[600], DARK_BG);
  assert.ok(ratio >= WCAG_AA_BODY_TEXT, `contrast ${ratio.toFixed(2)} < ${WCAG_AA_BODY_TEXT}`);
});

test("dark theme: primary text on surface meets WCAG AA", () => {
  const ratio = contrastRatio(darkTheme.neutral[900], DARK_SURFACE);
  assert.ok(ratio >= WCAG_AA_BODY_TEXT, `contrast ${ratio.toFixed(2)} < ${WCAG_AA_BODY_TEXT}`);
});

test("dark theme: accent-500 on bg meets at least WCAG AA large-text", () => {
  const ratio = contrastRatio(darkTheme.accent[500], DARK_BG);
  assert.ok(ratio >= WCAG_AA_LARGE_TEXT, `contrast ${ratio.toFixed(2)} < ${WCAG_AA_LARGE_TEXT}`);
});

test("dark theme: critical-500 on bg meets at least WCAG AA large-text", () => {
  const ratio = contrastRatio(darkTheme.critical[500], DARK_BG);
  assert.ok(ratio >= WCAG_AA_LARGE_TEXT, `contrast ${ratio.toFixed(2)} < ${WCAG_AA_LARGE_TEXT}`);
});
