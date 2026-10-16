"use client";

import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import {
  Card,
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
import { buildWorkspaceSidebarItems } from "../workspaces/workspace-nav";

const TUTORIAL_SEEN_KEY = "wv_guide_tutorial_seen";

interface WorkspaceCard {
  /** Matches `WORKSPACE_LINKS` keys and `Persona.workspaceKey`. */
  key: string;
  /** Catalog keys, so the name and description follow the reader's language. */
  nameKey: MessageKey;
  descriptionKey: MessageKey;
  href: string;
}

const WORKSPACE_CARDS: WorkspaceCard[] = [
  {
    key: "agriculture",
    nameKey: "workspace.agriculture.name",
    descriptionKey: "workspace.agriculture.description",
    href: "/workspaces/agriculture",
  },
  {
    key: "weather",
    nameKey: "workspace.weather.name",
    descriptionKey: "workspace.weather.description",
    href: "/workspaces/weather",
  },
  {
    key: "construction",
    nameKey: "workspace.construction.name",
    descriptionKey: "workspace.construction.description",
    href: "/workspaces/construction",
  },
  {
    key: "renewable-energy",
    nameKey: "workspace.renewable-energy.name",
    descriptionKey: "workspace.renewable-energy.description",
    href: "/workspaces/renewable-energy",
  },
  {
    key: "research",
    nameKey: "workspace.research.name",
    descriptionKey: "workspace.research.description",
    href: "/workspaces/research",
  },
  {
    key: "logistics",
    nameKey: "workspace.logistics.name",
    descriptionKey: "workspace.logistics.description",
    href: "/workspaces/logistics",
  },
  {
    key: "disaster-monitoring",
    nameKey: "workspace.disaster-monitoring.name",
    descriptionKey: "workspace.disaster-monitoring.description",
    href: "/workspaces/disaster-monitoring",
  },
  {
    key: "government-ngos",
    nameKey: "workspace.government-ngos.name",
    descriptionKey: "workspace.government-ngos.description",
    href: "/workspaces/government-ngos",
  },
  {
    key: "insurance",
    nameKey: "workspace.insurance.name",
    descriptionKey: "workspace.insurance.description",
    href: "/workspaces/insurance",
  },
  {
    key: "education",
    nameKey: "workspace.education.name",
    descriptionKey: "workspace.education.description",
    href: "/workspaces/education",
  },
];

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
  const orderedCards = [
    ...WORKSPACE_CARDS.filter((c) => c.key === recommendedKey),
    ...WORKSPACE_CARDS.filter((c) => c.key !== recommendedKey),
  ];

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

  return (
    <AppShell
      brand={<AppBrand />}
      sidebarSections={[
        {
          key: "workspaces",
          label: t("nav.workspaces"),
          items: [
            { key: "home", label: t("nav.home"), href: "/dashboard", active: true },
            // No `currentWorkspaceKey` here (BUILD_PLAN "STAGE — NESTED
            // WORKSPACE SIDEBAR NAVIGATION") — nothing is "the current
            // workspace" from the cross-workspace Dashboard, so every
            // workspace starts collapsed and none is marked active,
            // same as before this stage (the flat list never marked
            // any workspace active from here either).
            ...buildWorkspaceSidebarItems(undefined, undefined, t),
          ],
        },
      ]}
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
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(16rem, 1fr))",
          gap: "var(--wv-space-md)",
        }}
      >
        {orderedCards.map((card) => {
          const recommended = card.key === recommendedKey;
          return (
            <Link
              key={card.key}
              href={card.href}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <Card>
                {recommended && (
                  <Text
                    variant="caption"
                    style={{ color: "var(--wv-accent)", textTransform: "uppercase" }}
                  >
                    {t("dashboard.recommended")}
                  </Text>
                )}
                <Text variant="sectionTitle" as="h2">
                  {t(card.nameKey)}
                </Text>
                <Text
                  variant="body"
                  style={{ color: "var(--wv-text-secondary)", marginTop: "var(--wv-space-xs)" }}
                >
                  {t(card.descriptionKey)}
                </Text>
              </Card>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
