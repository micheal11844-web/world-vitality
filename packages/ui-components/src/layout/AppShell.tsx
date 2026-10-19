"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Header, type HeaderProps } from "./Header.js";
import { Sidebar, type SidebarSection } from "./Sidebar.js";
import { AIPanel } from "./AIPanel.js";
import { BottomNav, findMapHref } from "./BottomNav.js";
import { COMPACT_MAX_WIDTH, MEDIUM_MAX_WIDTH, SHELL_CSS } from "./shell-styles.js";
import { useMediaQuery } from "./useMediaQuery.js";
import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect.js";
import { GuideCharacter } from "../components/GuideCharacter.js";
import { GlobalSearch } from "../search/GlobalSearch.js";
import { NotificationBellView, useNotificationSummary } from "../notifications/NotificationBell.js";
import { useUiStrings } from "../i18n/ui-strings.js";

export interface AppShellProps {
  brand: HeaderProps["brand"];
  headerActions?: HeaderProps["actions"];
  /**
   * Grouped sidebar navigation — see `SidebarSection`. Typically one
   * section for the cross-workspace switcher and a second section for
   * pages within whichever workspace is currently open.
   */
  sidebarSections: SidebarSection[];
  /**
   * Passed straight through to `Sidebar`'s `defaultExpandedKeys`
   * (BUILD_PLAN "STAGE — NESTED WORKSPACE SIDEBAR NAVIGATION") — the
   * current workspace's key, typically, so its sub-pages are visible
   * without an extra click. Omit for shells with nothing to
   * pre-expand (the cross-workspace Dashboard and Public Explorer,
   * where there's no single "current workspace").
   */
  sidebarDefaultExpandedKeys?: string[];
  aiPanelOpen: boolean;
  onToggleAiPanel: () => void;
  aiPanelContent?: ReactNode;
  children: ReactNode;
  /**
   * Whether the Guide Character (Stage 9) appears, docked in the
   * bottom-right corner. Defaults to true — the whole point of putting
   * it in AppShell rather than each page (ticket 9.5) is that it
   * follows the user across every screen that uses this shell without
   * each page needing to remember to render it. `false` is an escape
   * hatch for a future page where it would genuinely be inappropriate
   * (none exist yet), not a default anyone should reach for.
   */
  showGuide?: boolean;
  /**
   * Optional replacement for the default flat-SVG `GuideCharacter` in
   * the docked corner spot (BUILD_PLAN "STAGE — GUIDE CHARACTER 3D:
   * EXTENDED TO APPSHELL + GUIDETUTORIAL"). Lets `apps/web` inject the
   * WebGL `GuideCharacter3D` here via its own `next/dynamic(...,
   * { ssr: false })` wrapper, without this framework-light package
   * needing to know about Next.js dynamic-import mechanics — same
   * pattern as `AuthIllustration`'s own `guideCharacter` prop. Defaults
   * to the flat-SVG character when omitted.
   */
  guideCharacter?: ReactNode;
  /**
   * Shows the built-in account controls (Settings link + Sign out) in
   * the header. Default `true`: every signed-in page wants them, so
   * the ~13 shells don't each need to opt in. The one anonymous-capable
   * page (Public Explorer) passes `false` — "Sign out" must never
   * appear for someone who isn't signed in.
   *
   * Like `GlobeToggleLink`, these point at fixed app routes
   * (`/settings`, `POST /auth/signout`) — a deliberate coupling of this
   * shell to the host app's routes, chosen over threading two props
   * through every workspace shell.
   *
   * Also controls the notification bell (PRD B.6): it is account-level
   * chrome with the same "only for someone signed in" rule, and it hides
   * itself when the server says there is no session.
   */
  showAccountMenu?: boolean;
  /**
   * Shows the global search box (PRD B.4) in the header. Default
   * `true` for the same reason as `showAccountMenu`: it's app-level
   * chrome, so every shell gets it without opting in. Search points at
   * fixed app routes (`/search`, `/api/search/*`).
   */
  showSearch?: boolean;
}

