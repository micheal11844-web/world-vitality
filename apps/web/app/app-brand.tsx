import Link from "next/link";
import Image from "next/image";

/**
 * App logo + name, shown in the header across every page that uses
 * `AppShell` — dashboard and all five workspaces. Clicking it returns
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
 * **The real logo** (BUILD_PLAN Stage 14 follow-up #3) — the owner's
 * own provided mark, `public/brand/world-vitality-mark.png`, cropped
 * from the full lockup (`world-vitality-logo.png`, used on the auth
 * illustration panel — see `AuthIllustration`'s doc comment) to just
 * the globe/leaf/ribbon icon, since the wordmark text is already
 * rendered separately right next to it here. Replaces the earlier
 * placeholder "WV" circular badge this component used before a real
 * asset existed.
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
      <Image
        src="/brand/world-vitality-mark.png"
        alt="World Vitality"
        width={900}
        height={560}
        style={{ height: "1.5rem", width: "auto", flexShrink: 0 }}
        priority
      />
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
