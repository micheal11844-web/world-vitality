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
 * Shared shell for the Logistics & Shipping workspace. Structurally
 * identical to every other workspace's `workspace-shell.tsx` — the
 * same validation of PRD Section C's Modular Workspace Framework claim
 * that adding a workspace is "fundamentally a configuration and
 * content exercise," now demonstrated a sixth time.
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
            active: w.key === "logistics",
          })),
        },
        {
          key: "this-workspace",
          label: "This Workspace",
          items: [
            {
              key: "home",
              label: "Route Risk",
              href: "/workspaces/logistics",
              active: activeKey === "home",
            },
            {
              key: "map",
              label: "Map",
              href: "/workspaces/logistics/map",
              active: activeKey === "map",
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
            description="Open Route Risk to see an AI-generated status."
          />
        )
      }
    >
      {children}
    </AppShell>
  );
}