const SIDEBAR_COLLAPSED_STORAGE_KEY = "wv-sidebar-collapsed";
const COMPACT_QUERY = `(max-width: ${COMPACT_MAX_WIDTH})`;
/** Where an open AI panel floats over the page instead of docking beside it. */
const OVERLAY_QUERY = `(max-width: ${MEDIUM_MAX_WIDTH})`;

/**
 * `inert` takes a page region out of focus order and the accessibility
 * tree while something modal (the menu drawer, the AI sheet) is over it.
 *
 * The value is the string `"true"` on purpose, because this package is
 * rendered by two different Reacts: its tests and any React 18 host
 * render an unknown attribute verbatim, while the React 19 that Next's
 * App Router bundles knows `inert` as a boolean attribute and treats an
 * empty string as *false* (which silently dropped the attribute here
 * until it was caught in a real browser). A non-empty string is "on" to
 * both. React 18's types don't list the attribute, hence the loose type.
 */
function inertWhen(on: boolean): object {
  return on ? { inert: "true" } : {};
}

/**
 * The full app shell (ticket 5.4), composing Header + Sidebar + Main
 * Content + AI Panel exactly per Experience Blueprint Section 4's
 * wireframe layout:
 *
 * ```
 * ┌─────────────────────────────────────────────────────┐
 * │                       Header                         │
 * ├───────────┬───────────────────────────────┬──────────┤
 * │  Sidebar  │         Main Content           │ AI Panel │
 * │           │                                 │(dockable)│
 * └───────────┴───────────────────────────────┴──────────┘
 * ```
 *
 * "Header is global and constant across all workspaces. Sidebar contents
 * are populated per the Workspace Framework template but always occupy
 * the same position and order. AI Panel is optional/collapsible."
 * (Section 4, "Relationships"). This component enforces exactly that
 * structure — a consuming page provides content, not layout.
 *
 * **Sidebar collapse (BUILD_PLAN Stage 13 follow-up)** — "Ctrl+B
 * should be able to wrap and unwrap the dashboard from the left, just
 * use same mechanism Claude has." Owned entirely by this component
 * (not threaded through every page as a prop) since it's chrome
 * behavior, not page content — every page that renders `AppShell` gets
 * it automatically. Ctrl+B or Cmd+B toggles it (`preventDefault`'d so
 * it doesn't hit the browser's own bindings), and the sidebar's own
 * rail also has a click toggle for discoverability, since a
 * keyboard-only affordance isn't something a first-time user would
 * find on their own. Persisted to `localStorage` so it survives
 * navigating between pages — each page in this app mounts its own
 * `AppShell` instance (no shared persistent layout wrapping them),
 * so without persistence the collapse state would silently reset on
 * every navigation, which would be a worse experience than not having
 * the feature at all.
 *
 * **`data-app-shell-chrome` (added for Government & NGOs' formal
 * report export, BUILD_PLAN "STAGE — GOVERNMENT & NGOS WORKSPACE"):**
 * Header/Sidebar/AIPanel are each wrapped in a `div` carrying this
 * attribute, purely so a page's own `@media print` stylesheet can hide
 * app chrome and print only its content — see
 * `apps/web/app/workspaces/government-ngos/report/page.tsx`. Purely
 * additive: no visual or behavioral change for any existing page,
 * confirmed against `layout.test.tsx`'s existing assertions (all
 * ARIA-role-based, none depend on exact DOM nesting).
 *
 * **Phones and tablets (Experience Blueprint §16).** The same component
 * renders every layout; CSS (`shell-styles.ts`) picks which one shows, so
 * the server's HTML is already right at any width. At phone width the
 * sidebar becomes a drawer opened by a menu button (☰) in a compact
 * header, search drops into a row under that header, Home / Map / Alerts
 * / AI move to a bottom bar, and the AI panel becomes a bottom sheet.
 * Controls that exist only in one layout (the menu button, the bottom
 * bar, the drawer's own Settings/Sign out) are always in the DOM but
 * `display: none` outside it, so they are neither visible nor reachable
 * by keyboard or screen reader where they don't belong.
 *
 * JavaScript only handles behaviour CSS can't: opening and closing the
 * drawer, moving focus into whatever just opened and back out again,
 * Escape, Ctrl/Cmd+B (the drawer on phones, the icon rail elsewhere),
 * and marking the page behind a drawer or sheet `inert`.
 */

