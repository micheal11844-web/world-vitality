"use client";

import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import {
  Text,
  StateDisplay,
  GuideTutorial,
  AppShell,
  type GuideTutorialStep,
} from "@world-vitality/ui-components";
import type { MessageKey } from "@world-vitality/i18n";
import { useI18n } from "../../lib/i18n/i18n-provider";
import { personaLabel as personaLabelFor } from "../../lib/i18n/labels";
import { AppBrand } from "../app-brand";
import { buildAppSidebar } from "../workspaces/workspace-nav";
import { WorkspaceCardGrid } from "../workspaces/workspace-cards";

const TUTORIAL_SEEN_KEY = "wv_guide_tutorial_seen";

/**
 * First-use tutorial content (Stage 9, ticket 9.4). App-specific copy
 * lives in apps/web (as catalog keys), not in the reusable GuideTutorial
 * shell — same packages-vs-apps split as everything else in this
 * codebase. Deliberately short (3 steps) and scoped to what's actually
 * real today (workspaces, the AI panel) — not describing features that
 * don't exist yet, per this project's honesty norm.
 */
const TUTORIAL_STEP_KEYS: {
  title: MessageKey;
  body: MessageKey;
  mood: GuideTutorialStep["mood"];
}[] = [
  {
    title: "dashboard.tutorial.welcomeTitle",
    body: "dashboard.tutorial.welcomeBody",
    mood: "happy",
  },
  {
    title: "dashboard.tutorial.workspacesTitle",
    body: "dashboard.tutorial.workspacesBody",
    mood: "idle",
  },
  { title: "dashboard.tutorial.aiTitle", body: "dashboard.tutorial.aiBody", mood: "thinking" },
];

/**
 * Home Dashboard shell (ticket 6.2), per PRD Section B.3: "a cross-
 * workspace landing view... surfaces the most relevant/urgent item
 * across all their workspaces... then lets them enter a specific
 * workspace for depth."
 *
 * **Urgent-item banner:** the Notification Center (PRD B.6) now supplies
 * one real urgent item — an unread *critical* official alert for the
 * user's home place — shown above everything else via `criticalNotice`.
 * Nothing else is promoted here: routine and collaboration notifications
 * stay in the Notification Center and the header bell, so this banner
 * keeps its meaning. It only exists where a source covers the user's
 * place (U.S. alerts today); an absent banner is not an all-clear.
 */
export interface DashboardViewProps {
  /** `WORKSPACE_LINKS` key of the workspace the user's onboarding role maps to. */
  recommendedKey?: string | null;
  /** The user's onboarding role id, e.g. `"farmer"` — labelled in their language here. */
  personaId?: string | null;
  /** The user's home place, e.g. "Ibadan, Oyo, Nigeria". */
  homeLabel?: string | null;
  /** Live conditions for the home place — a server-rendered node, streamed in. */
  homeInsight?: ReactNode;
  /** `true` once onboarding is done/skipped, so "add your place" can be offered. */
  onboarded?: boolean;
  /** Server-rendered, streamed-in banner for an unread critical notification. */
  criticalNotice?: ReactNode;
}

export function DashboardView({
  recommendedKey = null,
  personaId = null,
  homeLabel = null,
  homeInsight = null,
  onboarded = false,
  criticalNotice = null,
}: DashboardViewProps) {
  const { t } = useI18n();
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  // The user's own workspace first (PRD B.1: "never a generic empty
  // dashboard"); everyone else keeps the standard order.
  const tutorialSteps: GuideTutorialStep[] = TUTORIAL_STEP_KEYS.map((step) => ({
    title: t(step.title),
    body: t(step.body),
    mood: step.mood,
  }));
  const personaLabel = personaId ? personaLabelFor(personaId, t) : null;

  useEffect(() => {
    // Real first-use check, not a guess: only show the tutorial if this
    // browser has never dismissed it. try/catch because localStorage
    // can throw in some privacy-mode/embedded contexts — treated as
    // "show the tutorial" rather than crashing the dashboard over a
    // non-essential feature.
    try {
      if (localStorage.getItem(TUTORIAL_SEEN_KEY) !== "true") {
        setTutorialOpen(true);
      }
    } catch {
      setTutorialOpen(true);
    }
  }, []);

  const dismissTutorial = () => {
    setTutorialOpen(false);
    try {
      localStorage.setItem(TUTORIAL_SEEN_KEY, "true");
    } catch {
      // Non-essential — if storage is unavailable, the tutorial will
      // simply show again next visit. Not worth surfacing an error for.
    }
  };

  const sidebar = buildAppSidebar({ current: "home", t });

  return (
    <AppShell
      brand={<AppBrand />}
      sidebarSections={sidebar.sections}
      sidebarDefaultExpandedKeys={sidebar.defaultExpandedKeys}
      aiPanelOpen={aiPanelOpen}
      onToggleAiPanel={() => setAiPanelOpen((v) => !v)}
      aiPanelContent={
        <StateDisplay
          status="empty"
          title={t("chrome.aiPanel.emptyTitle")}
          description={t("chrome.aiPanel.emptyBody")}
        />
      }
    >
      <GuideTutorial open={tutorialOpen} onDismiss={dismissTutorial} steps={tutorialSteps} />
      {criticalNotice}
      {homeLabel ? (
        <section
          aria-labelledby="home-place-heading"
          style={{ marginBottom: "var(--wv-space-lg)", maxWidth: "36rem" }}
        >
          <Text
            variant="caption"
            style={{
              color: "var(--wv-text-secondary)",
              // CSS, not `.toUpperCase()`: it's a no-op for scripts without
              // case (Arabic) and can't corrupt a language's own casing rules.
              textTransform: "uppercase",
            }}
          >
            {personaLabel ? `${personaLabel} · ` : ""}
            {t("dashboard.yourPlace")}
          </Text>
          <Text variant="pageTitle" as="h1" id="home-place-heading">
            {homeLabel}
          </Text>
          <div style={{ margin: "var(--wv-space-sm) 0" }}>{homeInsight}</div>
          <Link
            href="/welcome?redo=1"
            style={{ color: "var(--wv-text-secondary)", fontFamily: "var(--wv-font-sans)" }}
          >
            {t("dashboard.changeRoleOrPlace")}
          </Link>
        </section>
      ) : (
        <>
          <Text variant="pageTitle" as="h1" style={{ marginBottom: "var(--wv-space-sm)" }}>
            {t("dashboard.yourWorkspaces")}
          </Text>
          {onboarded && (
            <Text
              variant="body"
              style={{ color: "var(--wv-text-secondary)", marginBottom: "var(--wv-space-lg)" }}
            >
              {t("dashboard.addPlacePrompt")}{" "}
              <Link href="/welcome?redo=1">{t("dashboard.setItUp")}</Link>
            </Text>
          )}
        </>
      )}
      {homeLabel && (
        <Text variant="sectionTitle" as="h2" style={{ marginBottom: "var(--wv-space-sm)" }}>
          {t("dashboard.yourWorkspaces")}
        </Text>
      )}
      <WorkspaceCardGrid recommendedKey={recommendedKey} />
    </AppShell>
  );
}
