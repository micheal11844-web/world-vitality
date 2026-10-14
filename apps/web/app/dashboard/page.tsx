import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Card, Skeleton } from "@world-vitality/ui-components";
import { homePlaceLabel, personaById } from "@world-vitality/identity-service";
import { logTelemetry } from "../../lib/logger";
import { getMyPreferences } from "../../lib/preferences";
import { DashboardView } from "./dashboard-view";
import { CriticalNotice } from "./critical-notice";
import { HomeInsightCard } from "./home-insight-card";

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
 * to run client-side). Server-side jobs: log a `workspace_viewed`
 * telemetry event, and apply onboarding (PRD B.1):
 *
 * - Someone who has never onboarded is sent to `/welcome` first. The
 *   redirect only fires when preferences were *positively* read as
 *   "not onboarded" — a failed lookup (`null`) never redirects, so a
 *   preferences outage can't trap anyone.
 * - Someone who has onboarded gets their role's workspace first and
 *   live conditions for their home place, streamed in via Suspense.
 */
export default async function DashboardPage() {
  logTelemetry.event("workspace_viewed", { workspace: "dashboard" });

  const prefs = await getMyPreferences();
  if (prefs && !prefs.onboardedAt) redirect("/welcome");

  const persona = personaById(prefs?.persona);
  const place = prefs?.homePlace ?? null;

  return (
    <DashboardView
      recommendedKey={persona?.workspaceKey ?? null}
      personaLabel={persona?.label ?? null}
      homeLabel={place ? homePlaceLabel(place) : null}
      onboarded={Boolean(prefs?.onboardedAt)}
      criticalNotice={
        // Streams in after the page: checking official alerts calls out
        // to the weather service and must never hold the dashboard up.
        <Suspense fallback={null}>
          <CriticalNotice />
        </Suspense>
      }
      homeInsight={
        place ? (
          <Suspense
            fallback={
              <Card>
                <Skeleton />
              </Card>
            }
          >
            <HomeInsightCard personaId={persona?.id ?? null} place={place} />
          </Suspense>
        ) : null
      }
    />
  );
}
