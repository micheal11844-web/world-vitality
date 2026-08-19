import type { ReactNode } from "react";
import { Button } from "../components/Button.js";

export interface SidebarItem {
  key: string;
  label: string;
  icon?: ReactNode;
  href: string;
  active?: boolean;
}

export interface SidebarSection {
  key: string;
  /** Optional group heading, e.g. "Workspaces" or "This Workspace".
   *  Omit for a section that shouldn't show a heading. */
  label?: string;
  items: SidebarItem[];
}

export interface SidebarProps {
  /**
   * Grouped navigation — e.g. one section for the cross-workspace
   * switcher, a second section for the current workspace's own pages.
   * Replaces the old flat `items` list (BUILD_PLAN Stage 13 follow-up:
   * "the dashboard collides with itself when a workspace is chosen" —
   * the fix is visually separating "switch workspace" from "pages
   * within this workspace" rather than interleaving them in one list).
   */
  sections: SidebarSection[];
  /** Collapsed to icon-only rail — per Section 4's "collapsible to an
   *  icon rail" requirement for smaller viewports / user preference.
   *  Now actually toggleable (previously accepted but never wired to
   *  a control) via the rail's own toggle button, and from `AppShell`
   *  via Ctrl/Cmd+B. */
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

/** When an item has no explicit icon, the collapsed rail falls back to
 *  the item's first letter in a small circle — a deliberate, minimal
 *  stand-in rather than pulling in an icon library this project
 *  doesn't otherwise depend on. Real icons are real follow-up work,
 *  not built here. */
function CollapsedFallbackIcon({ label }: { label: string }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "1.5rem",
        height: "1.5rem",
        borderRadius: "50%",
        backgroundColor: "var(--wv-color-accent-50)",
        color: "var(--wv-color-accent-700)",
        fontSize: "0.75rem",
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {label.charAt(0).toUpperCase()}
    </span>
  );
}

/**
 * App-shell sidebar navigation (ticket 5.4), per Experience Blueprint
 * Section 4's wireframe: primary workspace navigation, left-docked,
 * collapsible to an icon-only rail.
 *
 * Renders real `<a>` elements — navigation is a set of destinations
 * (URLs), not a set of button actions, so it should behave like links
 * (open in new tab, browser back/forward, etc.). `aria-current="page"`
 * marks the active item, the correct ARIA signal for "this is where
 * you are," not a custom `active` styling class alone.
 */
export function Sidebar({ sections, collapsed = false, onToggleCollapse }: SidebarProps) {
  return (
    <nav
      aria-label="Primary"
      style={{
        width: collapsed ? "3.5rem" : "14rem",
        borderRight: "1px solid var(--wv-border)",
        backgroundColor: "var(--wv-surface)",
        padding: "var(--wv-space-md) var(--wv-space-sm)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--wv-space-md)",
        fontFamily: "var(--wv-font-sans)",
        transition: "width 0.15s ease",
        overflow: "hidden",
      }}
    >
      {sections.map((section) => (
        <div
          key={section.key}
          style={{ display: "flex", flexDirection: "column", gap: "var(--wv-space-xs)" }}
        >
          {section.label && !collapsed && (
            <span
              style={{
                fontSize: "0.6875rem",
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: "var(--wv-text-secondary)",
                padding: "0 0.75rem",
              }}
            >
              {section.label}
            </span>
          )}
          {section.items.map((item) => (
            <a
              key={item.key}
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              title={collapsed ? item.label : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--wv-space-sm)",
                padding: "0.5rem 0.75rem",
                borderRadius: "var(--wv-radius-sm)",
                textDecoration: "none",
                color: item.active ? "var(--wv-color-accent-700)" : "var(--wv-text-primary)",
                backgroundColor: item.active ? "var(--wv-color-accent-50)" : "transparent",
                fontSize: "0.9375rem",
                fontWeight: item.active ? 500 : 400,
                overflow: "hidden",
                whiteSpace: "nowrap",
              }}
            >
              {item.icon ? (
                <span aria-hidden="true" style={{ flexShrink: 0, display: "inline-flex" }}>
                  {item.icon}
                </span>
              ) : (
                collapsed && <CollapsedFallbackIcon label={item.label} />
              )}
              {!collapsed && <span>{item.label}</span>}
            </a>
          ))}
        </div>
      ))}
      {onToggleCollapse && (
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            justifyContent: collapsed ? "center" : "flex-end",
          }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
            title={collapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
          >
            {collapsed ? "▶" : "◀"}
          </Button>
        </div>
      )}
    </nav>
  );
}
