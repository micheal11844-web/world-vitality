import type { ReactNode } from "react";
import { Header, type HeaderProps } from "./Header.js";
import { Sidebar, type SidebarItem } from "./Sidebar.js";
import { AIPanel } from "./AIPanel.js";
import { GuideCharacter } from "../components/GuideCharacter.js";

export interface AppShellProps {
  brand: HeaderProps["brand"];
  headerActions?: HeaderProps["actions"];
  sidebarItems: SidebarItem[];
  sidebarCollapsed?: boolean;
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
 */
export function AppShell({
  brand,
  headerActions,
  sidebarItems,
  sidebarCollapsed = false,
  aiPanelOpen,
  onToggleAiPanel,
  aiPanelContent,
  children,
  showGuide = true,
}: AppShellProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Header brand={brand} actions={headerActions} />
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <Sidebar items={sidebarItems} collapsed={sidebarCollapsed} />
        <main
          style={{
            flex: 1,
            minWidth: 0,
            overflow: "auto",
            padding: "var(--wv-space-lg)",
            backgroundColor: "var(--wv-bg)",
          }}
        >
          {children}
        </main>
        <AIPanel open={aiPanelOpen} onToggle={onToggleAiPanel}>
          {aiPanelContent}
        </AIPanel>
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
