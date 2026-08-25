import { NasaPowerConnector } from "@world-vitality/data-ingestion";
import {
  WeatherStatusProvider,
  WEATHER_TEMPERATURE_CAPABILITY_ID,
  SoilMoistureStatusProvider,
  SOIL_MOISTURE_CAPABILITY_ID,
} from "@world-vitality/interpretation-engine";
import { Text } from "@world-vitality/ui-components";
import { WorkspaceShell } from "./workspace-shell";
import { ExplainThisDataClient } from "./explain-this-data-client";
import { getWorkspaceRole } from "../../../lib/get-workspace-role";
import { logTelemetry } from "../../../lib/logger";

export const dynamic = "force-dynamic";

const WORKSPACE_ID = "education";

const DEMO_LOCATION = {
  id: "demo-classroom-location-1",
  latitude: 7.3775,
  longitude: 3.947,
  label: "Demo Classroom Location",
};

async function getExplainableData() {
  const connector = new NasaPowerConnector({
    locations: [DEMO_LOCATION],
    parameters: ["T2M", "GWETROOT"],
    community: "AG",
    lookbackDays: 7,
  });
  const { records } = await connector.ingest({
    type: "manual",
    requestedBy: "education-workspace-home-page",
  });

  const weather = await new WeatherStatusProvider().interpret({
    capability: WEATHER_TEMPERATURE_CAPABILITY_ID,
    records,
  });
  const soilMoisture = await new SoilMoistureStatusProvider().interpret({
    capability: SOIL_MOISTURE_CAPABILITY_ID,
    records,
  });

  return { weather, soilMoisture };
}

/**
 * Education Workspace Home — "Explain This Data" (BUILD_PLAN "STAGE —
 * EDUCATION WORKSPACE", the sixth and final of the six previously-
 * unbuilt PRD workspaces, PRD Section A.8). Scoped and confirmed with
 * the owner explicitly before building — the strictest scope-narrowing
 * of any workspace so far, given PRD A.8's own "Special note": this
 * workspace "requires the most conservative child-safety, data-privacy,
 * and moderation design on the entire platform... as a hard requirement,
 * not a later addition."
 *
 * **Honest scope, stated plainly — this is educator-facing tooling
 * only. No part of this build collects, stores, or displays any real
 * minor's personal data, and no student ever logs in.**
 *
 * - **What's real**: an educator-only tool that reuses the two already-
 *   proven interpretation capabilities and adds a grade-band-appropriate
 *   explanation *framing* around each provider's own summary sentence —
 *   see `lib/simplify-explanation.ts`'s doc comment for exactly why the
 *   underlying data sentence itself is never rewritten (this is
 *   presentation, not a new AI capability, and doesn't need its own
 *   evaluation framework as a result). A simplified map view
 *   (`map/page.tsx`) and a downloadable sample lesson plan
 *   (`lesson-plan/page.tsx`) grounded in the same real data.
 * - **NOT built, deliberately, and this is the important one: no real
 *   Student accounts, anywhere.** PRD A.8 describes signup that
 *   "captures grade level/context" for students directly and a Student
 *   role "scoped to assigned lessons." This codebase has no age
 *   verification, no COPPA-style verifiable-parental-consent flow, and
 *   no data-minimization design reviewed for minors' data specifically
 *   — building real student accounts without those safeguards actually
 *   in place would be worse than not building them, not a narrower
 *   version of the same feature. This is treated as its own, later,
 *   explicitly-scoped decision, not something to approximate here.
 * - **No moderated peer collaboration / classroom social features** —
 *   PRD A.8 explicitly requires this to be "moderated, per child-safety-
 *   appropriate design," and this codebase has no content-moderation
 *   infrastructure anywhere. Same reasoning as above: not a narrow
 *   slice, a separate, deliberately-scoped build.
 * - **No Institution Admin multi-classroom oversight** — meaningless
 *   without real classrooms/students to oversee.
 * - **No assignment/lesson-deadline notifications** — same; needs real
 *   student accounts to mean anything.
 * - **No student project exports** — PRD A.8 names these explicitly;
 *   they require real student work to exist, which this build does not
 *   collect. The lesson-plan download that does exist is educator-
 *   authored/generated only.
 * - **Not verified against the live NASA POWER API from this build
 *   environment** — same caveat as every other workspace's page.
 */
export default async function EducationWorkspaceHome() {
  logTelemetry.event("workspace_viewed", { workspace: WORKSPACE_ID });
  const role = await getWorkspaceRole(WORKSPACE_ID);
  const { weather, soilMoisture } = await getExplainableData();

  return (
    <WorkspaceShell activeKey="home" role={role}>
      <Text variant="pageTitle" as="h1" style={{ marginBottom: "var(--wv-space-xs)" }}>
        Explain This Data
      </Text>
      <Text
        variant="body"
        style={{ color: "var(--wv-text-secondary)", marginBottom: "var(--wv-space-lg)" }}
      >
        {DEMO_LOCATION.label} — real current data, explained at the grade level you pick. For
        educators to use in class; no student accounts or data are collected anywhere in this
        workspace.
      </Text>

      <ExplainThisDataClient
        weather={{
          summary: weather.summary,
          confidence: weather.confidence,
          unableToAnswer: Boolean(weather.unableToAnswer),
        }}
        soilMoisture={{
          summary: soilMoisture.summary,
          confidence: soilMoisture.confidence,
          unableToAnswer: Boolean(soilMoisture.unableToAnswer),
        }}
      />
    </WorkspaceShell>
  );
}
