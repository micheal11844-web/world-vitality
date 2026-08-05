import type { ReactNode } from "react";

export interface HeaderProps {
  /** Logo/workspace-switcher slot — left-aligned. */
  brand: ReactNode;
  /** Search, notifications, profile menu, etc. — right-aligned. */
  actions?: ReactNode;
}

/**
 * App-shell header (ticket 5.4), per Experience Blueprint Section 4's
 * wireframe: a persistent top bar holding brand/workspace identity on
 * the left and global actions on the right. Deliberately just a layout
 * shell with slots — the actual search/notification/profile components
 * are Stage 6+ (once there's a real app to wire them to real data).
 */
export function Header({ brand, actions }: HeaderProps) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "3.5rem",
        padding: "0 var(--wv-space-lg)",
        borderBottom: "1px solid var(--wv-border)",
        backgroundColor: "var(--wv-surface)",
        fontFamily: "var(--wv-font-sans)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--wv-space-md)" }}>
        {brand}
      </div>
      {actions && (
        <div style={{ display: "flex", alignItems: "center", gap: "var(--wv-space-sm)" }}>
          {actions}
        </div>
      )}
    </header>
  );
}
