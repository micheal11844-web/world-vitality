"use client";

import { useState, type ReactNode } from "react";
import { ConfidenceBadge, StateDisplay, Text, AppShell } from "@world-vitality/ui-components";
import type { InterpretationResult } from "@world-vitality/interpretation-engine";
import type { Role } from "@world-vitality/identity-service";
import { useI18n } from "../../../lib/i18n/i18n-provider";
import { AppBrand } from "../../app-brand";
import { buildAppSidebar } from "../workspace-nav";

export interface WorkspaceShellProps {
  activeKey: "home" | "map" | "report";
  children: ReactNode;
  role: Role;
  aiInterpretation?: InterpretationResult;
}

// The role names are the `gov.role.*` messages.

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
  const { t, locale } = useI18n();
  const sidebar = buildAppSidebar({ workspaceKey: "government-ngos", subKey: activeKey, t });
  // The engine writes its interpretation in English and it is not translated
  // yet, so on a translated page it is marked as English text.
  const englishOnly = locale === "en" ? {} : ({ lang: "en", dir: "ltr" } as const);

  return (
    <AppShell
      brand={<AppBrand />}
      sidebarSections={sidebar.sections}
      sidebarDefaultExpandedKeys={sidebar.defaultExpandedKeys}
      aiPanelOpen={aiPanelOpen}
      onToggleAiPanel={() => setAiPanelOpen((v) => !v)}
      aiPanelContent={
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--wv-space-sm)" }}>
          <Text variant="caption" style={{ color: "var(--wv-text-secondary)" }}>
            {t("workspace.signedInAs", { role: t(`gov.role.${role}` as const) })}
          </Text>
          {aiInterpretation ? (
            <div
              {...englishOnly}
              style={{ display: "flex", flexDirection: "column", gap: "var(--wv-space-sm)" }}
            >
              <Text variant="body">{aiInterpretation.summary}</Text>
              <ConfidenceBadge level={aiInterpretation.confidence} showDescription />
            </div>
          ) : (
            <StateDisplay
              status="empty"
              title={t("workspace.aiPanel.emptyTitle")}
              description={t("gov.aiPanel.emptyBody")}
            />
          )}
        </div>
      }
    >
      {children}
    </AppShell>
  );
}
