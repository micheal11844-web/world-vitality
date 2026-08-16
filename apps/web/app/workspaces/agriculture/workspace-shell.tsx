"use client";

import { useState, type ReactNode } from "react";
import { AppShell, Text, ConfidenceBadge, StateDisplay } from "@world-vitality/ui-components";
import type { InterpretationResult } from "@world-vitality/interpretation-engine";
import { WORKSPACE_LINKS } from "../workspace-nav";

export interface WorkspaceShellProps {
  activeKey: "home" | "map";
  children: ReactNode;
  /** The soil-moisture interpretation result to surface in the AI
   *  Panel — passed down from the Server Component page that already
   *  fetched it, so this doesn't re-run the interpretation itself. */
  aiInterpretation?: InterpretationResult;
}

/**
 * Shared shell for every Agriculture workspace page, wiring the AI
 * Panel to the Stage 4 soil-moisture capability (ticket 6.5).
 *
 * Kept as one small client component reused by both `page.tsx` (Home)
 * and `map/page.tsx`, rather than duplicating the `AppShell` wiring in
 * each — same "no per-app duplication" principle `ui-components` itself
 * follows (Engineering Blueprint Section 4.5).
 *
 * **Honest scope**: this renders the interpretation result and its
 * confidence badge in the panel — real wiring to real Stage 4 output —
 * but there's no actual conversational turn-taking (asking a follow-up
 * question, `userQuery` on `InterpretationRequest` is unused here). That
 * would need a chat UI and a request/response loop this ticket doesn't
 * build. What Section 4's "contextually aware of whatever the user is
 * currently viewing" gets today: the panel shows the interpretation for
 * *this* page's data, automatically, without the user asking — the
 * "aware of context" part is real; the "conversational" part isn't yet.
 */
export function WorkspaceShell({ activeKey, children, aiInterpretation }: WorkspaceShellProps) {
  const [aiPanelOpen, setAiPanelOpen] = useState(true);

  return (
    <AppShell
      brand={<Text variant="sectionTitle">Agriculture</Text>}
      sidebarItems={[
        { key: "dashboard-home", label: "Home", href: "/dashboard" },
        ...WORKSPACE_LINKS.map((w) => ({
          key: `switch-${w.key}`,
          label: w.label,
          href: w.href,
          active: w.key === "agriculture",
        })),
        {
          key: "home",
          label: "Field Overview",
          href: "/workspaces/agriculture",
          active: activeKey === "home",
        },
        {
          key: "map",
          label: "Map",
          href: "/workspaces/agriculture/map",
          active: activeKey === "map",
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
            description="Open Field Overview to see an AI-generated status."
          />
        )
      }
    >
      {children}
    </AppShell>
  );
}
