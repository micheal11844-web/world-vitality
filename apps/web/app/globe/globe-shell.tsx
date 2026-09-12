"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { AppShell } from "../app-shell-with-guide";
import { Text, StateDisplay } from "@world-vitality/ui-components";
import { AppBrand } from "../app-brand";
import { buildWorkspaceSidebarItems } from "../workspaces/workspace-nav";
import type { GlobePin } from "./globe-viewer";

// `ssr: false` is required, not a performance nicety — Cesium needs
// `window`/WebGL, both entirely absent during server rendering. Next.js
// dynamic imports are the documented, supported way to exclude a
// component from the server render pass entirely rather than letting it
// crash during SSR and papering over that with a try/catch.
const GlobeViewer = dynamic(() => import("./globe-viewer").then((m) => m.GlobeViewer), {
  ssr: false,
  loading: () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
      <Text variant="body" style={{ color: "var(--wv-text-secondary)" }}>
        Loading the globe…
      </Text>
    </div>
  ),
});

/**
 * Client half of the "God's Eye" global view (BUILD_PLAN "STAGE —
 * GOD'S EYE GLOBE VIEW") — `AppShell` wrapper plus the dynamically-
 * loaded `GlobeViewer`. Split from `page.tsx` (a Server Component)
 * because Cesium is unconditionally browser-only; `page.tsx` does all
 * the real data fetching and permission filtering, then hands this
 * component a plain, already-filtered `pins` array — no client-side
 * data fetching or re-filtering happens here.
 *
 * Same "Workspaces" sidebar every other cross-workspace page
 * (`dashboard-view.tsx`, `explore-shell.tsx`) uses, with no
 * `currentWorkspaceKey` — the globe isn't "inside" any one workspace,
 * so every workspace starts collapsed here too.
 */
export function GlobeShell({ pins }: { pins: GlobePin[] }) {
  // Required by AppShellProps, but this page has no AI panel content —
  // same "no AI-adjacent side-panel summary" reasoning
  // education/workspace-shell.tsx already documented for itself; the
  // globe is a visualization, not an interpretation result to
  // summarize.
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  return (
    <AppShell
      brand={<AppBrand />}
      aiPanelOpen={aiPanelOpen}
      onToggleAiPanel={() => setAiPanelOpen((v) => !v)}
      sidebarSections={[
        {
          key: "workspaces",
          label: "Workspaces",
          items: buildWorkspaceSidebarItems(),
        },
      ]}
    >
      <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "var(--wv-space-sm)" }}>
        <div>
          <Text variant="pageTitle" as="h1" style={{ marginBottom: "var(--wv-space-xs)" }}>
            The Globe
          </Text>
          <Text variant="caption" style={{ display: "block", color: "var(--wv-text-secondary)" }}>
            {pins.length} location{pins.length === 1 ? "" : "s"} across every workspace you have
            access to — Agriculture fields, insured properties, and monitored locations. Individual
            hazard/status detail lives in each workspace; this is an overview, not a replacement.
          </Text>
        </div>
        <div style={{ flex: 1, minHeight: 0, borderRadius: "var(--wv-radius-md)", overflow: "hidden" }}>
          {pins.length === 0 ? (
            <StateDisplay
              status="empty"
              title="No locations to show"
              description="Nothing you have access to across Agriculture, Insurance, or Government & NGOs has a location yet."
            />
          ) : (
            <GlobeViewer pins={pins} />
          )}
        </div>
      </div>
    </AppShell>
  );
}
