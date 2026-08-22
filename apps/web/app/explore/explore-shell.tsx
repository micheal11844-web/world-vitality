"use client";

import { type ReactNode, useState } from "react";
import { AppShell, ConfidenceBadge, StateDisplay, Text } from "@world-vitality/ui-components";
import type { InterpretationResult } from "@world-vitality/interpretation-engine";
import { AppBrand } from "../app-brand";
import { WORKSPACE_LINKS } from "../workspaces/workspace-nav";

export interface ExploreShellProps {
  children: ReactNode;
  aiInterpretation?: InterpretationResult;
}

/**
 * Structurally the same `AppShell` wrapper pattern every workspace's
 * own `workspace-shell.tsx` already uses (see e.g.
 * `app/workspaces/weather/workspace-shell.tsx`'s doc comment on why
 * that repetition is intentional, not yet a "promote to a shared
 * package" trigger).
 *
 * **Deliberately not gated, and deliberately links into the gated
 * workspaces anyway:** unlike every `workspace-shell.tsx`, this page
 * sits outside `app/workspaces/layout.tsx`'s session check — Public
 * Explorer's PRD mission is explicit: "No sign-up required for first
 * exploration." The sidebar still lists the five vertical workspaces
 * via the same shared `WORKSPACE_LINKS` — clicking one as an anonymous
 * visitor hits the existing `/login` redirect, which is exactly the
 * PRD's own described "natural upgrade path: if usage patterns suggest
 * a professional need... the platform suggests the relevant vertical
 * workspace" — not a bug to special-case around.
 */
export function ExploreShell({ children, aiInterpretation }: ExploreShellProps) {
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
            active: false,
          })),
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
            description="Search a place to see an AI-generated insight about it."
          />
        )
      }
    >
      {children}
    </AppShell>
  );
}
