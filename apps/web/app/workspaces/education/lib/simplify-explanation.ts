import type { ConfidenceLevel } from "@world-vitality/interpretation-engine";
import type { MessageKey, Translate } from "@world-vitality/i18n";

export type GradeBand = "k-2" | "3-5" | "6-8" | "9-12";

/** Each grade band and the message key for its name in the reader's language. */
export const GRADE_BANDS: { value: GradeBand; labelKey: MessageKey }[] = [
  { value: "k-2", labelKey: "edu.grade.k2" },
  { value: "3-5", labelKey: "edu.grade.g35" },
  { value: "6-8", labelKey: "edu.grade.g68" },
  { value: "9-12", labelKey: "edu.grade.g912" },
];

/** The part of a message key that names a grade band. */
const BAND_KEY: Record<GradeBand, "k2" | "g35" | "g68" | "g912"> = {
  "k-2": "k2",
  "3-5": "g35",
  "6-8": "g68",
  "9-12": "g912",
};

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
 *
 * The framing is written out in each language (`edu.*` messages); the data
 * sentence is the engine's own English text and is left exactly as it is.
 */
export function simplifyExplanation(
  topic: "weather" | "soil-moisture",
  gradeBand: GradeBand,
  dataSentence: string,
  confidence: ConfidenceLevel,
  t: Translate,
): SimplifiedExplanation {
  return {
    intro: introFor(topic, gradeBand, t),
    dataSentence,
    confidencePhrase: confidencePhraseFor(confidence, gradeBand, t),
    followUpPrompt: followUpPromptFor(topic, gradeBand, t),
  };
}

function introFor(topic: "weather" | "soil-moisture", gradeBand: GradeBand, t: Translate): string {
  const subject = topic === "weather" ? "weather" : "soil";
  return t(`edu.intro.${BAND_KEY[gradeBand]}.${subject}` as MessageKey);
}

function confidencePhraseFor(
  confidence: ConfidenceLevel,
  gradeBand: GradeBand,
  t: Translate,
): string {
  if (confidence === "insufficient-data") {
    return gradeBand === "k-2" ? t("edu.conf.insufficientKid") : t("edu.conf.insufficient");
  }
  return gradeBand === "k-2" ? t(`edu.conf.kid.${confidence}`) : t(`edu.conf.${confidence}`);
}

function followUpPromptFor(
  topic: "weather" | "soil-moisture",
  gradeBand: GradeBand,
  t: Translate,
): string {
  const subject = topic === "weather" ? "weather" : "soil";
  return t(`edu.followUp.${BAND_KEY[gradeBand]}.${subject}` as MessageKey);
}
