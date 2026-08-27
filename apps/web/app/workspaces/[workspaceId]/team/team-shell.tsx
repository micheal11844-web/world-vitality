"use client";

import { useState, type ReactNode } from "react";
import { AppShell } from "@world-vitality/ui-components";
import { AppBrand } from "../../../app-brand";

export interface TeamShellProps {
  children: ReactNode;
}

/**
 * Minimal, workspace-agnostic shell for the generic Team page (BUILD_PLAN
 * "STAGE — TEAM/INVITE UI"). A server `page.tsx` cannot pass a plain
 * function prop (like `AppShell`'s required `onToggleAiPanel`) to
 * `AppShell` directly, since `AppShell` is a Client Component and only
 * Server Actions may cross that boundary as functions — every other
 * workspace already solves this the same way, by having its own
 * `workspace-shell.tsx` Client Component own the toggle state locally
 * and take only serializable props from its server page. This is that
 * same pattern, deliberately without any of the sidebar/AI-panel
 * richness those other shells have — see `team/page.tsx`'s doc comment
 * for why that's an intentional, honest simplification here.
 */
export function TeamShell({ children }: TeamShellProps) {
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  return (
    <AppShell
      brand={<AppBrand />}
      sidebarSections={[]}
      aiPanelOpen={aiPanelOpen}
      onToggleAiPanel={() => setAiPanelOpen((v) => !v)}
    >
      {children}
    </AppShell>
  );
}
