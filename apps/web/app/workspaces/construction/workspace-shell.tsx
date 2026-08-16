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
 * Shared shell for the Construction workspace (BUILD_PLAN Stage 12 —
 * the third workspace). Structurally identical to Agriculture's and
 * Weather & Climate's `workspace-shell.tsx` on purpose — same
 * validation of PRD Section C's Modular Workspace Framework claim that
 * adding a workspace is "fundamentally a configuration and content
 * exercise," now run a third time. The AppShell/sidebar wiring itself
 * stays copy-pasted per-shell (each still needs its own `brand` and
 * its own Home/Map labels), but the cross-workspace switcher links are
 * shared via `../workspace-nav` — three shells needing the identical
 * switcher list was the concrete "genuine third consumer" signal
 * Engineering Blueprint 4.5 calls for before extracting shared
 * content, and this ticket is that extraction.
 */
export function WorkspaceShell({ activeKey, children, aiInterpretation }: WorkspaceShellProps) {
  const [aiPanelOpen, setAiPanelOpen] = useState(true);

  return (
    <AppShell
      brand={<Text variant="sectionTitle">Construction</Text>}
      sidebarItems={[
        { key: "dashboard-home", label: "Home", href: "/dashboard" },
        ...WORKSPACE_LINKS.map((w) => ({
          key: `switch-${w.key}`,
          label: w.label,
          href: w.href,
          active: w.key === "construction",
        })),
        {
          key: "home",
          label: "Site Risk",
          href: "/workspaces/construction",
          active: activeKey === "home",
        },
        {
          key: "map",
          label: "Map",
          href: "/workspaces/construction/map",
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
            description="Open Site Risk to see an AI-generated status."
          />
        )
      }
    >
      {children}
    </AppShell>
  );
}
