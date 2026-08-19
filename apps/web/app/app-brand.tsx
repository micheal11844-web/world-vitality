import Link from "next/link";

/**
 * App logo + name, shown in the header across every page that uses
 * `AppShell` — dashboard and all four workspaces. Clicking it returns
 * to `/dashboard` (BUILD_PLAN Stage 13 follow-up: "have a placeholder
 * for the app logo with the app name beside it ... make it so that
 * when the name is clicked it brings us back to the homepage").
 *
 * Replaces what each workspace shell used to pass as its own `brand`
 * (its own name, e.g. "Construction", not clickable) — that per-page
 * identity now lives in each page's own `<Text variant="pageTitle">`
 * heading instead, which is where a page's own name belongs; the
 * header brand slot is app-level chrome, not page content, so it
 * should be the same everywhere rather than changing per workspace.
 *
 * The mark itself is a **placeholder** — a plain circular badge with
 * "WV" — since no real logo asset exists yet. Stated plainly rather
 * than dressed up as a finished mark.
 */
export function AppBrand() {
  return (
    <Link
      href="/dashboard"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--wv-space-sm)",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "1.75rem",
          height: "1.75rem",
          borderRadius: "50%",
          backgroundColor: "var(--wv-color-accent-500)",
          color: "var(--wv-color-neutral-50)",
          fontSize: "0.75rem",
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        WV
      </span>
      <span
        style={{
          fontFamily: "var(--wv-font-sans)",
          fontSize: "1rem",
          fontWeight: 600,
          color: "var(--wv-text-primary)",
        }}
      >
        World Vitality
      </span>
    </Link>
  );
}
