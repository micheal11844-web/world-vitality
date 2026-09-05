import type { SidebarItem } from "@world-vitality/ui-components";

export interface WorkspaceSubLink {
  key: string;
  label: string;
  href: string;
}

export interface WorkspaceLink {
  key: string;
  label: string;
  href: string;
  /**
   * This workspace's own sub-pages (BUILD_PLAN "STAGE — NESTED
   * WORKSPACE SIDEBAR NAVIGATION"). Every workspace has `home`, `map`,
   * and `team`; `report` and `lesson-plan` only exist where that page
   * actually does (Insurance, Government & NGOs, and Agriculture have
   * a report; only Education has a lesson plan) — no fabricated link
   * to a page that doesn't exist.
   *
   * **Fixing a real, pre-existing inconsistency found while
   * centralizing this list**: Insurance's and Government & NGOs'
   * report pages were both real (their own home pages already link to
   * them via an "Open Report" button) but were never listed in either
   * workspace's sidebar — only Agriculture's report page was. Both are
   * included here now, closing that gap rather than preserving it
   * silently while consolidating.
   */
  subLinks: WorkspaceSubLink[];
}

/**
 * Cross-workspace switcher links (BUILD_PLAN Stage 12 follow-up: "add
 * a dashboard to the left side of the app so I can toggle between
 * workspaces"), now carrying each workspace's own sub-pages too
 * (BUILD_PLAN "STAGE — NESTED WORKSPACE SIDEBAR NAVIGATION") — shared
 * by every workspace shell, the Home Dashboard, and Public Explorer,
 * so any of them can build the same nested sidebar tree from one
 * source of truth instead of each hand-rolling its own near-identical
 * "Workspaces" + "This Workspace" section pair (ten near-duplicate
 * copies of that pattern was well past Engineering Blueprint 4.5's
 * "promote once a genuine third consumer exists" signal — the same
 * signal that justified extracting the flat `WORKSPACE_LINKS` list in
 * the first place).
 *
 * Kept in `apps/web` (not `packages/`) since this is app-specific
 * content (workspace names and routes), not a reusable UI primitive —
 * `Sidebar`/`AppShell` themselves are workspace-agnostic and take
 * plain `SidebarItem` trees from whoever calls them.
 */
