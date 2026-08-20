import { logTelemetry } from "../../../lib/logger";
import { DatasetExplorer } from "./dataset-explorer";

// Required so this page is server-rendered per request, not cached as
// a static build-time snapshot — without this, the telemetry.event()
// call below would only fire once, at build time, not on real page
// views. Same fix as dashboard/page.tsx — see that file's comment.
export const dynamic = "force-dynamic";

/**
 * Thin server wrapper around `DatasetExplorer` (a client component —
 * the Dataset Explorer's interactivity, form state, and fetch/export
 * logic genuinely needs to run client-side). Its only job is logging
 * `workspace_viewed` telemetry server-side before rendering — the same
 * `workspace_viewed` event every other workspace's page.tsx logs
 * directly, since those are already Server Components. Research needed
 * this split specifically because it's the one workspace home page
 * that was entirely client-side with nothing server-rendered to attach
 * the log call to.
 */
export default async function ResearchWorkspaceHome() {
  logTelemetry.event("workspace_viewed", { workspace: "research" });
  return <DatasetExplorer />;
}
