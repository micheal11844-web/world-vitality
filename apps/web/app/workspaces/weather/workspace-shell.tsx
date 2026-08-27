"use client";

import { useState, type ReactNode } from "react";
import { AppShell, ConfidenceBadge, StateDisplay, Text } from "@world-vitality/ui-components";
import type { InterpretationResult } from "@world-vitality/interpretation-engine";
import { AppBrand } from "../../app-brand";
import { WORKSPACE_LINKS } from "../workspace-nav";

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
 * **Sidebar layout (BUILD_PLAN Stage 13 follow-up)** — two distinct
 * sections rather than one flat list: "Workspaces" (the cross-workspace
 * switcher, shared via `../workspace-nav`) and "This Workspace" (pages
 * within Weather & Climate specifically). Previously these were
 * interleaved in a single list, which read as "colliding" once a
 * workspace was open — a page-switcher item and a page-within-workspace
 * item looked the same and sat next to each other with no visual
 * separation. `brand` is now the shared `AppBrand` (app logo + name,
 * clickable back to `/dashboard`) rather than this workspace's own
 * name — that identity now lives in the page's own `pageTitle` heading
 * instead, since the header brand slot is app-level chrome that should
 * be the same on every page, not page-specific content.
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
          items: WORKSPACE_LINKS.map((w) => ({
            key: `switch-${w.key}`,
            label: w.label,
            href: w.href,
            active: w.key === "weather",
          })),
        },
        {
          key: "this-workspace",
          label: "This Workspace",
          items: [
            {
              key: "home",
              label: "Current Conditions",
              href: "/workspaces/weather",
              active: activeKey === "home",
            },
            {
              key: "map",
              label: "Map",
              href: "/workspaces/weather/map",
              active: activeKey === "map",
            },
            {
              key: "team",
              label: "Team",
              href: "/workspaces/weather/team",
              active: false,
            },
          ],
        },
      ]}
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
            description="Open Current Conditions to see an AI-generated status."
          />
        )
      }
    >
      {children}
    </AppShell>
  );
}
