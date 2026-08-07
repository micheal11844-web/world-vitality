import type { ReactNode } from "react";

export interface SidebarItem {
  key: string;
  label: string;
  icon?: ReactNode;
  href: string;
  active?: boolean;
}

export interface SidebarProps {
  items: SidebarItem[];
  /** Collapsed to icon-only rail — per Section 4's "collapsible to an
   *  icon rail" requirement for smaller viewports / user preference. */
  collapsed?: boolean;
}

/**
 * App-shell sidebar navigation (ticket 5.4), per Experience Blueprint
 * Section 4's wireframe: primary workspace navigation, left-docked,
 * collapsible to an icon-only rail.
 *
 * Renders real `<a>` elements — navigation is a set of destinations
 * (URLs), not a set of button actions, so it should behave like links
 * (open in new tab, browser back/forward, etc.) once routing exists in
 * Stage 6. `aria-current="page"` marks the active item, the correct ARIA
 * signal for "this is where you are," not a custom `active` styling
 * class alone.
 */
export function Sidebar({ items, collapsed = false }: SidebarProps) {
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
        gap: "var(--wv-space-xs)",
        fontFamily: "var(--wv-font-sans)",
        transition: "width 0.15s ease",
      }}
    >
      {items.map((item) => (
        <a
          key={item.key}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
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
          {item.icon && (
            <span aria-hidden="true" style={{ flexShrink: 0, display: "inline-flex" }}>
              {item.icon}
            </span>
          )}
          {!collapsed && <span>{item.label}</span>}
        </a>
      ))}
    </nav>
  );
}
