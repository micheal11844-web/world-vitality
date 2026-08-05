import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Reduced padding for the "earned density" case (Section 13) —
   *  data-dense professional views only, never the default. */
  compact?: boolean;
}

/** Shared surface container (ticket 5.2) — restrained elevation, per
 *  Section 13: "a restrained, subtle system of layering... rather than
 *  heavy, decorative shadows." */
export function Card({ children, compact = false, style, ...rest }: CardProps) {
  return (
    <div
      style={{
        backgroundColor: "var(--wv-surface)",
        border: "1px solid var(--wv-border)",
        borderRadius: "var(--wv-radius-md)",
        padding: compact ? "var(--wv-space-sm)" : "var(--wv-space-lg)",
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
