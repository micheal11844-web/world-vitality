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
 * Shared shell for the Disaster Monitoring workspace (BUILD_PLAN
 * "STAGE — DISASTER MONITORING WORKSPACE"). Same single-section,
 * collapsible "Workspaces" sidebar tree (BUILD_PLAN "STAGE — NESTED
 * WORKSPACE SIDEBAR NAVIGATION") and shared `AppBrand` as every other
 * workspace shell.
 *
 * **Deliberately no `aiInterpretation` prop, same precedent as
 * `app/workspaces/research/workspace-shell.tsx`, for a related but
 * graver reason.** Research omits AI interpretation for a transparency
 * principle; here it's the Constitution's explicit "zero tolerance"
 * language for this specific workspace (Section A.7's "Special note"):
 * no engagement-optimization pattern of any kind belongs here, and
 * that includes anything that could look like this app assessing or
 * summarizing an official alert rather than relaying it as issued. The
 * AI panel still exists (same `AppShell` everyone else uses), but its
 * content explains that choice instead of showing a fabricated
 * interpretation — same honest-empty-state pattern Research already
 * established.
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
          items: buildWorkspaceSidebarItems("disaster-monitoring", activeKey),
        },
      ]}
      sidebarDefaultExpandedKeys={["disaster-monitoring"]}
      aiPanelOpen={aiPanelOpen}
      onToggleAiPanel={() => setAiPanelOpen((v) => !v)}
      aiPanelContent={
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--wv-space-sm)" }}>
          <StateDisplay
            status="empty"
            title="No AI interpretation here, by design"
            description="Alerts are shown exactly as issued by the National Weather Service — not summarized, scored, or reinterpreted by this app."
          />
          <Text variant="caption" style={{ color: "var(--wv-text-secondary)" }}>
            This workspace carries the platform's highest ethical weight (Constitution Section 7 and
            9, zero tolerance). Always follow guidance from local authorities.
          </Text>
        </div>
      }
    >
      {children}
    </AppShell>
  );
}
