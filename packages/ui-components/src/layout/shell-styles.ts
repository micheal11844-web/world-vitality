/**
 * The responsive rules for the app shell (`AppShell`, `AppShellSkeleton`).
 *
 * Every other style in this package is an inline `style` prop, and an
 * inline style cannot carry a media query — so the handful of rules that
 * have to change with the screen width live here, as one stylesheet the
 * shell renders itself. It is plain CSS rendered on the server with the
 * page, so there is no "desktop layout flashes, then snaps to the phone
 * layout" moment of the kind a JavaScript breakpoint hook would cause.
 *
 * Three layouts, by viewport width (in `rem`, so a person who has raised
 * their browser's text size gets the roomier layout sooner, which is what
 * they want):
 *
 * - **Wide (above 64rem)** — exactly the original shell: header, sidebar,
 *   content, docked AI panel. Nothing here applies.
 * - **Medium (up to 64rem)** — tablets and narrow windows. The layout
 *   stays, but an open AI panel floats over the content instead of
 *   squeezing it: 22rem of panel beside a 14rem sidebar leaves a phone's
 *   worth of width for the page itself.
 * - **Compact (up to 48rem)** — phones (Experience Blueprint §16): a
 *   compact header with a menu button, the sidebar becomes a drawer that
 *   slides in from the reading-start edge, the four most-used places move
 *   to a thumb-reach bottom bar, and the AI panel becomes a bottom sheet.
 *
 * Rules that must beat a component's inline style use `!important` — the
 * only way a stylesheet can. They are confined to the class names below,
 * which only this package's components carry.
 *
 * Properties are logical (`inset-inline-*`, `border-inline-*`) so the
 * layouts mirror correctly in right-to-left languages; the one physical
 * quantity, which way the drawer slides off-screen, comes from the
 * `--wv-shell-off` variable the shell sets from the page's direction.
 *
 * Nothing in this file may use the `screen` media type: the jsdom test
 * environment applies `@media screen` rules, and the point of keeping the
 * compact-only controls hidden by default is that tests render the
 * desktop layout.
 */

/** Phones and below. Mirrors `COMPACT_QUERY` in `AppShell`. */
export const COMPACT_MAX_WIDTH = "48rem";
/** Tablets and below, where an open AI panel overlays instead of docking. */
export const MEDIUM_MAX_WIDTH = "64rem";

