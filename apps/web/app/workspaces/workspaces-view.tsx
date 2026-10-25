"use client";

import { useState } from "react";
import { AppShell, StateDisplay, Text } from "@world-vitality/ui-components";
import { useI18n } from "../../lib/i18n/i18n-provider";
import { AppBrand } from "../app-brand";
import { buildAppSidebar } from "./workspace-nav";
import { WorkspaceCardGrid } from "./workspace-cards";

export function WorkspacesView({ recommendedKey }: { recommendedKey: string | null }) {
  const { t } = useI18n();
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const sidebar = buildAppSidebar({ current: "workspaces", t });

  return (
    <AppShell
      brand={<AppBrand />}
      sidebarSections={sidebar.sections}
      sidebarDefaultExpandedKeys={sidebar.defaultExpandedKeys}
      aiPanelOpen={aiPanelOpen}
      onToggleAiPanel={() => setAiPanelOpen((v) => !v)}
      aiPanelContent={
        <StateDisplay
          status="empty"
          title={t("chrome.aiPanel.emptyTitle")}
          description={t("chrome.aiPanel.emptyBody")}
        />
      }
    >
      <Text variant="pageTitle" as="h1" style={{ marginBottom: "var(--wv-space-md)" }}>
        {t("dashboard.yourWorkspaces")}
      </Text>
      <WorkspaceCardGrid recommendedKey={recommendedKey} />
    </AppShell>
  );
}
