import { AppShellSkeleton } from "@world-vitality/ui-components";

/**
 * Next.js App Router's built-in loading-UI convention: shown
 * automatically while `app/dashboard/page.tsx` (and anything under it)
 * is loading — the route's data-fetching/render, and on a first,
 * un-prefetched navigation, the route's own JS chunk downloading too.
 * See `AppShellSkeleton`'s doc comment for why this exists and what
 * it's built from.
 */
export default function DashboardLoading() {
  return <AppShellSkeleton />;
}
