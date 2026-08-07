export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  /** Pill/circle shape, for avatars — otherwise a rounded rectangle. */
  circle?: boolean;
}

/**
 * Skeleton loader (ticket 5.2) — "used for content-heavy views... to
 * preserve layout stability and perceived speed" (Section 13). A calm
 * shimmer, not a spinner — respects `prefers-reduced-motion` globally
 * via `theme.css`.
 */
export function Skeleton({ width = "100%", height = "1rem", circle = false }: SkeletonProps) {
  return (
    <span
      role="presentation"
      aria-hidden="true"
      style={{
        display: "inline-block",
        width,
        height,
        borderRadius: circle ? "var(--wv-radius-full)" : "var(--wv-radius-sm)",
        backgroundImage:
          "linear-gradient(90deg, var(--wv-color-neutral-100) 25%, var(--wv-color-neutral-200) 50%, var(--wv-color-neutral-100) 75%)",
        backgroundSize: "200% 100%",
        animation: "wv-shimmer 1.6s ease-in-out infinite",
      }}
    />
  );
}
