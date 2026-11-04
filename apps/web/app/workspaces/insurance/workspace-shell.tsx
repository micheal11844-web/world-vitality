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

// PRD A.3's own role names (Admin, Underwriter, Claims Adjuster,
// Analyst/Read-only), mapped onto this app's generic four-role model —
// same honest-mapping approach `government-ngos/workspace-shell.tsx`
// used for its own PRD-specific role names, not a fabricated fifth
// role system. `scoped_field_user` → Claims Adjuster carries the same
// caveat as everywhere else in this app: resource-level scoping
// (PRD's "scoped to relevant claims") has no populated data to scope
// to yet, so this role currently behaves workspace-wide, same as
// `operational_user` minus report creation.
// The names themselves are the `insurance.role.*` messages.

/**
 * Shared shell for the Insurance workspace (BUILD_PLAN "STAGE —
 * INSURANCE WORKSPACE"). Structurally identical to every other
 * workspace shell — `AppShell` wrapper, single-section collapsible
 * "Workspaces" sidebar tree (BUILD_PLAN "STAGE — NESTED WORKSPACE
 * SIDEBAR NAVIGATION"), AI panel showing the signed-in user's role plus
 * whatever interpretation result the calling page passes down. Its
 * "Report" sub-page is now listed in the sidebar tree too — previously
 * only reachable via the "Open Report" button on the home page, a real,
 * pre-existing inconsistency fixed while centralizing this list (see
 * `workspace-nav.ts`'s own comment).
 */
export function WorkspaceShell({
  activeKey,
  children,
  role,
  aiInterpretation,
}: WorkspaceShellProps) {
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const { t, locale } = useI18n();
  const sidebar = buildAppSidebar({ workspaceKey: "insurance", subKey: activeKey, t });
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
            {t("workspace.signedInAs", { role: t(`insurance.role.${role}` as const) })}
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
              description={t("insurance.aiPanel.emptyBody")}
            />
          )}
        </div>
      }
    >
      {children}
    </AppShell>
  );
}
