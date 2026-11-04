"use client";

import { useState, type ReactNode } from "react";
import { ConfidenceBadge, StateDisplay, Text, AppShell } from "@world-vitality/ui-components";
import type { InterpretationResult } from "@world-vitality/interpretation-engine";
import { useI18n } from "../../../lib/i18n/i18n-provider";
import { AppBrand } from "../../app-brand";
import { buildAppSidebar } from "../workspace-nav";

export interface WorkspaceShellProps {
  activeKey: "home" | "map";
  children: ReactNode;
  aiInterpretation?: InterpretationResult;
}

/**
 * Shared shell for the Logistics & Shipping workspace. Structurally
 * identical to every other workspace's `workspace-shell.tsx` — the
 * same validation of PRD Section C's Modular Workspace Framework claim
 * that adding a workspace is "fundamentally a configuration and
 * content exercise," now demonstrated a sixth time. Same single-
 * section, collapsible "Workspaces" sidebar tree as every other
 * workspace (BUILD_PLAN "STAGE — NESTED WORKSPACE SIDEBAR NAVIGATION").
 */
export function WorkspaceShell({ activeKey, children, aiInterpretation }: WorkspaceShellProps) {
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const { t, locale } = useI18n();
  const sidebar = buildAppSidebar({ workspaceKey: "logistics", subKey: activeKey, t });
  // The engine writes its interpretation in English and it is not translated
  // yet, so on a translated page it is marked as English text.
  const englishOnly = locale === "en" ? {} : ({ lang: "en", dir: "ltr" } as const);

  return (
    <AppShell
      brand={<AppBrand />}
      sidebarSections={sidebar.sections}
      sidebarDefaultExpandedKeys={sidebar.defaultExpandedKeys}
      aiPanelOpen={aiPanelOpen}
      onToggleAiPanel={() => setAiPanelOpen((v) => !v)}
      aiPanelContent={
        aiInterpretation ? (
          <div
            {...englishOnly}
            style={{ display: "flex", flexDirection: "column", gap: "var(--wv-space-sm)" }}
          >
            <Text variant="body">{aiInterpretation.summary}</Text>
            <ConfidenceBadge level={aiInterpretation.confidence} showDescription />
            <Text variant="caption" style={{ color: "var(--wv-text-secondary)" }}>
              {aiInterpretation.explanation}
            </Text>
          </div>
        ) : (
          <StateDisplay
            status="empty"
            title={t("workspace.aiPanel.emptyTitle")}
            description={t("logistics.aiPanel.emptyBody")}
          />
        )
      }
    >
      {children}
    </AppShell>
  );
}
