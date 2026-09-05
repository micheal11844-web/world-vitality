"use client";

import { useState, type ReactNode } from "react";
import { AppShell, ConfidenceBadge, StateDisplay, Text } from "@world-vitality/ui-components";
import type { InterpretationResult } from "@world-vitality/interpretation-engine";
import type { Role } from "@world-vitality/identity-service";
import { AppBrand } from "../../app-brand";
import { buildWorkspaceSidebarItems } from "../workspace-nav";

export interface WorkspaceShellProps {
  activeKey: "home" | "map" | "report";
  children: ReactNode;
  role: Role;
  aiInterpretation?: InterpretationResult;
}

const ROLE_LABEL: Record<Role, string> = {
  admin_owner: "Agency Admin",
  operational_user: "Analyst",
  scoped_field_user: "Field Staff",
  viewer_external: "Partner Agency (view-only)",
};

/**
 * Shared shell for the Government & NGOs workspace (BUILD_PLAN "STAGE
 * — GOVERNMENT & NGOS WORKSPACE"). Same single-section, collapsible
 * "Workspaces" sidebar tree (BUILD_PLAN "STAGE — NESTED WORKSPACE
 * SIDEBAR NAVIGATION") and shared `AppBrand` as every other workspace
 * shell. Its "Report" sub-page is now listed in the sidebar tree too —
 * previously only reachable via the "Open Report" button on the home
 * page, a real, pre-existing inconsistency fixed while centralizing
 * this list (see `workspace-nav.ts`'s own comment).
 *
 * **This is the first workspace shell to display the signed-in user's
 * actual role** — `role` is passed down from `page.tsx`, which
 * resolved it via `get-workspace-role.ts`'s real (if newly-wired)
 * lookup. `ROLE_LABEL` maps this app's generic four-role model onto
 * PRD A.10's specific role names (Agency Admin/Analyst/Field
 * Staff/Partner Agency) — a real, honest mapping, not a fabricated
 * fifth role system.
 */
export function WorkspaceShell({
  activeKey,
  children,
  role,
  aiInterpretation,
}: WorkspaceShellProps) {
  const [aiPanelOpen, setAiPanelOpen] = useState(true);

  return (
    <AppShell
      brand={<AppBrand />}
      sidebarSections={[
        {
          key: "workspaces",
          label: "Workspaces",
          items: buildWorkspaceSidebarItems("government-ngos", activeKey),
        },
      ]}
      sidebarDefaultExpandedKeys={["government-ngos"]}
      aiPanelOpen={aiPanelOpen}
      onToggleAiPanel={() => setAiPanelOpen((v) => !v)}
      aiPanelContent={
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--wv-space-sm)" }}>
          <Text variant="caption" style={{ color: "var(--wv-text-secondary)" }}>
            Signed in as: {ROLE_LABEL[role]}
          </Text>
          {aiInterpretation ? (
            <>
              <Text variant="body">{aiInterpretation.summary}</Text>
              <ConfidenceBadge level={aiInterpretation.confidence} showDescription />
            </>
          ) : (
            <StateDisplay
              status="empty"
              title="Nothing to interpret yet"
              description="Open Jurisdiction Overview to see an AI-generated status."
            />
          )}
        </div>
      }
    >
      {children}
    </AppShell>
  );
}
