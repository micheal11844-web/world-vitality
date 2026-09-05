"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Header, type HeaderProps } from "./Header.js";
import { Sidebar, type SidebarSection } from "./Sidebar.js";
import { AIPanel } from "./AIPanel.js";
import { GuideCharacter } from "../components/GuideCharacter.js";

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
}

const SIDEBAR_COLLAPSED_STORAGE_KEY = "wv-sidebar-collapsed";

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
 */
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
}: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
      if (stored === "true") setSidebarCollapsed(true);
    } catch {
      // localStorage unavailable (private browsing, etc.) — fall back
      // to the in-memory default rather than erroring.
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(next));
      } catch {
        // Same fallback as above.
      }
      return next;
    });
  };

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isToggleCombo = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "b";
      if (!isToggleCombo) return;
      event.preventDefault();
      toggleSidebar();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div data-app-shell-chrome>
        <Header brand={brand} actions={headerActions} />
      </div>
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <div data-app-shell-chrome>
          <Sidebar
            sections={sidebarSections}
            collapsed={sidebarCollapsed}
            onToggleCollapse={toggleSidebar}
            defaultExpandedKeys={sidebarDefaultExpandedKeys}
          />
        </div>
        <main
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
            padding: "var(--wv-space-lg)",
            backgroundColor: "var(--wv-bg)",
          }}
        >
          {children}
        </main>
        <div data-app-shell-chrome>
          <AIPanel open={aiPanelOpen} onToggle={onToggleAiPanel}>
            {aiPanelContent}
          </AIPanel>
        </div>
      </div>
      {showGuide && (
        <div
          style={{
            position: "fixed",
            bottom: "var(--wv-space-md)",
            right: "var(--wv-space-md)",
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          <GuideCharacter mood="idle" size={64} />
        </div>
      )}
    </div>
  );
}
