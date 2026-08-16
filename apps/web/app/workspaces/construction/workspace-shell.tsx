"use client";

import { useState, type ReactNode } from "react";
import { AppShell, Text, ConfidenceBadge, StateDisplay } from "@world-vitality/ui-components";
import type { InterpretationResult } from "@world-vitality/interpretation-engine";

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
 * exercise," now run a third time. Kept as its own small file rather
 * than extracted into `packages/`, same reasoning as Weather's own
 * comment: Engineering Blueprint 4.5 promotes to shared only once a
 * genuine consumer beyond copy-paste reveals what's actually common —
 * three near-identical files is closer to that signal than two was,
 * but not yet acted on here since that's a real refactor decision
 * worth its own deliberate ticket, not a drive-by change bundled into
 * this one.
 */
export function WorkspaceShell({ activeKey, children, aiInterpretation }: WorkspaceShellProps) {
  const [aiPanelOpen, setAiPanelOpen] = useState(true);

  return (
    <AppShell
      brand={<Text variant="sectionTitle">Construction</Text>}
      sidebarItems={[
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