/**
 * Persistent "View the Globe" link (BUILD_PLAN "STAGE — GOD'S EYE
 * GLOBE VIEW") — baked directly into `AppShell` rather than added to
 * each of the ten workspace shells (plus Dashboard, Public Explorer)
 * individually, same "app-level chrome that should be the same on
 * every page" reasoning `brand`/`GuideCharacter` already use here. A
 * plain `<a>`, not a framework `<Link>` — this package is
 * framework-light by design (see `AuthIllustration`'s own doc comment
 * for the same reasoning applied to `next/image`), so Next.js's own
 * client-side-navigation optimization isn't available from inside
 * `packages/ui-components`; a full page navigation to `/globe` is a
 * fine, honest cost for an occasional, deliberate mode switch, not a
 * frequent in-flow action worth optimizing.
 */
function GlobeToggleLink() {
  const ui = useUiStrings();
  return (
    <a
      href="/globe"
      className="wv-desktop-only"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.375rem",
        padding: "0.375rem 0.75rem",
        borderRadius: "var(--wv-radius-sm)",
        border: "1px solid var(--wv-border)",
        backgroundColor: "transparent",
        color: "var(--wv-text-primary)",
        textDecoration: "none",
        fontSize: "0.875rem",
        fontFamily: "var(--wv-font-sans)",
      }}
    >
      <span aria-hidden="true">🌐</span>
      {ui.viewGlobe}
    </a>
  );
}

const accountControlStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "0.375rem 0.75rem",
  borderRadius: "var(--wv-radius-sm)",
  border: "1px solid var(--wv-border)",
  backgroundColor: "transparent",
  color: "var(--wv-text-primary)",
  textDecoration: "none",
  fontSize: "0.875rem",
  fontFamily: "var(--wv-font-sans)",
  cursor: "pointer",
} as const;

/**
 * Settings link + Sign out. Sign out is a real `<form method="post">`
 * (works without JavaScript, and a POST can't be triggered by a stray
 * link or image — see `app/auth/signout/route.ts`).
 */
function AccountControls() {
  const ui = useUiStrings();
  return (
    <>
      <a href="/settings" className="wv-desktop-only" style={accountControlStyle}>
        {ui.settings}
      </a>
      <form method="post" action="/auth/signout" className="wv-desktop-only" style={{ margin: 0 }}>
        <button type="submit" style={accountControlStyle}>
          {ui.signOut}
        </button>
      </form>
    </>
  );
}

