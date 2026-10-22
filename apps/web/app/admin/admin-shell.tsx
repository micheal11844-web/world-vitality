"use client";

import { useState, type ReactNode } from "react";
import { AppShell } from "@world-vitality/ui-components";
import type { StaffPermission } from "@world-vitality/identity-service";
import { AppBrand } from "../app-brand";

export type AdminSection = "overview" | "users" | "sources" | "audit";

const SECTIONS: { key: AdminSection; label: string; href: string; needs: StaffPermission }[] = [
  { key: "overview", label: "Overview", href: "/admin", needs: "overview:view" },
  { key: "users", label: "User lookup", href: "/admin/users", needs: "users:lookup" },
  { key: "sources", label: "Data sources", href: "/admin/sources", needs: "sources:view" },
  { key: "audit", label: "Audit log", href: "/admin/audit", needs: "audit:view" },
];

/**
 * The frame every staff page sits in: the same app shell customers see,
 * with its own navigation, limited to the sections this person may open.
 * Showing only what they can open is a courtesy; the gate is
 * `requireStaff()` on the server.
 *
 * No search box (it searches customer-facing content) and no guide
 * character — this is a working tool.
 */
export function AdminShell({
  current,
  permissions,
  children,
}: {
  current: AdminSection;
  permissions: StaffPermission[];
  children: ReactNode;
}) {
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  return (
    <AppShell
      brand={
        <div style={{ display: "flex", alignItems: "center", gap: "var(--wv-space-sm)" }}>
          <AppBrand />
          <span
            style={{
              fontFamily: "var(--wv-font-sans)",
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--wv-text-secondary)",
              border: "1px solid var(--wv-border)",
              borderRadius: "var(--wv-radius-sm)",
              padding: "0.125rem 0.375rem",
            }}
          >
            Staff
          </span>
        </div>
      }
      sidebarSections={[
        {
          key: "console",
          label: "Admin console",
          items: SECTIONS.filter((s) => permissions.includes(s.needs)).map((s) => ({
            key: s.key,
            label: s.label,
            href: s.href,
            active: s.key === current,
          })),
        },
        {
          key: "app",
          items: [{ key: "back", label: "Back to the app", href: "/dashboard" }],
        },
      ]}
      aiPanelOpen={aiPanelOpen}
      onToggleAiPanel={() => setAiPanelOpen((v) => !v)}
      showGuide={false}
      showSearch={false}
    >
      {children}
    </AppShell>
  );
}
