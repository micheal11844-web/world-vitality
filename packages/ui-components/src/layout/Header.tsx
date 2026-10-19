import type { ReactNode } from "react";

export interface HeaderProps {
  /** Logo/workspace-switcher slot — left-aligned. */
  brand: ReactNode;
  /** Search, notifications, profile menu, etc. — right-aligned. */
  actions?: ReactNode;
  /**
   * A control that sits before the brand — the phone layout's menu
   * button. Rendered as-is; it decides for itself when to show.
   */
  leading?: ReactNode;
}

/**
 * App-shell header (ticket 5.4), per Experience Blueprint Section 4's
 * wireframe: a persistent top bar holding brand/workspace identity on
 * the left and global actions on the right. Deliberately just a layout
 * shell with slots — the actual search/notification/profile components
 * are Stage 6+ (once there's a real app to wire them to real data).
 *
 * The `wv-shell-*` class names are hooks for the responsive rules in
 * `shell-styles.ts`; they change nothing on their own.
 */
export function Header({ brand, actions, leading }: HeaderProps) {
  return (
    <header
      className="wv-shell-header"
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
      <div
        className="wv-shell-brand"
        style={{ display: "flex", alignItems: "center", gap: "var(--wv-space-md)" }}
      >
        {leading}
        {brand}
      </div>
      {actions && (
        <div
          className="wv-shell-actions"
          style={{ display: "flex", alignItems: "center", gap: "var(--wv-space-sm)" }}
        >
          {actions}
        </div>
      )}
    </header>
  );
}
