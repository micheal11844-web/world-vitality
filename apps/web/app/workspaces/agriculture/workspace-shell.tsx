"use client";

import { useState, type ReactNode } from "react";
import { AppShell, ConfidenceBadge, StateDisplay, Text } from "@world-vitality/ui-components";
import type { InterpretationResult } from "@world-vitality/interpretation-engine";
import { AppBrand } from "../../app-brand";
import { buildWorkspaceSidebarItems } from "../workspace-nav";

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
 * **Sidebar layout (BUILD_PLAN "STAGE — NESTED WORKSPACE SIDEBAR
 * NAVIGATION")** — a single "Workspaces" section, built once by
 * `buildWorkspaceSidebarItems` and shared across every workspace shell,
 * rather than this file hand-rolling its own "Workspaces" + "This
 * Workspace" section pair. Each workspace renders as a collapsible row
 * with a disclosure chevron; Agriculture's own sub-pages nest inside
 * its row rather than living in a separate section, and start expanded
 * here (`sidebarDefaultExpandedKeys={["agriculture"]}`) since this
 * *is* the current workspace. `brand` is the shared `AppBrand` (app
 * logo + name, clickable back to `/dashboard`) rather than this
 * workspace's own name — that identity lives in the page's own
 * `pageTitle` heading instead, since the header brand slot is app-level
 * chrome that should be the same on every page, not page-specific
 * content.
 */
export function WorkspaceShell({ activeKey, children, aiInterpretation }: WorkspaceShellProps) {
  const [aiPanelOpen, setAiPanelOpen] = useState(true);

  return (
    <AppShell
      brand={<AppBrand />}
      sidebarSections={[
        {
          key: "workspaces",
          label: "Workspaces",
          items: buildWorkspaceSidebarItems("agriculture", activeKey),
        },
      ]}
      sidebarDefaultExpandedKeys={["agriculture"]}
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
