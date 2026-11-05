"use client";

import { useState, type ReactNode } from "react";
import type { MessageKey } from "@world-vitality/i18n";
import { StateDisplay, Text, AppShell } from "@world-vitality/ui-components";
import type { Role } from "@world-vitality/identity-service";
import { useI18n } from "../../../lib/i18n/i18n-provider";
import { AppBrand } from "../../app-brand";
import { buildAppSidebar } from "../workspace-nav";

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
const ROLE_LABEL: Record<Role, MessageKey> = {
  admin_owner: "edu.role.admin_owner",
  operational_user: "edu.role.operational_user",
  scoped_field_user: "edu.role.scoped_field_user",
  viewer_external: "edu.role.viewer_external",
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
  const { t } = useI18n();
  const sidebar = buildAppSidebar({ workspaceKey: "education", subKey: activeKey, t });

  return (
    <AppShell
      brand={<AppBrand />}
      sidebarSections={sidebar.sections}
      sidebarDefaultExpandedKeys={sidebar.defaultExpandedKeys}
      aiPanelOpen={aiPanelOpen}
      onToggleAiPanel={() => setAiPanelOpen((v) => !v)}
      aiPanelContent={
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--wv-space-sm)" }}>
          <Text variant="caption" style={{ color: "var(--wv-text-secondary)" }}>
            {t("workspace.signedInAs", { role: t(ROLE_LABEL[role]) })}
          </Text>
          <StateDisplay
            status="empty"
            title={t("edu.aiPanel.title")}
            description={t("edu.aiPanel.body")}
          />
        </div>
      }
    >
      {children}
    </AppShell>
  );
}
