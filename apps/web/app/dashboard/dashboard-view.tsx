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
import { AppBrand } from "../app-brand";
import { buildWorkspaceSidebarItems } from "../workspaces/workspace-nav";

const TUTORIAL_SEEN_KEY = "wv_guide_tutorial_seen";

interface WorkspaceCard {
  /** Matches `WORKSPACE_LINKS` keys and `Persona.workspaceKey`. */
  key: string;
  title: string;
  description: string;
  href: string;
}

const WORKSPACE_CARDS: WorkspaceCard[] = [
  {
    key: "agriculture",
    title: "Agriculture",
    description: "Soil moisture, weather, and field conditions.",
    href: "/workspaces/agriculture",
  },
  {
    key: "weather",
    title: "Weather & Climate",
    description: "Current conditions and temperature status for your locations.",
    href: "/workspaces/weather",
  },
  {
    key: "construction",
    title: "Construction",
    description: "Site risk status for weather-sensitive activities.",
    href: "/workspaces/construction",
  },
  {
    key: "renewable-energy",
    title: "Renewable Energy",
    description: "Wind generation outlook for your assets.",
    href: "/workspaces/renewable-energy",
  },
  {
    key: "research",
    title: "Research",
    description: "Explore raw environmental data with full provenance.",
    href: "/workspaces/research",
  },
  {
    key: "logistics",
    title: "Logistics & Shipping",
    description: "Route risk status for weather-sensitive shipments.",
    href: "/workspaces/logistics",
  },
  {
    key: "disaster-monitoring",
    title: "Disaster Monitoring",
    description: "Live official National Weather Service alerts (U.S. only).",
    href: "/workspaces/disaster-monitoring",
  },
  {
    key: "government-ngos",
    title: "Government & NGOs",
    description: "Multi-domain jurisdiction overview and reports.",
    href: "/workspaces/government-ngos",
  },
  {
    key: "insurance",
    title: "Insurance",
    description: "Underwriting risk context and auditable reports.",
    href: "/workspaces/insurance",
  },
  {
    key: "education",
    title: "Education",
    description: "Grade-level data explanations and sample lesson plans for educators.",
    href: "/workspaces/education",
  },
];

/**
 * First-use tutorial content (Stage 9, ticket 9.4). App-specific copy
 * lives here, in apps/web, not in the reusable GuideTutorial shell —
 * same packages-vs-apps split as everything else in this codebase.
 * Deliberately short (3 steps) and scoped to what's actually real
 * today (workspaces, the AI panel) — not describing features (alerts,
 * notifications) that don't exist yet, per this project's honesty
 * norm.
 */
const TUTORIAL_STEPS: GuideTutorialStep[] = [
  {
    title: "Hi, I'm Orbi",
    body: "I'll be around to help you get oriented. Let's take a quick look around.",
    mood: "happy",
  },
  {
    title: "Your workspaces",
    body: "Each card below is a workspace — a focused set of data and tools for one domain, like Agriculture. Click one to dive in.",
    mood: "idle",
  },
  {
    title: "The AI panel",
    body: "Inside any workspace, open the AI panel to ask questions about its data. It always tells you how confident it is — never a guess dressed up as fact.",
    mood: "thinking",
  },
];

/**
 * Home Dashboard shell (ticket 6.2), per PRD Section B.3: "a cross-
 * workspace landing view... surfaces the most relevant/urgent item
 * across all their workspaces... then lets them enter a specific
 * workspace for depth."
 *
 * **Honest scope note:** this repo only has one real workspace built
 * (Agriculture, ticket 6.3) and no alerts/urgency data model exists yet
 * (that's Section B.6, Notification Center — unbuilt). So this renders
 * the correct *shape* — a workspace-card grid, ready to surface an
 * urgent-item banner once alerts exist — but the "surfaces the most
 * urgent item" behavior itself isn't implemented, because there's
 * nothing real to surface yet. Don't mistake the empty alert banner for
 * that feature being done.
 */
export interface DashboardViewProps {
  /** `WORKSPACE_LINKS` key of the workspace the user's onboarding role maps to. */
  recommendedKey?: string | null;
  /** The user's onboarding role label, e.g. "Farmer". */
  personaLabel?: string | null;
  /** The user's home place, e.g. "Ibadan, Oyo, Nigeria". */
  homeLabel?: string | null;
  /** Live conditions for the home place — a server-rendered node, streamed in. */
  homeInsight?: ReactNode;
  /** `true` once onboarding is done/skipped, so "add your place" can be offered. */
  onboarded?: boolean;
}

export function DashboardView({
  recommendedKey = null,
  personaLabel = null,
  homeLabel = null,
  homeInsight = null,
  onboarded = false,
}: DashboardViewProps) {
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  // The user's own workspace first (PRD B.1: "never a generic empty
  // dashboard"); everyone else keeps the standard order.
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
          label: "Workspaces",
          items: [
            { key: "home", label: "Home", href: "/dashboard", active: true },
            // No `currentWorkspaceKey` here (BUILD_PLAN "STAGE — NESTED
            // WORKSPACE SIDEBAR NAVIGATION") — nothing is "the current
            // workspace" from the cross-workspace Dashboard, so every
            // workspace starts collapsed and none is marked active,
            // same as before this stage (the flat list never marked
            // any workspace active from here either).
            ...buildWorkspaceSidebarItems(),
          ],
        },
      ]}
      aiPanelOpen={aiPanelOpen}
      onToggleAiPanel={() => setAiPanelOpen((v) => !v)}
      aiPanelContent={
        <StateDisplay
          status="empty"
          title="No active conversation"
          description="Open a workspace to ask about its data."
        />
      }
    >
      <GuideTutorial open={tutorialOpen} onDismiss={dismissTutorial} steps={TUTORIAL_STEPS} />
      {homeLabel ? (
        <section
          aria-labelledby="home-place-heading"
          style={{ marginBottom: "var(--wv-space-lg)", maxWidth: "36rem" }}
        >
          <Text variant="caption" style={{ color: "var(--wv-text-secondary)" }}>
            {personaLabel ? `${personaLabel.toUpperCase()} · ` : ""}YOUR PLACE
          </Text>
          <Text variant="pageTitle" as="h1" id="home-place-heading">
            {homeLabel}
          </Text>
          <div style={{ margin: "var(--wv-space-sm) 0" }}>{homeInsight}</div>
          <Link
            href="/welcome?redo=1"
            style={{ color: "var(--wv-text-secondary)", fontFamily: "var(--wv-font-sans)" }}
          >
            Change your role or place
          </Link>
        </section>
      ) : (
        <>
          <Text variant="pageTitle" as="h1" style={{ marginBottom: "var(--wv-space-sm)" }}>
            Your workspaces
          </Text>
          {onboarded && (
            <Text
              variant="body"
              style={{ color: "var(--wv-text-secondary)", marginBottom: "var(--wv-space-lg)" }}
            >
              Add your place to see live conditions for it right here.{" "}
              <Link href="/welcome?redo=1">Set it up</Link>
            </Text>
          )}
        </>
      )}
      {homeLabel && (
        <Text variant="sectionTitle" as="h2" style={{ marginBottom: "var(--wv-space-sm)" }}>
          Your workspaces
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
                  <Text variant="caption" style={{ color: "var(--wv-accent)" }}>
                    RECOMMENDED FOR YOU
                  </Text>
                )}
                <Text variant="sectionTitle" as="h2">
                  {card.title}
                </Text>
                <Text
                  variant="body"
                  style={{ color: "var(--wv-text-secondary)", marginTop: "var(--wv-space-xs)" }}
                >
                  {card.description}
                </Text>
              </Card>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
