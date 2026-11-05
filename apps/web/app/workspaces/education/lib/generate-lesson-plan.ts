import type { ConfidenceLevel } from "@world-vitality/interpretation-engine";
import type { Translate } from "@world-vitality/i18n";
import { simplifyExplanation, type GradeBand, GRADE_BANDS } from "./simplify-explanation";

export interface LessonPlanInput {
  locationLabel: string;
  /** When the data was read, already written out in the educator's language. */
  generatedAt: string;
  weather: { summary: string; confidence: ConfidenceLevel; unableToAnswer: boolean };
  soilMoisture: { summary: string; confidence: ConfidenceLevel; unableToAnswer: boolean };
}

/**
 * Generates a sample lesson plan grounded in real, current data
 * (BUILD_PLAN "STAGE — EDUCATION WORKSPACE", PRD A.8's "educators build
 * custom lesson sequences using platform data"). Template-based, not an
 * AI-generated free-text plan — same reasoning as
 * `simplify-explanation.ts`: this composes real, already-sourced data
 * sentences into a fixed pedagogical structure rather than generating
 * novel text an evaluation framework would need to check. Contains no
 * real student names or data — this is a sample/starting-point document
 * for an educator to adapt, not a record of any actual class.
 *
 * Written in the educator's language. Headings that are capitals in English
 * are stored in sentence case and capitalised here (`toLocaleUpperCase`),
 * because not every script has capitals. The two data sentences quoted in the
 * steps are the engine's own English text and are left as they are.
 */
export function generateLessonPlan(
  input: LessonPlanInput,
  gradeBand: GradeBand,
  t: Translate,
  locale: string,
): string {
  const gradeKey = GRADE_BANDS.find((g) => g.value === gradeBand)?.labelKey;
  const gradeLabel = gradeKey ? t(gradeKey) : gradeBand;
  const caps = (text: string) => text.toLocaleUpperCase(locale);
  const lines: string[] = [];

  lines.push(`${caps(t("edu.doc.title"))} — ${t("edu.doc.subtitle")}`);
  lines.push(t("edu.doc.gradeLevel", { grade: gradeLabel }));
  lines.push(t("edu.doc.location", { place: input.locationLabel }));
  lines.push(t("edu.doc.asOf", { when: input.generatedAt }));
  lines.push("");
  lines.push(t("edu.doc.disclaimer"));
  lines.push("");
  lines.push(caps(t("edu.doc.objective")));
  lines.push(
    gradeBand === "k-2"
      ? t("edu.doc.objective.k2")
      : gradeBand === "3-5"
        ? t("edu.doc.objective.g35")
        : gradeBand === "6-8"
          ? t("edu.doc.objective.g68")
          : t("edu.doc.objective.g912"),
  );
  lines.push("");
  lines.push(caps(t("edu.doc.materials")));
  lines.push(
    t("edu.doc.materials.app", {
      workspace: t("workspace.education.name"),
      explain: t("nav.explainThisData"),
      map: t("nav.map"),
    }),
  );
  lines.push(t("edu.doc.materials.discussion"));
  lines.push("");
  lines.push(caps(t("edu.doc.procedure")));
  lines.push(`1. ${t("edu.doc.step.open", { explain: t("nav.explainThisData") })}`);

  if (!input.weather.unableToAnswer) {
    const weatherExplanation = simplifyExplanation(
      "weather",
      gradeBand,
      input.weather.summary,
      input.weather.confidence,
      t,
    );
    lines.push(`2. ${t("edu.doc.step.weather", { sentence: weatherExplanation.dataSentence })}`);
    lines.push(`   ${t("edu.doc.discuss", { prompt: weatherExplanation.followUpPrompt })}`);
  }

  if (!input.soilMoisture.unableToAnswer) {
    const soilExplanation = simplifyExplanation(
      "soil-moisture",
      gradeBand,
      input.soilMoisture.summary,
      input.soilMoisture.confidence,
      t,
    );
    lines.push(`3. ${t("edu.doc.step.soil", { sentence: soilExplanation.dataSentence })}`);
    lines.push(`   ${t("edu.doc.discuss", { prompt: soilExplanation.followUpPrompt })}`);
  }

  lines.push(`4. ${t("edu.doc.step.map", { map: t("nav.map") })}`);
  lines.push(
    `5. ${gradeBand === "9-12" ? t("edu.doc.step.confidence") : t("edu.doc.step.surprise")}`,
  );
  lines.push("");
  lines.push(caps(t("edu.doc.notes")));
  lines.push(t("edu.doc.notes.body"));

  return lines.join("\n");
}
