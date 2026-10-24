"use client";

import { useId, type ReactNode, type SelectHTMLAttributes } from "react";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  children: ReactNode;
}

/**
 * A labelled native `<select>` that matches `Input` — same label style,
 * border, padding and 44px minimum height — so a form that mixes text
 * fields, dropdowns and buttons lines up instead of showing a tall button
 * beside a short dropdown. It stays a native element on purpose: it is
 * accessible and works on every phone and keyboard with no extra code.
 */
export function Select({ label, id, style, children, ...rest }: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--wv-space-xs)" }}>
      <label
        htmlFor={selectId}
        style={{
          fontFamily: "var(--wv-font-sans)",
          fontSize: "0.8125rem",
          color: "var(--wv-text-primary)",
        }}
      >
        {label}
      </label>
      <select
        id={selectId}
        style={{
          boxSizing: "border-box",
          minHeight: "2.75rem",
          fontFamily: "var(--wv-font-sans)",
          fontSize: "1rem",
          padding: "0.625rem 0.75rem",
          borderRadius: "var(--wv-radius-sm)",
          border: "1px solid var(--wv-border)",
          backgroundColor: "var(--wv-surface)",
          color: "var(--wv-text-primary)",
          ...style,
        }}
        {...rest}
      >
        {children}
      </select>
    </div>
  );
}
