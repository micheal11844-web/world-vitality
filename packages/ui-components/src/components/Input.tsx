"use client";

import type { InputHTMLAttributes } from "react";
import { useId } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** Honest, plain-language error text (Section 13: "honest,
   *  plain-language, blame-free") — never a raw validation code. */
  error?: string;
  helperText?: string;
}

/**
 * Text input with a mandatory associated `<label>` and proper `aria-
 * describedby` wiring for helper/error text — accessibility "from the
 * start, not a later audit pass" (Section 13) means `label` isn't
 * optional on this component's props, unlike most UI libraries.
 */
export function Input({ label, error, helperText, id, style, ...rest }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--wv-space-xs)" }}>
      <label
        htmlFor={inputId}
        style={{
          fontFamily: "var(--wv-font-sans)",
          fontSize: "0.8125rem",
          color: "var(--wv-text-primary)",
        }}
      >
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? errorId : helperText ? helperId : undefined}
        style={{
          fontFamily: "var(--wv-font-sans)",
          fontSize: "1rem",
          padding: "0.625rem 0.75rem",
          borderRadius: "var(--wv-radius-sm)",
          border: `1px solid ${error ? "var(--wv-color-critical-500)" : "var(--wv-border)"}`,
          backgroundColor: "var(--wv-surface)",
          color: "var(--wv-text-primary)",
          ...style,
        }}
        {...rest}
      />
      {error && (
        <span
          id={errorId}
          role="alert"
          style={{ fontSize: "0.8125rem", color: "var(--wv-color-critical-500)" }}
        >
          {error}
        </span>
      )}
      {!error && helperText && (
        <span id={helperId} style={{ fontSize: "0.8125rem", color: "var(--wv-text-secondary)" }}>
          {helperText}
        </span>
      )}
    </div>
  );
}
