"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  AppShell,
  Card,
  Text,
  StateDisplay,
  GuideTutorial,
  type GuideTutorialStep,
} from "@world-vitality/ui-components";
import { WORKSPACE_LINKS } from "../workspaces/workspace-nav";

const TUTORIAL_SEEN_KEY = "wv_guide_tutorial_seen";

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
export default function DashboardPage() {
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);

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
      brand={<Text variant="sectionTitle">World Vitality</Text>}
      sidebarItems={[
        { key: "home", label: "Home", href: "/dashboard", active: true },
        ...WORKSPACE_LINKS.map((w) => ({ key: `switch-${w.key}`, label: w.label, href: w.href })),
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
      <Text variant="pageTitle" as="h1" style={{ marginBottom: "var(--wv-space-lg)" }}>
        Your workspaces
      </Text>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(16rem, 1fr))",
          gap: "var(--wv-space-md)",
        }}
      >
        <Link href="/workspaces/agriculture" style={{ textDecoration: "none", color: "inherit" }}>
          <Card>
            <Text variant="sectionTitle" as="h2">
              Agriculture
            </Text>
            <Text
              variant="body"
              style={{ color: "var(--wv-text-secondary)", marginTop: "var(--wv-space-xs)" }}
            >
              Soil moisture, weather, and field conditions.
            </Text>
          </Card>
        </Link>
        <Link href="/workspaces/weather" style={{ textDecoration: "none", color: "inherit" }}>
          <Card>
            <Text variant="sectionTitle" as="h2">
              Weather & Climate
            </Text>
            <Text
              variant="body"
              style={{ color: "var(--wv-text-secondary)", marginTop: "var(--wv-space-xs)" }}
            >
              Current conditions and temperature status for your locations.
            </Text>
          </Card>
        </Link>
        <Link href="/workspaces/construction" style={{ textDecoration: "none", color: "inherit" }}>
          <Card>
            <Text variant="sectionTitle" as="h2">
              Construction
            </Text>
            <Text
              variant="body"
              style={{ color: "var(--wv-text-secondary)", marginTop: "var(--wv-space-xs)" }}
            >
              Site risk status for weather-sensitive activities.
            </Text>
          </Card>
        </Link>
        <Link
          href="/workspaces/renewable-energy"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <Card>
            <Text variant="sectionTitle" as="h2">
              Renewable Energy
            </Text>
            <Text
              variant="body"
              style={{ color: "var(--wv-text-secondary)", marginTop: "var(--wv-space-xs)" }}
            >
              Wind generation outlook for your assets.
            </Text>
          </Card>
        </Link>
      </div>
    </AppShell>
  );
}
