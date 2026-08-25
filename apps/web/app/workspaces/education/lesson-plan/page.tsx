import { NasaPowerConnector } from "@world-vitality/data-ingestion";
import {
  WeatherStatusProvider,
  WEATHER_TEMPERATURE_CAPABILITY_ID,
  SoilMoistureStatusProvider,
  SOIL_MOISTURE_CAPABILITY_ID,
} from "@world-vitality/interpretation-engine";
import { can } from "@world-vitality/identity-service";
import { Text, StateDisplay } from "@world-vitality/ui-components";
import { WorkspaceShell } from "../workspace-shell";
import { LessonPlanClient } from "./lesson-plan-client";
import { getWorkspaceRole } from "../../../../lib/get-workspace-role";

export const dynamic = "force-dynamic";

const WORKSPACE_ID = "education";
const DEMO_LOCATION = {
  id: "demo-classroom-location-1",
  latitude: 7.3775,
  longitude: 3.947,
  label: "Demo Classroom Location",
};

async function getLessonData() {
  const connector = new NasaPowerConnector({
    locations: [DEMO_LOCATION],
    parameters: ["T2M", "GWETROOT"],
    community: "AG",
    lookbackDays: 7,
  });
  const { records } = await connector.ingest({
    type: "manual",
    requestedBy: "education-lesson-plan-page",
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
 * Education's sample lesson-plan generator (BUILD_PLAN "STAGE —
 * EDUCATION WORKSPACE"). Gated server-side by `can(role, "export:data")`
 * — the closest existing permission to "produce a downloadable
 * document," same enforcement approach as
 * `insurance/report/page.tsx`'s `reports:create` gate. Generates a
 * sample/starting-point document only; contains no real student names
 * or data anywhere (see `lib/generate-lesson-plan.ts`'s doc comment).
 */
export default async function EducationLessonPlanPage() {
  const role = await getWorkspaceRole(WORKSPACE_ID);

  if (!can(role, "export:data")) {
    return (
      <WorkspaceShell activeKey="lesson-plan" role={role}>
        <StateDisplay
          status="error"
          title="Access denied"
          description="This role does not have permission to generate lesson plan documents in this workspace."
        />
      </WorkspaceShell>
    );
  }

  const { weather, soilMoisture } = await getLessonData();
  const generatedAt = new Date().toISOString();

  return (
    <WorkspaceShell activeKey="lesson-plan" role={role}>
      <Text variant="pageTitle" as="h1" style={{ marginBottom: "var(--wv-space-xs)" }}>
        Sample Lesson Plan
      </Text>
      <Text
        variant="body"
        style={{ color: "var(--wv-text-secondary)", marginBottom: "var(--wv-space-lg)" }}
      >
        A starting point, grounded in real current data. Contains no real student names or data —
        adapt it for your own class.
      </Text>
      <LessonPlanClient
        locationLabel={DEMO_LOCATION.label}
        generatedAt={generatedAt}
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