function MenuIcon() {
  return (
    <svg
      aria-hidden="true"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

export function AppShell({
  brand,
  headerActions,
  sidebarSections,
  sidebarDefaultExpandedKeys,
  aiPanelOpen,
  onToggleAiPanel,
  aiPanelContent,
  children,
  showGuide = true,
  guideCharacter,
  showAccountMenu = true,
  showSearch = true,
}: AppShellProps) {
  const ui = useUiStrings();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const compact = useMediaQuery(COMPACT_QUERY);
  const overlay = useMediaQuery(OVERLAY_QUERY);
  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [pathname, setPathname] = useState("");
  // One fetch of the unread summary, shown by the header bell on wide
  // screens and by the bottom bar's Alerts tab on phones.
  const bell = useNotificationSummary({ enabled: showAccountMenu });

  const drawerId = useId();
  const searchId = useId();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const aiButtonRef = useRef<HTMLButtonElement>(null);
  const aiWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
      if (stored === "true") setSidebarCollapsed(true);
    } catch {
      // localStorage unavailable (private browsing, etc.) — fall back
      // to the in-memory default rather than erroring.
    }
  }, []);

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(next));
      } catch {
        // Same fallback as above.
      }
      return next;
    });
  }, []);

  // Growing the window past the phone width (rotating a tablet, resizing
  // a desktop window) leaves nothing to dismiss: drop the drawer and the
  // search row rather than have them reappear on the way back down.
  useEffect(() => {
    if (!compact) {
      setDrawerOpen(false);
      setSearchOpen(false);
    }
  }, [compact]);

  // Tapping any link in the menu gets the menu out of the way. (Links
  // navigate away, but one to the page you're already on wouldn't.) One
  // listener on the drawer rather than a handler on each link — the links
  // belong to `Sidebar` and the drawer foot, and the drawer itself is just
  // a container, not something to click.
  useEffect(() => {
    const drawer = drawerRef.current;
    if (!drawer) return;
    function handleClick(event: MouseEvent) {
      if ((event.target as HTMLElement).closest("a")) setDrawerOpen(false);
    }
    drawer.addEventListener("click", handleClick);
    return () => drawer.removeEventListener("click", handleClick);
  }, []);

  // The keyboard handler is registered once and reads the latest state
  // through a ref, so it never re-subscribes (or reads stale state).
  const latest = useRef({ compact, overlay, drawerOpen, searchOpen, aiPanelOpen, onToggleAiPanel });
  useIsomorphicLayoutEffect(() => {
    latest.current = { compact, overlay, drawerOpen, searchOpen, aiPanelOpen, onToggleAiPanel };
  });

  // Until this has run, the stylesheet keeps the floating AI panel out of
  // sight (see `shell-styles.ts`): the server can't know the page is being
  // opened on a phone, and a page whose shell opens the panel by default
  // must not paint it over the content in the moment before this decides.
  useIsomorphicLayoutEffect(() => setMounted(true), []);

  // Where the panel floats over the page (phones and tablets) it is
  // something you ask for, not something that greets you: a workspace page
  // that docks it open on a desktop opens with it closed here. Runs before
  // paint, on first load and whenever the window narrows into that range.
  useIsomorphicLayoutEffect(() => {
    if (overlay && latest.current.aiPanelOpen) latest.current.onToggleAiPanel();
  }, [overlay]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const state = latest.current;
      const isToggleCombo = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "b";
      if (isToggleCombo) {
        event.preventDefault();
        // Same "wrap and unwrap the sidebar" shortcut, but a phone has no
        // rail to wrap into: there it opens and closes the drawer.
        if (state.compact) setDrawerOpen((open) => !open);
        else toggleSidebar();
        return;
      }
      // Escape peels back one layer at a time, topmost first. A key a
      // widget already used (the search box closing its suggestions)
      // arrives with `defaultPrevented` set and is left alone.
      if (event.key === "Escape" && !event.defaultPrevented) {
        if (state.compact && state.drawerOpen) setDrawerOpen(false);
        else if (state.compact && state.searchOpen) setSearchOpen(false);
        else if (state.overlay && state.aiPanelOpen) state.onToggleAiPanel();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  // Focus follows what opens and returns to what opened it. Skipped on
  // the first render so a page never grabs focus just by loading.
  const previous = useRef({ drawerOpen, searchOpen, aiPanelOpen });
  useEffect(() => {
    const was = previous.current;
    previous.current = { drawerOpen, searchOpen, aiPanelOpen };

    if (drawerOpen !== was.drawerOpen) {
      if (drawerOpen) drawerCloseRef.current?.focus();
      else menuButtonRef.current?.focus();
    }
    if (searchOpen !== was.searchOpen) {
      if (searchOpen) searchWrapRef.current?.querySelector("input")?.focus();
      else searchButtonRef.current?.focus();
    }
    if (overlay && aiPanelOpen !== was.aiPanelOpen) {
      if (aiPanelOpen) {
        aiWrapRef.current?.querySelector("aside")?.focus();
      } else {
        // Only pull focus back if it was inside the panel it just left
        // (✕ or Escape) or nowhere (a tap on the dimmed page). It goes to
        // whatever opens the panel here: the bottom bar's AI tab on a
        // phone, the slim rail's button on a tablet.
        const active = document.activeElement;
        if (!active || active === document.body || aiWrapRef.current?.contains(active)) {
          const opener = compact
            ? aiButtonRef.current
            : aiWrapRef.current?.querySelector<HTMLElement>(".wv-ai-rail button");
          opener?.focus();
        }
      }
    }
  }, [drawerOpen, searchOpen, aiPanelOpen, compact, overlay]);

  const closeDrawer = () => setDrawerOpen(false);
  const modalOpen = (compact && drawerOpen) || (overlay && aiPanelOpen);
  const rtl = ui.dir === "rtl";

  const rootStyle = {
    display: "flex",
    flexDirection: "column",
    // Which way the drawer slides off-screen, and which corner the guide
    // character anchors to, depend on the reading direction.
    "--wv-shell-off": rtl ? 1 : -1,
    "--wv-shell-origin": rtl ? "0% 100%" : "100% 100%",
  } as CSSProperties;

  return (
    <div className="wv-shell-root" data-mounted={mounted ? "true" : "false"} style={rootStyle}>
      <style dangerouslySetInnerHTML={{ __html: SHELL_CSS }} />
      <div data-app-shell-chrome {...inertWhen(modalOpen)}>
        <Header
          leading={
            <button
              ref={menuButtonRef}
              type="button"
              className="wv-shell-menu-btn wv-shell-iconbtn"
              aria-label={ui.nav.menu}
              aria-expanded={drawerOpen}
              aria-controls={drawerId}
              onClick={() => setDrawerOpen(true)}
            >
              <MenuIcon />
            </button>
          }
          brand={brand}
          actions={
            <>
              {showSearch && (
                <button
                  ref={searchButtonRef}
                  type="button"
                  className="wv-shell-search-btn wv-shell-iconbtn"
                  aria-label={ui.nav.search}
                  aria-expanded={searchOpen}
                  aria-controls={searchId}
                  onClick={() => setSearchOpen((open) => !open)}
                >
                  <SearchIcon />
                </button>
              )}
              {showSearch && (
                <div
                  id={searchId}
                  ref={searchWrapRef}
                  className="wv-shell-search"
                  data-open={searchOpen ? "true" : "false"}
                >
                  <GlobalSearch />
                </div>
              )}
              <GlobeToggleLink />
              {headerActions}
              {showAccountMenu && <NotificationBellView state={bell} className="wv-desktop-only" />}
              {showAccountMenu && <AccountControls />}
            </>
          }
        />
      </div>
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/*
          `display: "flex"` here (BUILD_PLAN "STAGE — SIDEBAR HEIGHT
          FIX") — a real, separate bug from the "whole page scrolls"
          one fixed earlier. This `data-app-shell-chrome` wrapper is a
          plain block-level `<div>` (it exists only as a `@media
          print` selector target, see the print-stylesheet doc comment
          below) — as a flex *item* of the row above, it correctly
          stretches to the row's full height via the default
          `align-items: stretch`, but a stretched block-level parent
          does not automatically hand that height down to *its own*
          children as a percentage: `<nav>`'s height only resolved to
          its own content, not the wrapper's stretched height. With the
          nested/collapsible sidebar (BUILD_PLAN "STAGE — NESTED
          WORKSPACE SIDEBAR NAVIGATION"), most workspaces collapse by
          default, so the sidebar's content is now genuinely shorter
          than before — exposing a gap between where the sidebar's
          background ended and the actual bottom of the viewport, that
          the earlier flat, always-tall list happened to mask. Making
          this wrapper `display: "flex"` too makes `<nav>` a genuine
          flex item of *it*, stretching via the same basic, ubiquitous
          default rather than relying on a percentage-height-through-
          a-stretched-block-ancestor spec corner case — confirmed via
          real before/after image renders, not assumed.

          In the phone layout this same wrapper is the menu drawer
          (`.wv-shell-drawer`, see `shell-styles.ts`): fixed to the
          reading-start edge, slid off-screen until `data-open`.
        */}
        <div
          id={drawerId}
          ref={drawerRef}
          className="wv-shell-drawer"
          data-app-shell-chrome=""
          data-open={drawerOpen ? "true" : "false"}
          style={{ display: "flex", minHeight: 0 }}
        >
          <div className="wv-shell-drawer-head">
            <span>{ui.nav.menu}</span>
            <button
              ref={drawerCloseRef}
              type="button"
              className="wv-shell-iconbtn"
              style={{ display: "inline-flex" }}
              aria-label={ui.nav.closeMenu}
              onClick={closeDrawer}
            >
              <span aria-hidden="true">✕</span>
            </button>
          </div>
          <Sidebar
            sections={sidebarSections}
            collapsed={sidebarCollapsed && !compact}
            onToggleCollapse={toggleSidebar}
            defaultExpandedKeys={sidebarDefaultExpandedKeys}
          />
          <div className="wv-shell-drawer-foot">
            <a className="wv-drawer-link" href="/globe">
              <span aria-hidden="true">🌐</span>
              {ui.viewGlobe}
            </a>
            {showAccountMenu && (
              <>
                <a className="wv-drawer-link" href="/settings">
                  {ui.settings}
                </a>
                <form method="post" action="/auth/signout">
                  <button type="submit" className="wv-drawer-link">
                    {ui.signOut}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
        <main
          className="wv-shell-main"
          {...inertWhen(modalOpen)}
          style={{
            flex: 1,
            minWidth: 0,
            // Same fix as `Sidebar`'s own `<nav>` — a flex item's
            // default `min-height: auto` means `overflow: "auto"`
            // alone doesn't actually create a scroll region until the
            // item is also allowed to shrink below its content's
            // natural height. Without this, a sufficiently tall page
            // (e.g. a multi-property/multi-location workspace list)
            // could grow `main` past the shell's 100vh height and
            // scroll the whole page instead of just this region — a
            // latent version of the same bug `Sidebar` actually hit
            // once its nested tree got tall enough to trigger it. See
            // BUILD_PLAN "STAGE — FIXED APP-SHELL LAYOUT (INDEPENDENT
            // SCROLL REGIONS)".
            minHeight: 0,
            overflow: "auto",
            // Padding lives in `.wv-shell-main` (it shrinks on phones).
            backgroundColor: "var(--wv-bg)",
          }}
        >
          {children}
        </main>
        <div
          ref={aiWrapRef}
          className="wv-shell-ai"
          data-app-shell-chrome=""
          {...inertWhen(compact && drawerOpen)}
        >
          <AIPanel open={aiPanelOpen} onToggle={onToggleAiPanel}>
            {aiPanelContent}
          </AIPanel>
        </div>
      </div>
      <div {...inertWhen(compact && drawerOpen)} style={{ display: "contents" }}>
        <BottomNav
          homeHref={showAccountMenu ? "/dashboard" : "/"}
          mapHref={findMapHref(sidebarSections)}
          pathname={pathname}
          alerts={showAccountMenu && bell.kind !== "signed-out" ? bell : null}
          aiOpen={aiPanelOpen}
          onToggleAi={onToggleAiPanel}
          aiButtonRef={aiButtonRef}
        />
      </div>
      {drawerOpen && (
        <div
          className="wv-shell-scrim wv-shell-scrim--drawer"
          data-app-shell-chrome=""
          aria-hidden="true"
          onClick={closeDrawer}
        />
      )}
      {aiPanelOpen && (
        <div
          className="wv-shell-scrim wv-shell-scrim--ai"
          data-app-shell-chrome=""
          aria-hidden="true"
          onClick={onToggleAiPanel}
        />
      )}
      {showGuide && (
        <div
          className="wv-shell-guide"
          style={{
            position: "fixed",
            bottom: "var(--wv-space-md)",
            insetInlineEnd: "var(--wv-space-md)",
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          {guideCharacter ?? <GuideCharacter mood="idle" size={84} />}
        </div>
      )}
    </div>
  );
}
