"use client";

import { AppShell } from "@world-vitality/ui-components";
import { useState, type ReactNode } from "react";
import { AppBrand } from "../../../app-brand";
import { buildWorkspaceSidebarItems } from "../../workspace-nav";

export interface TeamShellProps {
  /** The workspace whose team this is, so the sidebar can show where you are. */
  workspaceId: string;
  children: ReactNode;
}

/**
 * Workspace-agnostic shell for the generic Team page (BUILD_PLAN "STAGE —
 * TEAM/INVITE UI"). A server `page.tsx` cannot pass a plain function prop
 * (like `AppShell`'s required `onToggleAiPanel`) to `AppShell` directly,
 * since `AppShell` is a Client Component and only Server Actions may cross
 * that boundary as functions — every other workspace already solves this
 * the same way, by having its own `workspace-shell.tsx` Client Component
 * own the toggle state locally and take only serializable props from its
 * server page. This is that same pattern.
 *
 * The sidebar is the same shared workspace tree every other page shows,
 * with this workspace expanded and its Team entry marked as the current
 * page. It used to be an empty rail — which, on a desktop screen, left a
 * blank 240px column and nowhere to go but the browser's back button.
 * There is still no workspace-specific AI panel content here: the team
 * page has nothing for the assistant to interpret.
 */
export function TeamShell({ workspaceId, children }: TeamShellProps) {
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  return (
    <AppShell
      brand={<AppBrand />}
      sidebarSections={[
        {
          key: "workspaces",
          label: "Workspaces",
          items: buildWorkspaceSidebarItems(workspaceId, "team"),
        },
      ]}
      sidebarDefaultExpandedKeys={[workspaceId]}
      aiPanelOpen={aiPanelOpen}
      onToggleAiPanel={() => setAiPanelOpen((v) => !v)}
    >
      {children}
    </AppShell>
  );
}
