"use client";

import { useState, type ReactNode } from "react";
import { AppShell, ConfidenceBadge, StateDisplay, Text } from "@world-vitality/ui-components";
import type { InterpretationResult } from "@world-vitality/interpretation-engine";
import type { Role } from "@world-vitality/identity-service";
import { AppBrand } from "../../app-brand";
import { WORKSPACE_LINKS } from "../workspace-nav";

export interface WorkspaceShellProps {
  activeKey: "home" | "map";
  children: ReactNode;
  role: Role;
  aiInterpretation?: InterpretationResult;
}

// PRD A.3's own role names (Admin, Underwriter, Claims Adjuster,
// Analyst/Read-only), mapped onto this app's generic four-role model —
// same honest-mapping approach `government-ngos/workspace-shell.tsx`
// used for its own PRD-specific role names, not a fabricated fifth
// role system. `scoped_field_user` → Claims Adjuster carries the same
// caveat as everywhere else in this app: resource-level scoping
// (PRD's "scoped to relevant claims") has no populated data to scope
// to yet, so this role currently behaves workspace-wide, same as
// `operational_user` minus report creation.
const ROLE_LABEL: Record<Role, string> = {
  admin_owner: "Admin",
  operational_user: "Underwriter",
  scoped_field_user: "Claims Adjuster",
  viewer_external: "Analyst (read-only)",
};

/**
 * Shared shell for the Insurance workspace (BUILD_PLAN "STAGE —
 * INSURANCE WORKSPACE"). Structurally identical to every other
 * workspace shell — `AppShell` wrapper, grouped sidebar, AI panel
 * showing the signed-in user's role plus whatever interpretation
 * result the calling page passes down.
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
          items: WORKSPACE_LINKS.map((w) => ({
            key: `switch-${w.key}`,
            label: w.label,
            href: w.href,
            active: w.key === "insurance",
          })),
        },
        {
          key: "this-workspace",
          label: "This Workspace",
          items: [
            {
              key: "home",
              label: "Underwriting Risk Context",
              href: "/workspaces/insurance",
              active: activeKey === "home",
            },
            {
              key: "map",
              label: "Map",
              href: "/workspaces/insurance/map",
              active: activeKey === "map",
            },
          ],
        },
      ]}
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
              description="Open Underwriting Risk Context to see an AI-generated status."
            />
          )}
        </div>
      }
    >
      {children}
    </AppShell>
  );
}
