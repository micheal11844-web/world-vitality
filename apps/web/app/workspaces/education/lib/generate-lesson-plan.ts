import type { ConfidenceLevel } from "@world-vitality/interpretation-engine";
import { simplifyExplanation, type GradeBand, GRADE_BANDS } from "./simplify-explanation";

export interface LessonPlanInput {
  locationLabel: string;
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
 */
export function generateLessonPlan(input: LessonPlanInput, gradeBand: GradeBand): string {
  const gradeLabel = GRADE_BANDS.find((g) => g.value === gradeBand)?.label ?? gradeBand;
  const lines: string[] = [];

  lines.push(`SAMPLE LESSON PLAN — Exploring Our Local Environment`);
  lines.push(`Grade level: ${gradeLabel}`);
  lines.push(`Location used: ${input.locationLabel}`);
  lines.push(`Data current as of: ${input.generatedAt}`);
  lines.push("");
  lines.push(
    "This is a sample/starting-point lesson plan generated from real, current environmental data. It contains no real student data or names — adapt it for your own class.",
  );
  lines.push("");
  lines.push("OBJECTIVE");
  lines.push(
    gradeBand === "k-2"
      ? "Students will observe and describe real weather and ground conditions at a real place on Earth."
      : gradeBand === "3-5"
        ? "Students will interpret real environmental data and connect it to observable conditions."
        : gradeBand === "6-8"
          ? "Students will analyze real environmental data, including its confidence level, and discuss factors affecting it."
          : "Students will critically evaluate a real environmental dataset, including its stated confidence and known limitations, and identify what additional data would be needed for deeper analysis.",
  );
  lines.push("");
  lines.push("MATERIALS");
  lines.push("- World Vitality Education workspace (Explain This Data / Map)");
  lines.push("- Class discussion space");
  lines.push("");
  lines.push("PROCEDURE");
  lines.push("1. Open the Explain This Data page and select this grade band.");

  if (!input.weather.unableToAnswer) {
    const weatherExplanation = simplifyExplanation(
      "weather",
      gradeBand,
      input.weather.summary,
      input.weather.confidence,
    );
    lines.push(`2. Review the temperature reading together: "${weatherExplanation.dataSentence}"`);
    lines.push(`   Discuss: ${weatherExplanation.followUpPrompt}`);
  }

  if (!input.soilMoisture.unableToAnswer) {
    const soilExplanation = simplifyExplanation(
      "soil-moisture",
      gradeBand,
      input.soilMoisture.summary,
      input.soilMoisture.confidence,
    );
    lines.push(`3. Review the soil moisture reading together: "${soilExplanation.dataSentence}"`);
    lines.push(`   Discuss: ${soilExplanation.followUpPrompt}`);
  }

  lines.push("4. Open the Map page and explore the same location visually.");
  lines.push(
    gradeBand === "9-12"
      ? "5. Ask students to note the stated confidence level for each reading and discuss what would increase or decrease it."
      : "5. Ask students to share one thing that surprised them about the data.",
  );
  lines.push("");
  lines.push("NOTES FOR THE EDUCATOR");
  lines.push(
    "All data shown is real and current, sourced from NASA POWER satellite data (see this platform's data-provenance documentation). This is a single demo location, not necessarily your own class's location. This tool does not collect or store any student data.",
  );

  return lines.join("\n");
}
