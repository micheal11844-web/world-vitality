"use client";

import { useState, type ReactNode } from "react";
import { AppShell, Text, ConfidenceBadge, StateDisplay } from "@world-vitality/ui-components";
import type { InterpretationResult } from "@world-vitality/interpretation-engine";
import { WORKSPACE_LINKS } from "../workspace-nav";

export interface WorkspaceShellProps {
  activeKey: "home" | "map";
  children: ReactNode;
  aiInterpretation?: InterpretationResult;
}

/**
 * Shared shell for the Renewable Energy workspace (BUILD_PLAN Stage
 * 13 — the fourth workspace). Structurally identical to the other
 * three workspaces' `workspace-shell.tsx` — the fourth run of the same
 * "adding a workspace is a configuration and content exercise" test.
 * Reuses the shared `WORKSPACE_LINKS` cross-workspace switcher (Stage
 * 12.6) rather than adding a fifth near-identical hardcoded list.
 */
export function WorkspaceShell({ activeKey, children, aiInterpretation }: WorkspaceShellProps) {
  const [aiPanelOpen, setAiPanelOpen] = useState(true);

  return (
    <AppShell
      brand={<Text variant="sectionTitle">Renewable Energy</Text>}
      sidebarItems={[
        { key: "dashboard-home", label: "Home", href: "/dashboard" },
        ...WORKSPACE_LINKS.map((w) => ({
          key: `switch-${w.key}`,
          label: w.label,
          href: w.href,
          active: w.key === "renewable-energy",
        })),
        {
          key: "home",
          label: "Generation Outlook",
          href: "/workspaces/renewable-energy",
          active: activeKey === "home",
        },
        {
          key: "map",
          label: "Map",
          href: "/workspaces/renewable-energy/map",
          active: activeKey === "map",
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
            description="Open Generation Outlook to see an AI-generated status."
          />
        )
      }
    >
      {children}
    </AppShell>
  );
}
