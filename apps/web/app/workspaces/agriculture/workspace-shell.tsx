"use client";

import { useState, type ReactNode } from "react";
import { ConfidenceBadge, StateDisplay, Text, AppShell } from "@world-vitality/ui-components";
import type { InterpretationResult } from "@world-vitality/interpretation-engine";
import { AppBrand } from "../../app-brand";
import { buildAppSidebar } from "../workspace-nav";

export interface WorkspaceShellProps {
  activeKey: "home" | "map" | "report";
  children: ReactNode;
  /**
   * Shown as the AI panel's headline summary. Since BUILD_PLAN "STAGE —
   * AGRICULTURE FIELDS" made this workspace real-multi-field, this is
   * deliberately just one representative result (the first visible
   * field's soil-moisture status), not an attempt to summarize every
   * field in one panel — each field's own full breakdown (both metrics,
   * both confidence badges) renders inline in its own card on the page
   * itself. A true multi-field AI panel would need real design work
   * this stage isn't scoped to do.
   */
  aiInterpretation?: InterpretationResult;
}

/**
 * Shared shell for the Agriculture workspace. Structurally
 * identical to the other workspaces' `workspace-shell.tsx` — the same
 * validation of PRD Section C's Modular Workspace Framework claim that
 * adding a workspace is "fundamentally a configuration and content
 * exercise."
 *
 * **Sidebar (BUILD_PLAN v89)** — built by `buildAppSidebar` and shared by
 * every signed-in page: Home, a "Workspaces" row (its label opens the
 * Workspaces page, its arrow folds the list of workspaces), then
 * Notifications and Settings. Agriculture's own sub-pages nest inside its
 * row and start expanded (`sidebar.defaultExpandedKeys`) since this *is*
 * the current workspace. `brand` is the shared `AppBrand` (app logo +
 * name, clickable back to `/dashboard`) rather than this workspace's own
 * name — that identity lives in the page's own `pageTitle` heading
 * instead, since the header brand slot is app-level chrome that should
 * be the same on every page, not page-specific content.
 */
export function WorkspaceShell({ activeKey, children, aiInterpretation }: WorkspaceShellProps) {
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const sidebar = buildAppSidebar({ workspaceKey: "agriculture", subKey: activeKey });

  return (
    <AppShell
      brand={<AppBrand />}
      sidebarSections={sidebar.sections}
      sidebarDefaultExpandedKeys={sidebar.defaultExpandedKeys}
      aiPanelOpen={aiPanelOpen}
      onToggleAiPanel={() => setAiPanelOpen((v) => !v)}
      aiPanelContent={
        aiInterpretation ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--wv-space-sm)" }}>
            <Text variant="body">{aiInterpretation.summary}</Text>
            <ConfidenceBadge level={aiInterpretation.confidence} showDescription />
            <Text variant="caption" style={{ color: "var(--wv-text-secondary)" }}>
              {aiInterpretation.explanation}
            </Text>
          </div>
        ) : (
          <StateDisplay
            status="empty"
            title="Nothing to interpret yet"
            description="Open Field Overview to see an AI-generated status."
          />
        )
      }
    >
      {children}
    </AppShell>
  );
}
