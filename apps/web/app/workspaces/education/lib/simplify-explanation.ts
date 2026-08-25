import type { ConfidenceLevel } from "@world-vitality/interpretation-engine";

export type GradeBand = "k-2" | "3-5" | "6-8" | "9-12";

export const GRADE_BANDS: { value: GradeBand; label: string }[] = [
  { value: "k-2", label: "Grades K–2" },
  { value: "3-5", label: "Grades 3–5" },
  { value: "6-8", label: "Grades 6–8" },
  { value: "9-12", label: "Grades 9–12" },
];

export interface SimplifiedExplanation {
  intro: string;
  /** The provider's own summary sentence, verbatim — never rewritten,
   *  paraphrased, or simplified. See this module's doc comment for why. */
  dataSentence: string;
  confidencePhrase: string;
  followUpPrompt: string;
}

/**
 * Grade-level explanation framing for the Education workspace's
 * "Explain This Data" tool (BUILD_PLAN "STAGE — EDUCATION WORKSPACE").
 *
 * **This is deliberately NOT a new AI/interpretation capability.** It
 * is a fixed, rule-based presentation layer over an `InterpretationResult`
 * that has already gone through a real, evaluated provider
 * (`WeatherStatusProvider`, `SoilMoistureStatusProvider`) — see
 * ADR-0003. It never rewrites, paraphrases, or "simplifies" the actual
 * data-bearing sentence (`result.summary`) itself: that sentence came
 * from a provider whose thresholds and confidence model are already
 * documented and tested, and re-wording a real number or classification
 * for a younger grade band risks silently changing its meaning — the
 * exact "AI misinterpretation presented as fact" risk the Engineering
 * Blueprint ranks highest. Instead, this only varies the pedagogical
 * *framing* around that untouched sentence (an intro question, a plain-
 * language confidence phrase, a discussion prompt) by grade band. If a
 * genuine reading-level rewrite of the data sentence itself is wanted
 * later, that is a new, real interpretation capability requiring its
 * own evaluation framework per Constitution AI Principle #4 — not
 * something to fake here.
 */
export function simplifyExplanation(
  topic: "weather" | "soil-moisture",
  gradeBand: GradeBand,
  dataSentence: string,
  confidence: ConfidenceLevel,
): SimplifiedExplanation {
  return {
    intro: introFor(topic, gradeBand),
    dataSentence,
    confidencePhrase: confidencePhraseFor(confidence, gradeBand),
    followUpPrompt: followUpPromptFor(topic, gradeBand),
  };
}

function introFor(topic: "weather" | "soil-moisture", gradeBand: GradeBand): string {
  const topicWord = topic === "weather" ? "the air temperature" : "how wet the soil is";
  switch (gradeBand) {
    case "k-2":
      return topic === "weather"
        ? "Let's find out: is it hot or cold outside right now?"
        : "Let's find out: is the ground thirsty (dry) or full of water (wet) right now?";
    case "3-5":
      return `Here's what real satellite data tells us about ${topicWord} at this location today.`;
    case "6-8":
      return `This is a real, current reading of ${topicWord} at this location, from NASA satellite data.`;
    case "9-12":
      return `Current-conditions reading for ${topicWord} at this location, sourced from NASA POWER satellite data:`;
  }
}

function confidencePhraseFor(confidence: ConfidenceLevel, gradeBand: GradeBand): string {
  if (confidence === "insufficient-data") {
    return gradeBand === "k-2"
      ? "We don't have enough information to know yet — that's okay, scientists say 'I don't know' too!"
      : "There isn't enough recent data to answer this confidently right now.";
  }
  const plain: Record<Exclude<ConfidenceLevel, "insufficient-data">, string> = {
    high: "This is based on several recent readings, so we're fairly confident.",
    moderate: "This is based on a couple of recent readings, so it's a reasonable estimate.",
    low: "This is based on just one recent reading, so treat it as a rough estimate.",
  };
  const kidPlain: Record<Exclude<ConfidenceLevel, "insufficient-data">, string> = {
    high: "We checked this a few times, so we're pretty sure!",
    moderate: "We checked this a couple of times, so it's a good guess.",
    low: "We only checked this once, so it's just a first guess.",
  };
  return gradeBand === "k-2" ? kidPlain[confidence] : plain[confidence];
}

function followUpPromptFor(topic: "weather" | "soil-moisture", gradeBand: GradeBand): string {
  if (gradeBand === "k-2") {
    return topic === "weather"
      ? "What are you wearing outside today? Does it match?"
      : "Have you seen a puddle or dry, cracked dirt near you lately?";
  }
  if (gradeBand === "3-5") {
    return topic === "weather"
      ? "How does today's temperature compare to what you'd expect for this time of year?"
      : "Why might farmers care about how wet or dry the soil is?";
  }
  if (gradeBand === "6-8") {
    return topic === "weather"
      ? "What factors might cause temperature to vary between two nearby locations?"
      : "How might soil moisture affect the plants and animals living in this area?";
  }
  return topic === "weather"
    ? "This reading reflects current conditions only, not a trend. What additional data would you need to identify a climate trend rather than day-to-day weather?"
    : "This provider's moisture bands are the platform's own threshold interpretation, not a cited agronomic standard (see its source code documentation). Why does that distinction matter when using this data for a real decision?";
}
