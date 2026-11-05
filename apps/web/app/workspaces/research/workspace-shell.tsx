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
 * Shared shell for the Research workspace (BUILD_PLAN Stage 14 — the
 * fifth workspace). Same single-section, collapsible "Workspaces"
 * sidebar tree (BUILD_PLAN "STAGE — NESTED WORKSPACE SIDEBAR
 * NAVIGATION") and shared `AppBrand` as every other workspace shell.
 *
 * **Deliberately no `aiInterpretation` prop, unlike every other
 * workspace shell.** The PRD is explicit about this workspace's
 * design (Section A.9): "minimally interpreted, maximally
 * transparent" — researchers need the underlying data with full
 * provenance, not an AI-generated summary standing in front of it.
 * Every other workspace's AI panel shows an `InterpretationProvider`'s
 * output; building one here just for consistency with the other four
 * would work against the one design principle this specific workspace
 * exists to embody. The AI panel still exists (same `AppShell`
 * everyone else uses), but its content explains that choice instead of
 * showing a fabricated interpretation.
 */
export function WorkspaceShell({ activeKey, children }: WorkspaceShellProps) {
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const { t } = useI18n();
  const sidebar = buildAppSidebar({ workspaceKey: "research", subKey: activeKey, t });

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
            title={t("research.aiPanel.title")}
            description={t("research.aiPanel.body")}
          />
          <Text variant="caption" style={{ color: "var(--wv-text-secondary)" }}>
            {t("research.aiPanel.provenance")}
          </Text>
        </div>
      }
    >
      {children}
    </AppShell>
  );
}
