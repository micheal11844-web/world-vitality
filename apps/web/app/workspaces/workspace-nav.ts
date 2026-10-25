import type { SidebarItem, SidebarSection } from "@world-vitality/ui-components";
import { translateOr, type Translate } from "@world-vitality/i18n";

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
 * Catalog keys for each sub-page's label, keyed `workspace:sub`. Only
 * the *home* sub-page differs per workspace ("Field Overview", "Site
 * Risk"…); Map, Team, Reports and the Lesson Plan share one label each.
 * A pair missing here falls back to the English label above.
 */
const SUB_LABEL_KEYS: Record<string, string> = {
  "agriculture:home": "nav.fieldOverview",
  "agriculture:report": "nav.fieldReport",
  "weather:home": "nav.currentConditions",
  "construction:home": "nav.siteRisk",
  "renewable-energy:home": "nav.generationOutlook",
  "research:home": "nav.datasetExplorer",
  "logistics:home": "nav.routeRisk",
  "disaster-monitoring:home": "nav.activeAlerts",
  "government-ngos:home": "nav.jurisdictionOverview",
  "government-ngos:report": "nav.formalReport",
  "insurance:home": "nav.underwritingRiskContext",
  "insurance:report": "nav.auditableReport",
  "education:home": "nav.explainThisData",
  "education:lesson-plan": "nav.lessonPlan",
};

const SHARED_SUB_LABEL_KEYS: Record<string, string> = {
  map: "nav.map",
  team: "nav.team",
};

/** A workspace's name in the reader's language (English when no translator is given). */
export function workspaceLabel(workspace: WorkspaceLink, t?: Translate): string {
  const key = `workspace.${workspace.key}.name`;
  return t ? translateOr(t, key, workspace.label) : workspace.label;
}

/** A sub-page's label in the reader's language (English when no translator is given). */
export function subLinkLabel(
  workspace: WorkspaceLink,
  sub: WorkspaceSubLink,
  t?: Translate,
): string {
  if (!t) return sub.label;
  const key = SUB_LABEL_KEYS[`${workspace.key}:${sub.key}`] ?? SHARED_SUB_LABEL_KEYS[sub.key];
  return key ? translateOr(t, key, sub.label) : sub.label;
}

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
 *
 * **The top-level workspace item's `active` means "this is the current
 * workspace," not narrowly "you are on its home page"** (BUILD_PLAN
 * "STAGE — COLLAPSED SIDEBAR: ACTIVE-ONLY ICON STYLING") — it's true
 * whenever `currentWorkspaceKey` matches, regardless of which sub-page
 * `activeSubKey` is. This matters most in the sidebar's collapsed
 * rail, where sub-items are never visible at all: the top-level letter
 * is the *only* available "where am I" indicator there, so it needs to
 * reflect the whole workspace, not just its home page specifically —
 * previously, viewing any sub-page (Map, Team, a report) left no
 * workspace marked active at all in collapsed mode, since the
 * page-specific highlight lived on an invisible child item instead.
 * Each individual sub-item keeps the narrower, page-specific `active`
 * check (`activeSubKey === sub.key`) — that distinction is exactly
 * what's visible once expanded.
 */
export function buildWorkspaceSidebarItems(
  currentWorkspaceKey?: string,
  activeSubKey?: string,
  /** Pass the reader's translator to label the tree in their language; omit for English. */
  t?: Translate,
): SidebarItem[] {
  return WORKSPACE_LINKS.map((workspace) => {
    const isCurrentWorkspace = workspace.key === currentWorkspaceKey;
    return {
      key: workspace.key,
      label: workspaceLabel(workspace, t),
      href: workspace.href,
      active: isCurrentWorkspace,
      children: workspace.subLinks.map((sub) => ({
        key: `${workspace.key}-${sub.key}`,
        label: subLinkLabel(workspace, sub, t),
        href: sub.href,
        active: isCurrentWorkspace && activeSubKey === sub.key,
      })),
    };
  });
}

/** The top-level pages the sidebar can mark as current. */
export type AppNavPage = "home" | "workspaces" | "notifications" | "settings";

export interface AppSidebarOptions {
  /** Which top-level page this is, when it is one of them. */
  current?: AppNavPage;
  /** Set on a workspace's own pages: that workspace opens and is marked current. */
  workspaceKey?: string;
  /** Which of that workspace's pages is open (`home`, `map`, `report`, `team`…). */
  subKey?: string;
  /** The reader's translator; omit for English. */
  t?: Translate;
  /**
   * `false` for the anonymous Public Explorer: it shows only the Workspaces
   * group (Home, Notifications and Settings all need an account), and
   * following a workspace from there sends a visitor to sign in — the
   * upgrade path the PRD describes.
   */
  signedIn?: boolean;
}

export interface AppSidebar {
  sections: SidebarSection[];
  /** Pass to `AppShell` as `sidebarDefaultExpandedKeys`. */
  defaultExpandedKeys: string[];
}

/**
 * The one sidebar every signed-in page shows: **Home**, **Workspaces**,
 * then **Notifications** and **Settings** under Account.
 *
 * The eleven workspaces used to be listed at the top level, each with its
 * own pages beneath it, which filled the whole rail and pushed
 * Notifications and Settings out of sight. They now sit inside a single
 * "Workspaces" row — its label opens the Workspaces page, its arrow
 * expands the list — so the rail stays four rows long until you ask for
 * more. On a workspace's own pages the group and that workspace open
 * automatically, so you can see where you are and move around without an
 * extra click. Everything is built here so no page hand-rolls its own
 * sidebar, as each one used to.
 */
export function buildAppSidebar(options: AppSidebarOptions = {}): AppSidebar {
  const { current, workspaceKey, subKey, t, signedIn = true } = options;
  const label = (key: string, fallback: string) => (t ? translateOr(t, key, fallback) : fallback);

  const workspacesItem: SidebarItem = {
    key: "workspaces",
    label: label("nav.workspaces", "Workspaces"),
    href: "/workspaces",
    active: current === "workspaces",
    children: buildWorkspaceSidebarItems(workspaceKey, subKey, t),
  };

  const defaultExpandedKeys: string[] = [];
  if (workspaceKey) defaultExpandedKeys.push("workspaces", workspaceKey);
  else if (current === "workspaces") defaultExpandedKeys.push("workspaces");

  if (!signedIn) {
    return { sections: [{ key: "main", items: [workspacesItem] }], defaultExpandedKeys };
  }

  return {
    sections: [
      {
        key: "main",
        items: [
          {
            key: "home",
            label: label("nav.home", "Home"),
            href: "/dashboard",
            active: current === "home",
          },
          workspacesItem,
        ],
      },
      {
        key: "account",
        label: label("nav.account", "Account"),
        items: [
          {
            key: "notifications",
            label: label("nav.notifications", "Notifications"),
            href: "/notifications",
            active: current === "notifications",
          },
          {
            key: "settings",
            label: label("nav.settings", "Settings"),
            href: "/settings",
            active: current === "settings",
          },
        ],
      },
    ],
    defaultExpandedKeys,
  };
}
