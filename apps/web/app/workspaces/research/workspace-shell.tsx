"use client";

import { useState, type ReactNode } from "react";
import { AppShell, StateDisplay, Text } from "@world-vitality/ui-components";
import { AppBrand } from "../../app-brand";
import { buildWorkspaceSidebarItems } from "../workspace-nav";

export interface WorkspaceShellProps {
  activeKey: "home" | "map";
  children: ReactNode;
}

/**
 * Shared shell for the Research workspace (BUILD_PLAN Stage 14 — the
 * fifth workspace). Same single-section, collapsible "Workspaces"
 * sidebar tree (BUILD_PLAN "STAGE — NESTED WORKSPACE SIDEBAR
 * NAVIGATION") and shared `AppBrand` as every other workspace shell.
 *
 * **Deliberately no `aiInterpretation` prop, unlike every other
 * workspace shell.** The PRD is explicit about this workspace's
 * design (Section A.9): "minimally interpreted, maximally
 * transparent" — researchers need the underlying data with full
 * provenance, not an AI-generated summary standing in front of it.
 * Every other workspace's AI panel shows an `InterpretationProvider`'s
 * output; building one here just for consistency with the other four
 * would work against the one design principle this specific workspace
 * exists to embody. The AI panel still exists (same `AppShell`
 * everyone else uses), but its content explains that choice instead of
 * showing a fabricated interpretation.
 */
export function WorkspaceShell({ activeKey, children }: WorkspaceShellProps) {
  const [aiPanelOpen, setAiPanelOpen] = useState(true);

  return (
    <AppShell
      brand={<AppBrand />}
      sidebarSections={[
        {
          key: "workspaces",
          label: "Workspaces",
          items: buildWorkspaceSidebarItems("research", activeKey),
        },
      ]}
      sidebarDefaultExpandedKeys={["research"]}
      aiPanelOpen={aiPanelOpen}
      onToggleAiPanel={() => setAiPanelOpen((v) => !v)}
      aiPanelContent={
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--wv-space-sm)" }}>
          <StateDisplay
            status="empty"
            title="No AI interpretation here, by design"
            description="Research keeps this panel deliberately raw — data appears in the Dataset Explorer table with full provenance, not summarized by an AI layer."
          />
          <Text variant="caption" style={{ color: "var(--wv-text-secondary)" }}>
            Every record's own provenance (source, license, retrieval time, known limitations) is
            shown inline in the table instead.
          </Text>
        </div>
      }
    >
      {children}
    </AppShell>
  );
}
