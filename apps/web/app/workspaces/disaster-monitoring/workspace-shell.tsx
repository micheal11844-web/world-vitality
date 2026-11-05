"use client";

import { useState, type ReactNode } from "react";
import { StateDisplay, Text, AppShell } from "@world-vitality/ui-components";
import { useI18n } from "../../../lib/i18n/i18n-provider";
import { AppBrand } from "../../app-brand";
import { buildAppSidebar } from "../workspace-nav";

export interface WorkspaceShellProps {
  activeKey: "home" | "map";
  children: ReactNode;
}

/**
 * Shared shell for the Disaster Monitoring workspace (BUILD_PLAN
 * "STAGE — DISASTER MONITORING WORKSPACE"). Same single-section,
 * collapsible "Workspaces" sidebar tree (BUILD_PLAN "STAGE — NESTED
 * WORKSPACE SIDEBAR NAVIGATION") and shared `AppBrand` as every other
 * workspace shell.
 *
 * **Deliberately no `aiInterpretation` prop, same precedent as
 * `app/workspaces/research/workspace-shell.tsx`, for a related but
 * graver reason.** Research omits AI interpretation for a transparency
 * principle; here it's the Constitution's explicit "zero tolerance"
 * language for this specific workspace (Section A.7's "Special note"):
 * no engagement-optimization pattern of any kind belongs here, and
 * that includes anything that could look like this app assessing or
 * summarizing an official alert rather than relaying it as issued. The
 * AI panel still exists (same `AppShell` everyone else uses), but its
 * content explains that choice instead of showing a fabricated
 * interpretation — same honest-empty-state pattern Research already
 * established.
 */
export function WorkspaceShell({ activeKey, children }: WorkspaceShellProps) {
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const { t } = useI18n();
  const sidebar = buildAppSidebar({ workspaceKey: "disaster-monitoring", subKey: activeKey, t });

  return (
    <AppShell
      brand={<AppBrand />}
      sidebarSections={sidebar.sections}
      sidebarDefaultExpandedKeys={sidebar.defaultExpandedKeys}
      aiPanelOpen={aiPanelOpen}
      onToggleAiPanel={() => setAiPanelOpen((v) => !v)}
      aiPanelContent={
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--wv-space-sm)" }}>
          <StateDisplay
            status="empty"
            title={t("dm.aiPanel.title")}
            description={t("dm.aiPanel.body")}
          />
          <Text variant="caption" style={{ color: "var(--wv-text-secondary)" }}>
            {t("dm.aiPanel.ethics")}
          </Text>
        </div>
      }
    >
      {children}
    </AppShell>
  );
}
