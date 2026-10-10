import { logTelemetry } from "../../lib/logger";
import { parseExploreLocation } from "../../lib/explore-link";
import { ExploreView } from "./explore-view";

// Same reasoning as every other page in this app that logs telemetry
// on render: without this, the build would statically prerender the
// page and the event would fire once at build time, not per real view.
export const dynamic = "force-dynamic";

/**
 * Thin server wrapper around `ExploreView` (a client component — the
 * search form and its pending/result state genuinely need to run
 * client-side, same split every other workspace already uses). This
 * page's only server-side job is logging a `workspace_viewed`
 * telemetry event before rendering, using "public-explorer" as the
 * workspace value.
 *
 * **Deliberately outside `app/workspaces/` and `app/dashboard/`, and
 * therefore outside both of those route trees' `requireSession()`
 * gates** — see `explore-shell.tsx`'s doc comment for why: Public
 * Explorer's PRD mission requires genuinely anonymous access, not an
 * exception carved into an existing gate.
 */
export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  logTelemetry.event("workspace_viewed", { workspace: "public-explorer" });
  // A Global Search place result deep-links here with the coordinates it
  // already resolved (`?lat&lon&name…`). Validated, never trusted.
  const initialLocation = parseExploreLocation(await searchParams);
  return <ExploreView initialLocation={initialLocation} />;
}
