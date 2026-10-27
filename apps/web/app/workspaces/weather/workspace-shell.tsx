"use client";

import { useState, type ReactNode } from "react";
import { ConfidenceBadge, StateDisplay, Text, AppShell } from "@world-vitality/ui-components";
import type { InterpretationResult } from "@world-vitality/interpretation-engine";
import { useOptionalI18n } from "../../../lib/i18n/i18n-provider";
import { AppBrand } from "../../app-brand";
import { buildAppSidebar } from "../workspace-nav";

export interface WorkspaceShellProps {
  activeKey: "home" | "map";
  children: ReactNode;
  aiInterpretation?: InterpretationResult;
}

/**
 * Shared shell for the Weather & Climate workspace. Structurally
 * identical to the other workspaces' `workspace-shell.tsx` — the same
 * validation of PRD Section C's Modular Workspace Framework claim that
 * adding a workspace is "fundamentally a configuration and content
 * exercise."
 *
 * **Sidebar layout (BUILD_PLAN "STAGE — NESTED WORKSPACE SIDEBAR
 * NAVIGATION")** — a single "Workspaces" section, built once by
 * `buildWorkspaceSidebarItems` and shared across every workspace shell,
 * rather than this file hand-rolling its own "Workspaces" + "This
 * Workspace" section pair. Each workspace renders as a collapsible row
 * with a disclosure chevron; Weather & Climate's own sub-pages nest
 * inside its row rather than living in a separate section, and start
 * expanded here since this *is* the current workspace. `brand` is the
 * shared `AppBrand` (app logo + name, clickable back to `/dashboard`)
 * rather than this workspace's own name — that identity lives in the
 * page's own `pageTitle` heading instead, since the header brand slot is
 * app-level chrome that should be the same on every page, not
 * page-specific content.
 */
export function WorkspaceShell({ activeKey, children, aiInterpretation }: WorkspaceShellProps) {
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  // Translated on the home page (which sits in a LocaleBoundary), English on
  // the map page (which does not yet) — this shell serves both.
  const i18n = useOptionalI18n();
  const sidebar = buildAppSidebar({ workspaceKey: "weather", subKey: activeKey, t: i18n?.t });
  // The interpretation is written in English by the engine and is not
  // translated yet, so on a translated page it is marked as English text
  // (same convention as the Dashboard's live-conditions card).
  const englishOnly = i18n && i18n.locale !== "en" ? ({ lang: "en", dir: "ltr" } as const) : {};

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
            title={i18n ? i18n.t("weather.aiPanel.emptyTitle") : "Nothing to interpret yet"}
            description={
              i18n
                ? i18n.t("weather.aiPanel.emptyBody")
                : "Open Current Conditions to see an AI-generated status."
            }
          />
        )
      }
    >
      {children}
    </AppShell>
  );
}
