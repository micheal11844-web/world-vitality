"use client";

import { useState, type ReactNode } from "react";
import { AppShell, StateDisplay, Text } from "@world-vitality/ui-components";
import type { Role } from "@world-vitality/identity-service";
import { AppBrand } from "../../app-brand";
import { buildWorkspaceSidebarItems } from "../workspace-nav";

export interface WorkspaceShellProps {
  activeKey: "home" | "map" | "lesson-plan";
  children: ReactNode;
  role: Role;
}

// PRD A.8 names three roles: Educator/Admin, Student, Institution
// Admin. This build deliberately has no Student role at all — see
// page.tsx's honest-scope notes — so only the educator-facing two are
// mapped here, onto this app's generic four-role model, same approach
// `government-ngos` and `insurance` used for their own PRD-specific
// role names.
const ROLE_LABEL: Record<Role, string> = {
  admin_owner: "Educator/Admin",
  operational_user: "Educator",
  scoped_field_user: "Limited Access",
  viewer_external: "Guest (read-only)",
};

/**
 * Shared shell for the Education workspace (BUILD_PLAN "STAGE —
 * EDUCATION WORKSPACE"). Same single-section, collapsible "Workspaces"
 * sidebar tree as every other workspace shell (BUILD_PLAN "STAGE —
 * NESTED WORKSPACE SIDEBAR NAVIGATION"). No AI panel showing an
 * interpretation result (unlike every other workspace's shell) — this
 * workspace's AI-adjacent feature is the grade-level explanation tool
 * on the home page itself, not a persistent side-panel summary.
 */
export function WorkspaceShell({ activeKey, children, role }: WorkspaceShellProps) {
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  return (
    <AppShell
      brand={<AppBrand />}
      sidebarSections={[
        {
          key: "workspaces",
          label: "Workspaces",
          items: buildWorkspaceSidebarItems("education", activeKey),
        },
      ]}
      sidebarDefaultExpandedKeys={["education"]}
      aiPanelOpen={aiPanelOpen}
      onToggleAiPanel={() => setAiPanelOpen((v) => !v)}
      aiPanelContent={
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--wv-space-sm)" }}>
          <Text variant="caption" style={{ color: "var(--wv-text-secondary)" }}>
            Signed in as: {ROLE_LABEL[role]}
          </Text>
          <StateDisplay
            status="empty"
            title="No AI side-panel here"
            description="This workspace's data explanations appear inline on the page, not in a side panel."
          />
        </div>
      }
    >
      {children}
    </AppShell>
  );
}
