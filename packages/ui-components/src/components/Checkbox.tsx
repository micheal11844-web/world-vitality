"use client";

import type { InputHTMLAttributes } from "react";
import { useId } from "react";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

/**
 * A custom-styled checkbox, matching design tokens instead of the raw
 * browser default. Built after a real, concrete finding: an unstyled
 * native `<input type="checkbox">` (used for Remember Me on the login
 * page before this) reads as visibly "off-brand" next to every other
 * custom-styled control on the page — a small but real detail research
 * on login-page polish flagged as part of why the page didn't look
 * like a normal, finished app.
 *
 * Visually hides the native input (not `display: none` — that would
 * break keyboard focus and screen readers) and draws a custom box, per
 * the standard accessible-custom-checkbox pattern: the real `<input>`
 * still exists, still receives focus/keyboard input/screen-reader
 * announcement, just isn't the thing rendered on screen. Needs no
 * custom focus-ring CSS: the input is positioned exactly over the
 * visible box, so this design system's existing global `:focus-visible`
 * rule (theme.css) already draws its ring in the right place with zero
 * extra code.
 */
export function Checkbox({ label, id, ...rest }: CheckboxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <label
      htmlFor={inputId}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--wv-space-xs)",
        fontSize: "0.875rem",
        color: "var(--wv-text-secondary)",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      <span style={{ position: "relative", display: "inline-flex", width: 18, height: 18 }}>
        <input
          id={inputId}
          type="checkbox"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            margin: 0,
            opacity: 0,
            cursor: "pointer",
          }}
          {...rest}
        />
        <span
          aria-hidden="true"
          style={{
            width: 18,
            height: 18,
            borderRadius: "4px",
            border: rest.checked ? "1px solid var(--wv-accent)" : "1px solid var(--wv-border)",
            backgroundColor: rest.checked ? "var(--wv-accent)" : "var(--wv-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 120ms ease, border-color 120ms ease",
            pointerEvents: "none",
          }}
        >
          {rest.checked && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 6l2.5 2.5L10 3"
                stroke="var(--wv-bg)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
      </span>
      {label}
    </label>
  );
}
