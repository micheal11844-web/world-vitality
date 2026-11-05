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
import { getTranslator } from "../../../../lib/i18n/server";
import { getWorkspaceRole } from "../../../../lib/get-workspace-role";
import { resolveWorkspaceLocation, type WorkspaceLocation } from "../../../../lib/home-location";

export const dynamic = "force-dynamic";

const WORKSPACE_ID = "education";
// Fallback only — see `education/page.tsx`.
const DEMO_LOCATION = {
  id: "demo-classroom-location-1",
  latitude: 7.3775,
  longitude: 3.947,
  label: "Demo Classroom Location",
};

async function getLessonData(location: WorkspaceLocation) {
  const connector = new NasaPowerConnector({
    locations: [location],
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
  const { t } = await getTranslator();

  if (!can(role, "export:data")) {
    return (
      <WorkspaceShell activeKey="lesson-plan" role={role}>
        <StateDisplay
          status="error"
          title={t("report.accessDenied")}
          description={t("edu.lesson.accessDeniedBody")}
        />
      </WorkspaceShell>
    );
  }

  const resolved = await resolveWorkspaceLocation(DEMO_LOCATION);
  // The demo place is named in the reader's language; a home place keeps its own name.
  const location = resolved.isHome ? resolved : { ...resolved, label: t("edu.demoLocation") };
  const { weather, soilMoisture } = await getLessonData(location);
  const generatedAt = new Date().toISOString();

  return (
    <WorkspaceShell activeKey="lesson-plan" role={role}>
      <Text variant="pageTitle" as="h1" style={{ marginBottom: "var(--wv-space-xs)" }}>
        {t("edu.lesson.title")}
      </Text>
      <Text
        variant="body"
        style={{ color: "var(--wv-text-secondary)", marginBottom: "var(--wv-space-lg)" }}
      >
        {t("edu.lesson.intro")}
      </Text>
      <LessonPlanClient
        locationLabel={location.label}
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