export const WORKSPACE_LINKS: WorkspaceLink[] = [
  {
    key: "agriculture",
    label: "Agriculture",
    href: "/workspaces/agriculture",
    subLinks: [
      { key: "home", label: "Field Overview", href: "/workspaces/agriculture" },
      { key: "map", label: "Map", href: "/workspaces/agriculture/map" },
      { key: "report", label: "Field Report", href: "/workspaces/agriculture/report" },
      { key: "team", label: "Team", href: "/workspaces/agriculture/team" },
    ],
  },
  {
    key: "weather",
    label: "Weather & Climate",
    href: "/workspaces/weather",
    subLinks: [
      { key: "home", label: "Current Conditions", href: "/workspaces/weather" },
      { key: "map", label: "Map", href: "/workspaces/weather/map" },
      { key: "team", label: "Team", href: "/workspaces/weather/team" },
    ],
  },
  {
    key: "construction",
    label: "Construction",
    href: "/workspaces/construction",
    subLinks: [
      { key: "home", label: "Site Risk", href: "/workspaces/construction" },
      { key: "map", label: "Map", href: "/workspaces/construction/map" },
      { key: "team", label: "Team", href: "/workspaces/construction/team" },
    ],
  },
  {
    key: "renewable-energy",
    label: "Renewable Energy",
    href: "/workspaces/renewable-energy",
    subLinks: [
      { key: "home", label: "Generation Outlook", href: "/workspaces/renewable-energy" },
      { key: "map", label: "Map", href: "/workspaces/renewable-energy/map" },
      { key: "team", label: "Team", href: "/workspaces/renewable-energy/team" },
    ],
  },
  {
    key: "research",
    label: "Research",
    href: "/workspaces/research",
    subLinks: [
      { key: "home", label: "Dataset Explorer", href: "/workspaces/research" },
      { key: "map", label: "Map", href: "/workspaces/research/map" },
      { key: "team", label: "Team", href: "/workspaces/research/team" },
    ],
  },
  {
    key: "logistics",
    label: "Logistics & Shipping",
    href: "/workspaces/logistics",
    subLinks: [
      { key: "home", label: "Route Risk", href: "/workspaces/logistics" },
      { key: "map", label: "Map", href: "/workspaces/logistics/map" },
      { key: "team", label: "Team", href: "/workspaces/logistics/team" },
    ],
  },
  {
    key: "disaster-monitoring",
    label: "Disaster Monitoring",
    href: "/workspaces/disaster-monitoring",
    subLinks: [
      { key: "home", label: "Active Alerts", href: "/workspaces/disaster-monitoring" },
      { key: "map", label: "Map", href: "/workspaces/disaster-monitoring/map" },
      { key: "team", label: "Team", href: "/workspaces/disaster-monitoring/team" },
    ],
  },
  {
    key: "government-ngos",
    label: "Government & NGOs",
    href: "/workspaces/government-ngos",
    subLinks: [
      { key: "home", label: "Jurisdiction Overview", href: "/workspaces/government-ngos" },
      { key: "map", label: "Map", href: "/workspaces/government-ngos/map" },
      { key: "report", label: "Formal Report", href: "/workspaces/government-ngos/report" },
      { key: "team", label: "Team", href: "/workspaces/government-ngos/team" },
    ],
  },
  {
    key: "insurance",
    label: "Insurance",
    href: "/workspaces/insurance",
    subLinks: [
      { key: "home", label: "Underwriting Risk Context", href: "/workspaces/insurance" },
      { key: "map", label: "Map", href: "/workspaces/insurance/map" },
      { key: "report", label: "Auditable Report", href: "/workspaces/insurance/report" },
      { key: "team", label: "Team", href: "/workspaces/insurance/team" },
    ],
  },
  {
    key: "education",
    label: "Education",
    href: "/workspaces/education",
    subLinks: [
      { key: "home", label: "Explain This Data", href: "/workspaces/education" },
      { key: "map", label: "Map", href: "/workspaces/education/map" },
      { key: "lesson-plan", label: "Lesson Plan", href: "/workspaces/education/lesson-plan" },
      { key: "team", label: "Team", href: "/workspaces/education/team" },
    ],
  },
];

/**
 * Builds the single "Workspaces" `SidebarItem` tree every shell in
 * this app renders (BUILD_PLAN "STAGE — NESTED WORKSPACE SIDEBAR
 * NAVIGATION") — one call site instead of each of the ten workspace
 * shells (plus the Home Dashboard and Public Explorer) hand-building
 * its own "Workspaces" + "This Workspace" section pair.
 *
 * `currentWorkspaceKey`/`activeSubKey` are both optional: the Home
 * Dashboard and Public Explorer pass neither (nothing is "current," so
 * nothing is marked active and nothing starts expanded — see
 * `Sidebar`'s own `defaultExpandedKeys`, which this function's return
 * value is meant to be paired with via `WORKSPACE_LINKS.find(...)`
 * lookups at each call site, kept there rather than folded into this
 * function since which key to pre-expand is an `AppShell`-level
 * concern, not a data-shaping one).
 */
export function buildWorkspaceSidebarItems(
  currentWorkspaceKey?: string,
  activeSubKey?: string,
): SidebarItem[] {
  return WORKSPACE_LINKS.map((workspace) => {
    const isCurrentWorkspace = workspace.key === currentWorkspaceKey;
    return {
      key: workspace.key,
      label: workspace.label,
      href: workspace.href,
      active: isCurrentWorkspace && activeSubKey === "home",
      children: workspace.subLinks.map((sub) => ({
        key: `${workspace.key}-${sub.key}`,
        label: sub.label,
        href: sub.href,
        active: isCurrentWorkspace && activeSubKey === sub.key,
      })),
    };
  });
}

