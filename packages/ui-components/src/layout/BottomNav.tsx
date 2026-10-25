"use client";

import type { ReactNode, Ref } from "react";
import { useUiStrings } from "../i18n/ui-strings.js";
import { bellCounts, bellLabel, type BellState } from "../notifications/NotificationBell.js";
import type { SidebarItem, SidebarSection } from "./Sidebar.js";

/** Where the Map tab goes when no workspace is open: the public map explorer. */
export const DEFAULT_MAP_HREF = "/explore";

/**
 * The Map tab's destination: the open workspace's own map page when there
 * is one (the sidebar marks the open workspace `active`, and every
 * workspace's last-but-one sub-link is its `/map`), otherwise the public
 * Explorer. Derived from the sidebar the page already hands the shell, so
 * the server and the browser agree on it — no reading `window.location`
 * during render.
 */
export function findMapHref(sections: SidebarSection[]): string {
  for (const section of sections) {
    const found = findMapIn(section.items);
    if (found) return found;
  }
  return DEFAULT_MAP_HREF;
}

/** Searches at any depth: workspaces now sit inside a "Workspaces" group. */
function findMapIn(items: SidebarItem[]): string | null {
  for (const item of items) {
    if (item.active) {
      const map = item.children?.find((child) => child.href.endsWith("/map"));
      if (map) return map.href;
    }
    const nested = item.children ? findMapIn(item.children) : null;
    if (nested) return nested;
  }
  return null;
}

export interface BottomNavProps {
  homeHref: string;
  mapHref: string;
  /**
   * The current URL path, to mark the matching tab. Empty until the page
   * has mounted (it is read in an effect, so server and first browser
   * render agree) — no tab is marked until then.
   */
  pathname: string;
  /** Shared unread summary; `null` leaves the Alerts tab out (signed-out visitors). */
  alerts: BellState | null;
  aiOpen: boolean;
  onToggleAi: () => void;
  aiButtonRef?: Ref<HTMLButtonElement>;
}

function Icon({ children }: { children: ReactNode }) {
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
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

const HomeIcon = () => (
  <Icon>
    <path d="M3 11l9-8 9 8" />
    <path d="M5 10v10h14V10" />
    <path d="M10 20v-6h4v6" />
  </Icon>
);
const MapIcon = () => (
  <Icon>
    <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />
    <path d="M9 4v14" />
    <path d="M15 6v14" />
  </Icon>
);
const BellIcon = () => (
  <Icon>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </Icon>
);
const AiIcon = () => (
  <Icon>
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
    <path d="M19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z" />
  </Icon>
);

/**
 * The phone layout's bottom bar (Experience Blueprint §16): the four
 * places people go most — Home, Map, Alerts, and the AI assistant — in
 * thumb reach. Everything else is in the menu drawer.
 *
 * Home, Map and Alerts are real links (so open-in-new-tab, back and
 * forward all work); the AI tab is a toggle button. The Alerts tab shows
 * the same unread badge as the header bell, and uses the same reserved
 * critical look only for an unread *critical* item.
 *
 * This is hidden by `shell-styles.ts` except in the compact layout; it
 * is always rendered, so the server's HTML already contains it.
 */
export function BottomNav({
  homeHref,
  mapHref,
  pathname,
  alerts,
  aiOpen,
  onToggleAi,
  aiButtonRef,
}: BottomNavProps) {
  const ui = useUiStrings();
  const here = (href: string) => (pathname !== "" && pathname === href ? "page" : undefined);

  const counts = alerts ? bellCounts(alerts) : { unread: 0, critical: 0 };
  const alertsLabel = alerts ? bellLabel(ui, alerts, ui.nav.alerts) : ui.nav.alerts;

  return (
    <nav className="wv-shell-bottomnav" data-app-shell-chrome="" aria-label={ui.nav.quickNav}>
      <a className="wv-bottomnav-tab" href={homeHref} aria-current={here(homeHref)}>
        <HomeIcon />
        <span>{ui.nav.home}</span>
      </a>
      <a className="wv-bottomnav-tab" href={mapHref} aria-current={here(mapHref)}>
        <MapIcon />
        <span>{ui.nav.map}</span>
      </a>
      {alerts && (
        <a
          className="wv-bottomnav-tab"
          href="/notifications"
          aria-label={alertsLabel}
          aria-current={pathname.startsWith("/notifications") ? "page" : undefined}
          data-critical={counts.critical > 0 ? "true" : undefined}
          style={counts.critical > 0 ? { color: "var(--wv-critical)" } : undefined}
        >
          <span style={{ position: "relative", display: "inline-flex" }}>
            <BellIcon />
            {counts.unread > 0 && (
              <span
                aria-hidden="true"
                data-testid="bottomnav-badge"
                style={{
                  position: "absolute",
                  top: "-0.375rem",
                  insetInlineStart: "55%",
                  minWidth: "1rem",
                  padding: "0 0.25rem",
                  borderRadius: "999px",
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  lineHeight: "1rem",
                  textAlign: "center",
                  color: "#ffffff",
                  backgroundColor: counts.critical > 0 ? "var(--wv-critical)" : "var(--wv-accent)",
                }}
              >
                {counts.critical > 0 ? "!" : ""}
                {counts.unread > 99 ? `${ui.formatNumber(99)}+` : ui.formatNumber(counts.unread)}
              </span>
            )}
          </span>
          <span>{ui.nav.alerts}</span>
        </a>
      )}
      <button
        ref={aiButtonRef}
        type="button"
        className="wv-bottomnav-tab"
        aria-pressed={aiOpen}
        onClick={onToggleAi}
      >
        <AiIcon />
        <span>{ui.nav.ai}</span>
      </button>
    </nav>
  );
}
