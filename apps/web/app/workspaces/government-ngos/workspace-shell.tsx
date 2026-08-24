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

const ROLE_LABEL: Record<Role, string> = {
  admin_owner: "Agency Admin",
  operational_user: "Analyst",
  scoped_field_user: "Field Staff",
  viewer_external: "Partner Agency (view-only)",
};

/**
 * Shared shell for the Government & NGOs workspace (BUILD_PLAN "STAGE
 * — GOVERNMENT & NGOS WORKSPACE"). Same grouped sidebar and shared
 * `AppBrand` as every other workspace shell.
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
          items: WORKSPACE_LINKS.map((w) => ({
            key: `switch-${w.key}`,
            label: w.label,
            href: w.href,
            active: w.key === "government-ngos",
          })),
        },
        {
          key: "this-workspace",
          label: "This Workspace",
          items: [
            {
              key: "home",
              label: "Jurisdiction Overview",
              href: "/workspaces/government-ngos",
              active: activeKey === "home",
            },
            {
              key: "map",
              label: "Map",
              href: "/workspaces/government-ngos/map",
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
