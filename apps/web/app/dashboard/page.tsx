import { logTelemetry } from "../../lib/logger";
import { DashboardView } from "./dashboard-view";

// Required so this page is server-rendered per request, not cached as
// a static build-time snapshot — without this, the telemetry.event()
// call below would only fire once, at build time, not on real page
// views. Caught by inspecting the production build's own output
// (it logged the event during "Generating static pages," a clear
// signal this route had been statically prerendered).
export const dynamic = "force-dynamic";

/**
 * Thin server wrapper around `DashboardView` (a client component — the
 * tutorial's localStorage check and the AI panel toggle genuinely need
 * to run client-side). Same split, same reasoning, as
 * `workspaces/research/page.tsx`: this page's only server-side job is
 * logging a `workspace_viewed` telemetry event (using "dashboard" as
 * the workspace value, since the Home Dashboard is the one page in
 * this app that isn't inside a workspace) before rendering.
 */
export default async function DashboardPage() {
  logTelemetry.event("workspace_viewed", { workspace: "dashboard" });
  return <DashboardView />;
}
