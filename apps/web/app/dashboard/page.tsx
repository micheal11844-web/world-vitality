"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell, Card, Text, StateDisplay } from "@world-vitality/ui-components";

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

  return (
    <AppShell
      brand={<Text variant="sectionTitle">World Vitality</Text>}
      sidebarItems={[{ key: "home", label: "Home", href: "/dashboard", active: true }]}
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
      </div>
    </AppShell>
  );
}
