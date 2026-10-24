import type { ButtonHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a calm inline loading indicator and disables the button —
   *  per Section 13, "calm, informative... never a generic spinner
   *  where feasible"; this is the one exception (a button mid-action
   *  has no more specific state to show) but stays understated. */
  loading?: boolean;
  children: ReactNode;
}

const VARIANT_STYLE: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: "var(--wv-color-accent-500)",
    color: "var(--wv-color-neutral-50)",
    border: "1px solid transparent",
  },
  secondary: {
    backgroundColor: "transparent",
    color: "var(--wv-text-primary)",
    border: "1px solid var(--wv-border)",
  },
  ghost: {
    backgroundColor: "transparent",
    color: "var(--wv-text-primary)",
    border: "1px solid transparent",
  },
  destructive: {
    backgroundColor: "var(--wv-color-critical-500)",
    color: "var(--wv-color-neutral-50)",
    border: "1px solid transparent",
  },
};

// minHeight/minWidth: 2.75rem (44px) on every size, per Experience
// Blueprint Section 15 ("generous touch/click target sizes... no
// interactions that require precise, fast, or sustained gestures").
// `sm`'s padding alone computed to ~31px tall — under the accepted
// 44px minimum (WCAG 2.5.5, Apple HIG, Material Design) — a real gap
// found during the Stage 7 accessibility pass, not a hypothetical one.
const SIZE_STYLE: Record<ButtonSize, React.CSSProperties> = {
  sm: {
    padding: "0.375rem 0.75rem",
    fontSize: "0.8125rem",
    minHeight: "2.75rem",
    minWidth: "2.75rem",
  },
  md: { padding: "0.625rem 1.125rem", fontSize: "1rem", minHeight: "2.75rem", minWidth: "2.75rem" },
};

/**
 * The one look every button-shaped control shares. `Button` uses it for
 * real buttons, `ButtonLink` for links that navigate, and pages that must
 * keep a framework link component (Next's `Link`) can spread it into their
 * own `style`. Keeping this in one place is what stops a "Change" link and
 * a "Remove" button sitting side by side at two different sizes — the
 * mismatch that made some desktop buttons look odd.
 *
 * Links also get `textDecoration: "none"`, which is a no-op on a button.
 */
export function buttonStyle(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  inactive = false,
): React.CSSProperties {
  return {
    boxSizing: "border-box",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "var(--wv-space-xs)",
    fontFamily: "var(--wv-font-sans)",
    fontWeight: 500,
    lineHeight: 1.25,
    textDecoration: "none",
    borderRadius: "var(--wv-radius-sm)",
    cursor: inactive ? "not-allowed" : "pointer",
    opacity: inactive ? 0.6 : 1,
    transition: "opacity 0.15s ease",
    ...VARIANT_STYLE[variant],
    ...SIZE_STYLE[size],
  };
}

/**
 * Base Button (BUILD_PLAN ticket 5.2). Every other interactive component
 * in this package that needs a button (Modal's close/confirm actions,
 * etc.) uses this one, per Section 13: "Cards, buttons, inputs... all
 * follow the same underlying visual grammar."
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading = false, disabled, children, style, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      style={{
        ...buttonStyle(variant, size, disabled || loading),
        ...style,
      }}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden="true"
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            border: "2px solid currentColor",
            borderTopColor: "transparent",
            display: "inline-block",
            animation: "wv-spin 0.8s linear infinite",
          }}
        />
      )}
      {children}
    </button>
  );
});