export const SHELL_CSS = `
.wv-shell-root {
  height: 100vh;
  height: 100dvh;
  --wv-shell-header-h: 3.5rem;
  --wv-shell-nav-h: calc(3.5rem + 1px); /* the bar's tabs plus its top border */
}
.wv-shell-main { padding: var(--wv-space-lg); }

/* Compact-only controls: hidden unless the compact layout switches them on. */
.wv-shell-menu-btn,
.wv-shell-search-btn,
.wv-shell-drawer-head,
.wv-shell-drawer-foot,
.wv-shell-bottomnav,
.wv-shell-scrim,
.wv-ai-sheet-glyph { display: none; }

.wv-shell-search { display: contents; }
/* The sheet is focused by script when it opens; a ring around the whole panel adds nothing. */
.wv-shell-ai aside:focus-visible { outline: none; }

.wv-shell-iconbtn {
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  padding: 0;
  border: 1px solid transparent;
  border-radius: var(--wv-radius-sm);
  background: transparent;
  color: var(--wv-text-primary);
  cursor: pointer;
  flex-shrink: 0;
}
.wv-shell-iconbtn:hover { background: var(--wv-bg); }

.wv-drawer-link {
  display: flex;
  align-items: center;
  gap: var(--wv-space-sm);
  min-height: 2.75rem;
  padding: 0 var(--wv-space-md);
  border: 0;
  border-radius: var(--wv-radius-sm);
  background: transparent;
  color: var(--wv-text-primary);
  font: inherit;
  font-size: 0.9375rem;
  text-decoration: none;
  cursor: pointer;
  width: 100%;
  box-sizing: border-box;
  text-align: start;
}
.wv-drawer-link:hover { background: var(--wv-bg); }

.wv-bottomnav-tab {
  position: relative;
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.125rem;
  box-sizing: border-box;
  min-height: 3.5rem;
  padding: 0.25rem 0.125rem;
  border: 0;
  background: transparent;
  color: var(--wv-text-secondary);
  font-family: var(--wv-font-sans);
  font-size: 0.75rem;
  line-height: 1.2;
  text-decoration: none;
  cursor: pointer;
}
.wv-bottomnav-tab > span:last-child {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.wv-bottomnav-tab[aria-current="page"],
.wv-bottomnav-tab[aria-pressed="true"] { color: var(--wv-color-accent-700); font-weight: 600; }
.wv-bottomnav-tab[aria-current="page"]::before,
.wv-bottomnav-tab[aria-pressed="true"]::before {
  content: "";
  position: absolute;
  top: 0;
  inset-inline: 25%;
  height: 0.1875rem;
  border-radius: 0 0 0.25rem 0.25rem;
  background: var(--wv-accent);
}

/* ---- Medium: an open AI panel floats over the page ---- */
@media (max-width: ${MEDIUM_MAX_WIDTH}) {
  .wv-shell-ai aside {
    position: fixed !important;
    inset-block-start: var(--wv-shell-header-h);
    inset-block-end: 0;
    inset-inline-end: 0;
    width: min(22rem, 100vw) !important;
    z-index: 40;
    box-shadow: 0 0 2rem rgba(0, 0, 0, 0.25);
  }
  .wv-shell-scrim--ai {
    display: block;
    position: fixed;
    top: var(--wv-shell-header-h);
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 39;
    background: rgba(0, 0, 0, 0.35);
  }
  /* Header labels stay on one line; the search box (which may shrink) gives
     up the width instead of "View the Globe" and "Sign out" wrapping in two. */
  .wv-shell-header a,
  .wv-shell-header button,
  .wv-shell-brand span { white-space: nowrap; }
  /* Before the script has decided (see AppShell), a panel the page opens
     by default stays out of sight rather than flashing over the content. */
  .wv-shell-root[data-mounted="false"] .wv-shell-ai aside,
  .wv-shell-root[data-mounted="false"] .wv-shell-scrim--ai { display: none !important; }
}

/* ---- Compact: the phone layout ---- */
@media (max-width: ${COMPACT_MAX_WIDTH}) {
  .wv-shell-main { padding: var(--wv-space-md); }

  /* Anything a text field needs at 16px or iOS zooms the page on focus. */
  .wv-shell-main input,
  .wv-shell-main select,
  .wv-shell-main textarea,
  .wv-shell-search input { font-size: 1rem !important; }

  .wv-shell-header {
    position: relative;
    padding: 0 var(--wv-space-sm) !important;
    gap: var(--wv-space-sm);
  }
  .wv-shell-brand { min-width: 0; gap: var(--wv-space-xs) !important; }
  .wv-shell-actions { gap: var(--wv-space-xs) !important; }
  .wv-shell-menu-btn,
  .wv-shell-search-btn { display: inline-flex; }
  .wv-desktop-only { display: none !important; }

  /* Search: a row that drops under the header when the magnifier is tapped. */
  .wv-shell-search { display: none; }
  .wv-shell-search[data-open="true"] {
    display: block;
    position: absolute;
    top: 100%;
    right: 0;
    left: 0;
    z-index: 35;
    padding: var(--wv-space-sm);
    border-bottom: 1px solid var(--wv-border);
    background: var(--wv-surface);
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.12);
  }
  .wv-shell-search > div { max-width: none !important; min-width: 0 !important; }
  .wv-shell-search input { padding: 0.625rem 0.75rem !important; }

  /* Sidebar: an off-canvas drawer from the reading-start edge. */
  .wv-shell-drawer {
    position: fixed;
    top: 0;
    bottom: 0;
    inset-inline-start: 0;
    width: min(85vw, 20rem);
    z-index: 50;
    flex-direction: column !important;
    background: var(--wv-surface);
    box-shadow: 0 0 2.5rem rgba(0, 0, 0, 0.3);
    transform: translateX(calc(var(--wv-shell-off, -1) * 100%));
    visibility: hidden;
    transition: transform 0.2s ease, visibility 0s linear 0.2s;
  }
  .wv-shell-drawer[data-open="true"] {
    transform: none;
    visibility: visible;
    transition-delay: 0s;
  }
  .wv-shell-drawer nav {
    flex: 1 1 auto;
    width: 100% !important;
    border-inline-end: 0 !important;
    box-sizing: border-box;
  }
  .wv-shell-drawer nav a { min-height: 2.75rem; }
  .wv-shell-drawer nav button[aria-expanded] { width: 2.75rem !important; height: 2.75rem !important; }
  .wv-sidebar-toggle { display: none !important; }
  .wv-shell-drawer-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--wv-space-xs) var(--wv-space-md);
    padding-inline: var(--wv-space-md) var(--wv-space-sm);
    border-bottom: 1px solid var(--wv-border);
    font-family: var(--wv-font-sans);
    font-weight: 600;
  }
  .wv-shell-drawer-foot {
    display: flex;
    flex-direction: column;
    gap: var(--wv-space-xs);
    padding: var(--wv-space-sm);
    padding-bottom: calc(var(--wv-space-sm) + env(safe-area-inset-bottom, 0px));
    border-top: 1px solid var(--wv-border);
    font-family: var(--wv-font-sans);
  }
  .wv-shell-drawer-foot form { margin: 0; }
  .wv-shell-scrim--drawer {
    display: block;
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 45;
    background: rgba(0, 0, 0, 0.45);
  }

  /* Bottom bar. It is a flex row after the content, so the page scrolls above it. */
  .wv-shell-bottomnav {
    display: flex;
    flex-shrink: 0;
    border-top: 1px solid var(--wv-border);
    background: var(--wv-surface);
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }

  /* AI panel: a bottom sheet above the bar. The slim desktop rail goes away. */
  .wv-ai-rail { display: none !important; }
  .wv-ai-sheet-glyph { display: inline; }
  .wv-ai-side-glyph { display: none; }
  .wv-shell-ai aside {
    inset-block-start: auto;
    inset-block-end: calc(var(--wv-shell-nav-h) + env(safe-area-inset-bottom, 0px));
    inset-inline: 0;
    width: auto !important;
    height: min(75vh, 36rem);
    height: min(75dvh, 36rem);
    border-inline-start: 0 !important;
    border-top: 1px solid var(--wv-border);
    border-radius: var(--wv-radius-md) var(--wv-radius-md) 0 0;
  }
  .wv-shell-scrim--ai {
    top: 0;
    bottom: calc(var(--wv-shell-nav-h) + env(safe-area-inset-bottom, 0px));
  }

  /* The guide character sits above the bar and a little smaller. */
  .wv-shell-guide {
    bottom: calc(var(--wv-shell-nav-h) + env(safe-area-inset-bottom, 0px) + var(--wv-space-sm)) !important;
    transform: scale(0.7);
    transform-origin: var(--wv-shell-origin, 100% 100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .wv-shell-drawer { transition: none !important; }
}

/* Printing shows the page, never the navigation. */
@media print {
  .wv-shell-bottomnav,
  .wv-shell-scrim { display: none !important; }
}
`;

/**
 * The loading skeleton mirrors the shell, so it follows the same
 * breakpoints: no sidebar block on phones (there is no sidebar there,
 * only a drawer), and the dynamic viewport height so it fits under a
 * phone browser's collapsing toolbar.
 */
export const SKELETON_CSS = `
.wv-skeleton-root { height: 100vh; height: 100dvh; }
@media (max-width: ${COMPACT_MAX_WIDTH}) {
  .wv-skeleton-sidebar { display: none !important; }
  .wv-skeleton-content { padding: var(--wv-space-md) !important; }
}
`;
