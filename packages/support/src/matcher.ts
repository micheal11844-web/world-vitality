import {
  EMERGENCY_KEYWORDS,
  SUPPORT_LOCALES,
  SUPPORT_TOPIC_IDS,
  TOPIC_KEYWORDS,
  type SupportLocale,
  type SupportTopicId,
} from "./keywords.js";

/**
 * The help chat's brain: reads one message and says what to answer with.
 *
 * It is a plain keyword matcher, on purpose and for now. It runs in the
 * browser, so nothing a person types leaves their device, there is nothing to
 * pay for, and the same message always gets the same answer. It returns a
 * *kind* of reply, not words: the words live in the translation catalogs
 * (`support.*`), so each language says it its own way.
 *
 * **The seam for a real assistant.** `SupportReply` has a `text` variant for
 * an answer written elsewhere (the owner's bot, later). Whatever produces
 * replies only has to return this type; the chat window already shows it.
 */

export type SupportReply =
  /** Possible danger or distress: the emergency note, nothing else. */
  | { kind: "emergency" }
  /** A topic the app can explain, with a link to the page where it lives. */
  | { kind: "topic"; topic: SupportTopicId }
  /** Not understood: offer the topics and a way to reach a person. */
  | { kind: "fallback" }
  /** An answer written by something else (a bot), shown as it is. */
  | { kind: "text"; text: string };

/** Only this much of a message is read; the rest is ignored. */
const MAX_READ = 500;

const ARABIC = /[؀-ۿ]/;

/**
 * Lowercase; accents, Arabic vowel marks and apostrophes removed; Arabic
 * letter variants folded together (alef forms, final yeh and teh marbuta);
 * every other symbol becomes a space. So "Can't", "CAN’T" and "cant" are
 * one word, and "Contraseña" matches "contrasena".
 */
export function normalise(text: string): string {
  return text
    .slice(0, MAX_READ)
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/['’`´]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** `needle` (already normalised) inside `haystack` (already normalised and padded). */
function contains(paddedHaystack: string, needle: string): boolean {
  // Arabic glues prefixes (و، ب، ل، ال) onto words, so it matches anywhere;
  // every other script matches only at the start of a word.
  return ARABIC.test(needle)
    ? paddedHaystack.includes(needle)
    : paddedHaystack.includes(` ${needle}`);
}

const prepared = new Map<string, readonly string[]>();
function preparedList(key: string, words: readonly string[]): readonly string[] {
  let list = prepared.get(key);
  if (!list) {
    list = words.map(normalise).filter((w) => w.length > 0);
    prepared.set(key, list);
  }
  return list;
}

/** Whether the message suggests someone is in danger or distress, in any language. */
export function detectEmergency(message: string): boolean {
  const padded = ` ${normalise(message)} `;
  return preparedList("emergency", EMERGENCY_KEYWORDS).some((w) => contains(padded, w));
}

function isSupportLocale(value: string): value is SupportLocale {
  return (SUPPORT_LOCALES as readonly string[]).includes(value);
}

/**
 * How well each topic fits a message: the summed length of the distinct
 * keywords found (so a specific phrase outweighs a short common word). The
 * reader's language and English are both tried.
 */
export function scoreTopics(message: string, locale: string): Record<SupportTopicId, number> {
  const padded = ` ${normalise(message)} `;
  const languages: SupportLocale[] =
    isSupportLocale(locale) && locale !== "en" ? [locale, "en"] : ["en"];
  const scores = Object.fromEntries(SUPPORT_TOPIC_IDS.map((id) => [id, 0])) as Record<
    SupportTopicId,
    number
  >;
  for (const language of languages) {
    for (const topic of SUPPORT_TOPIC_IDS) {
      const found = new Set<string>();
      for (const word of preparedList(`${language}.${topic}`, TOPIC_KEYWORDS[language][topic])) {
        if (contains(padded, word)) found.add(word);
      }
      for (const word of found) scores[topic] += word.length;
    }
  }
  return scores;
}

/**
 * The built-in answer to one message. Emergencies come first, always; a tie
 * between topics goes to the one listed first in `SUPPORT_TOPIC_IDS`; nothing
 * matching is a `fallback`, never a guess.
 */
export function replyTo(message: string, locale: string): SupportReply {
  if (normalise(message).length === 0) return { kind: "fallback" };
  if (detectEmergency(message)) return { kind: "emergency" };
  const scores = scoreTopics(message, locale);
  let best: SupportTopicId | null = null;
  for (const topic of SUPPORT_TOPIC_IDS) {
    if (scores[topic] > 0 && (best === null || scores[topic] > scores[best])) best = topic;
  }
  return best ? { kind: "topic", topic: best } : { kind: "fallback" };
}
