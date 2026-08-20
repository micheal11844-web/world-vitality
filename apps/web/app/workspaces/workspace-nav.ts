export interface WorkspaceLink {
  key: string;
  label: string;
  href: string;
}

/**
 * Cross-workspace switcher links (BUILD_PLAN Stage 12 follow-up: "add
 * a dashboard to the left side of the app so I can toggle between
 * workspaces"). Shared by every workspace shell and the Home
 * Dashboard's own sidebar, so any workspace can jump straight to
 * another without going back through `/dashboard` first.
 *
 * Extracted into its own small file, rather than copy-pasted into a
 * third near-identical array inside each shell, because three
 * consumers (Agriculture, Weather & Climate, Construction) is exactly
 * Engineering Blueprint 4.5's "promote once a genuine third consumer
 * exists" signal — the same signal Weather's and Construction's own
 * `workspace-shell.tsx` doc comments flagged as "not yet the trigger"
 * back when there were only one or two. Kept in `apps/web` (not
 * `packages/`) since this is app-specific content (workspace names and
 * routes), not a reusable UI primitive — the `Sidebar`/`AppShell`
 * components themselves are unchanged.
 */
export const WORKSPACE_LINKS: WorkspaceLink[] = [
  { key: "agriculture", label: "Agriculture", href: "/workspaces/agriculture" },
  { key: "weather", label: "Weather & Climate", href: "/workspaces/weather" },
  { key: "construction", label: "Construction", href: "/workspaces/construction" },
  { key: "renewable-energy", label: "Renewable Energy", href: "/workspaces/renewable-energy" },
  { key: "research", label: "Research", href: "/workspaces/research" },
];
