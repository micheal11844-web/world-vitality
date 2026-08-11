"use client";

import { useState, type ReactNode } from "react";
import { AppShell, Text, ConfidenceBadge, StateDisplay } from "@world-vitality/ui-components";
import type { InterpretationResult } from "@world-vitality/interpretation-engine";

export interface WorkspaceShellProps {
  activeKey: "home";
  children: ReactNode;
  aiInterpretation?: InterpretationResult;
}

/**
 * Shared shell for the Weather & Climate workspace (BUILD_PLAN Stage
 * 10 — the second workspace, un-deferred from BUILD_PLAN's own
 * deferred list at the owner's explicit request). Structurally
 * identical to Agriculture's `workspace-shell.tsx` on purpose — this is
 * the real validation of whether that pattern generalizes to a second
 * workspace, per PRD Section C's Modular Workspace Framework claim
 * that "adding a new Workspace is fundamentally a configuration and
 * content exercise... not a new technical platform." Kept as its own
 * small file (not extracted into a shared `packages/` component) since
 * Engineering Blueprint 4.5 promotes to shared only once a genuine
 * *third* consumer exists — two nearly-identical files is exactly the
 * signal to watch for that promotion, not yet the trigger for it.
 */
export function WorkspaceShell({ activeKey, children, aiInterpretation }: WorkspaceShellProps) {
  const [aiPanelOpen, setAiPanelOpen] = useState(true);

  return (
    <AppShell
      brand={<Text variant="sectionTitle">Weather & Climate</Text>}
      sidebarItems={[
        {
          key: "home",
          label: "Current Conditions",
          href: "/workspaces/weather",
          active: activeKey === "home",
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
