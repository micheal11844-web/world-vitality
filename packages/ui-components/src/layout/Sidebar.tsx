"use client";

import { useState, type ReactNode } from "react";
import { Button } from "../components/Button.js";

export interface SidebarItem {
  key: string;
  label: string;
  icon?: ReactNode;
  href: string;
  active?: boolean;
  /**
   * Nested sub-pages (BUILD_PLAN "STAGE — NESTED WORKSPACE SIDEBAR
   * NAVIGATION"). When present, the item renders with a disclosure
   * chevron and, once expanded, its children render indented below it
   * in smaller, lighter text — the standard "collapsible tree" pattern
   * (VS Code's file explorer, Notion's page list, most SaaS admin
   * sidebars) rather than this app's earlier flat "Workspaces" +
   * separate "This Workspace" two-section layout, which required every
   * workspace shell to hand-build its own near-identical section pair.
   * A leaf item (no `children`) renders exactly as before — this is
   * purely additive.
   */
  children?: SidebarItem[];
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
  /**
   * Item keys whose children should start expanded (BUILD_PLAN "STAGE
   * — NESTED WORKSPACE SIDEBAR NAVIGATION") — typically the current
   * workspace's own key, so landing on a workspace's page shows its
   * sub-pages open immediately rather than requiring an extra click to
   * discover them. Purely an initial value: once rendered, expansion
   * is tracked as this component's own state and the caller has no
   * further control over it (uncontrolled, same as most disclosure
   * widgets — there's no scenario in this app where something *outside*
   * the sidebar needs to force one open or closed after the fact).
   */
  defaultExpandedKeys?: string[];
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
 * One navigable row, optionally with a disclosure chevron and nested
 * children (BUILD_PLAN "STAGE — NESTED WORKSPACE SIDEBAR NAVIGATION").
 *
 * **The label and the chevron are two independent interactive
 * targets, deliberately, not one overloaded click handler.** The row
 * itself is a real `<a href>` — clicking the label navigates, exactly
 * like every other sidebar link, so keyboard/screen-reader users get
 * ordinary, predictable link semantics. The chevron is a separate
 * `<button>` that only toggles expansion and never navigates. Merging
 * the two ("click anywhere on the row to both expand *and* navigate,
 * except when it doesn't") is a common but genuinely confusing pattern
 * for assistive technology, since the same control would sometimes
 * change the page and sometimes wouldn't — two clearly-labeled
 * controls avoid that ambiguity entirely.
 */
function SidebarRow({
  item,
  depth,
  collapsed,
  isExpanded,
  onToggleExpand,
}: {
  item: SidebarItem;
  depth: number;
  collapsed: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const hasChildren = Boolean(item.children && item.children.length > 0);
  const isSubItem = depth > 0;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center" }}>
        <a
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          title={collapsed ? item.label : undefined}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--wv-space-sm)",
            flex: 1,
            minWidth: 0,
            padding: isSubItem ? "0.375rem 0.75rem" : "0.5rem 0.75rem",
            paddingLeft: isSubItem ? `${0.75 + depth * 1}rem` : "0.75rem",
            borderRadius: "var(--wv-radius-sm)",
            textDecoration: "none",
            color: item.active
              ? "var(--wv-color-accent-700)"
              : isSubItem
                ? "var(--wv-text-secondary)"
                : "var(--wv-text-primary)",
            backgroundColor: item.active ? "var(--wv-color-accent-50)" : "transparent",
            fontSize: isSubItem ? "0.8125rem" : "0.9375rem",
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
        {hasChildren && !collapsed && (
          <button
            type="button"
            onClick={onToggleExpand}
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? "Collapse" : "Expand"} ${item.label}`}
            style={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "1.75rem",
              height: "1.75rem",
              marginRight: "0.25rem",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "var(--wv-text-secondary)",
              fontSize: "0.625rem",
              transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)",
              transition: "transform 0.15s ease",
            }}
          >
            ▼
          </button>
        )}
      </div>
      {hasChildren && isExpanded && !collapsed && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {item.children!.map((child) => (
            <SidebarRow
              key={child.key}
              item={child}
              depth={depth + 1}
              collapsed={collapsed}
              isExpanded={false}
              onToggleExpand={() => {}}
            />
          ))}
        </div>
      )}
    </div>
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
export function Sidebar({
  sections,
  collapsed = false,
  onToggleCollapse,
  defaultExpandedKeys = [],
}: SidebarProps) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set(defaultExpandedKeys));

  function toggleExpanded(key: string) {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

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
        // `minHeight: 0` + `overflowY: auto` together, not `overflow:
        // hidden` alone (BUILD_PLAN "STAGE — FIXED APP-SHELL LAYOUT
        // (INDEPENDENT SCROLL REGIONS)"): a flex item's default
        // `min-height: auto` means it refuses to shrink below its own
        // content's natural height regardless of the parent's
        // constrained height — so once the nested sidebar tree (this
        // app's own "STAGE — NESTED WORKSPACE SIDEBAR NAVIGATION")
        // could grow past viewport height with several workspaces
        // expanded, the nav's rendered box grew to match, pushing the
        // whole flex row (and the outer 100vh shell) taller than the
        // viewport — the entire page scrolled, header and sidebar
        // included, instead of just the intended content region. Real
        // regression introduced by that same stage, not present when
        // the sidebar was still a short, flat list. `overflowX:
        // "hidden"` is kept (not `overflow: "auto"` on both axes) so
        // horizontal content still clips cleanly during the
        // width-collapse transition, exactly as `overflow: "hidden"`
        // did before — only the vertical axis needed to change.
        minHeight: 0,
        overflowX: "hidden",
        overflowY: "auto",
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
            <SidebarRow
              key={item.key}
              item={item}
              depth={0}
              collapsed={collapsed}
              isExpanded={expandedKeys.has(item.key)}
              onToggleExpand={() => toggleExpanded(item.key)}
            />
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
