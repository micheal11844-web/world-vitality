import { Skeleton } from "../components/Skeleton.js";

/**
 * The "modern loading screen" ask, built with what the app already
 * has rather than an unverified third-party library: no framework
 * that auto-reads an app's CSS and generates matching skeletons was
 * found to actually exist under the name given ("Boneframer") or the
 * behavior described. This achieves the same real goal — an
 * Instagram-style shimmer skeleton shaped like the real layout, not a
 * spinner — by reusing `Skeleton`, `packages/ui-components`' own
 * shimmer primitive, and the exact same `--wv-*` design tokens (`14rem`
 * sidebar width from `Sidebar.tsx`, `--wv-space-*`/`--wv-radius-*` from
 * `theme.css`) every other component in this app already draws from.
 * It's guaranteed to match the app's real theme (including dark mode,
 * automatically, since `Skeleton` already uses theme-aware color
 * tokens) because it's built from the same source, not a copy of it —
 * and it introduces zero new dependencies or unknown-library risk,
 * worth stating plainly given this app has already had one real
 * production incident from adopting an unfamiliar library sight-unseen
 * (the 3D Orbi/`react-reconciler` crash).
 *
 * Shaped to roughly match `AppShell` (`Sidebar` + header + content
 * area) specifically so it "preserve[s] layout stability," the same
 * stated purpose `Skeleton`'s own doc comment already gives for
 * skeleton loaders generally — not because every pixel needs to match,
 * but because a loading screen that doesn't visually shift once the
 * real page mounts is the actual point of a skeleton over a spinner.
 *
 * Used via `app/dashboard/loading.tsx` and `app/workspaces/loading.tsx`
 * — Next.js App Router's own built-in mechanism for "what to show while
 * this route segment is loading," which is also why this needed no new
 * routing logic of its own.
 */
export function AppShellSkeleton() {
  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "var(--wv-bg)" }}>
      <div
        style={{
          width: "14rem",
          flexShrink: 0,
          borderRight: "1px solid var(--wv-border)",
          padding: "var(--wv-space-lg) var(--wv-space-md)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--wv-space-lg)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--wv-space-sm)" }}>
          <Skeleton width="1.75rem" height="1.75rem" circle />
          <Skeleton width="6rem" height="1rem" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--wv-space-sm)" }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} height="1.75rem" />
          ))}
        </div>
      </div>

      <div style={{ flex: 1, padding: "var(--wv-space-lg)", overflow: "hidden" }}>
        <Skeleton width="12rem" height="1.75rem" />
        <div style={{ height: "var(--wv-space-lg)" }} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(16rem, 1fr))",
            gap: "var(--wv-space-md)",
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                border: "1px solid var(--wv-border)",
                borderRadius: "var(--wv-radius-md)",
                padding: "var(--wv-space-md)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--wv-space-sm)",
              }}
            >
              <Skeleton width="60%" height="1.1rem" />
              <Skeleton height="4rem" />
              <Skeleton width="40%" height="0.9rem" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
