/**
 * Global Search core (PRD B.4): pure, framework-free ranking and query
 * classification, shared by the header's type-ahead (`GlobalSearch`)
 * and the `/search` results page in `apps/web`.
 *
 * **What search honestly does** — "a single search bar that
 * understands location queries, data-topic queries, and natural-
 * language questions":
 *
 * - *Data-topic queries* ("flood", "soil moisture", "invite teammate")
 *   are matched against a hand-maintained index of workspaces and
 *   pages (`SearchEntry`) by label, keyword and description. This is
 *   plain deterministic keyword matching — not semantic search.
 * - *Location queries* are resolved by the host app (a geocoder), not
 *   here; this module only tells it what to geocode
 *   (`extractPlaceCandidate`).
 * - *Natural-language questions* are **recognised**, not answered.
 *   The app has no open-ended question-answering model, and PRD B.5
 *   requires "I don't have reliable data for that" over guessing — so
 *   a question gets routed (to the topic it mentions and to the place
 *   it names, if any) and the results page says plainly that it
 *   can't answer it directly.
 */

export type SearchEntryKind = "workspace" | "page" | "setting" | "tool";

export interface SearchEntry {
  id: string;
  kind: SearchEntryKind;
  label: string;
  /** One short line shown under the label. Also searched (low weight). */
  description?: string;
  href: string;
  /** Synonyms and topic words people would type for this destination. */
  keywords: string[];
  /**
   * Topic words belonging to the *parent* (a workspace's sub-pages
   * inherit its topics). Matched exactly and weighted far below `keywords`,
   * so "flood map" can find Disaster Monitoring — Map while plain
   * "flood" still puts the workspace itself first.
   */
  inheritedKeywords?: string[];
}

/** What the type-ahead and results page actually render. */
export interface SearchSuggestion {
  id: string;
  kind: SearchEntryKind | "place";
  label: string;
  description?: string;
  href: string;
}

export type QueryKind = "empty" | "question" | "keywords";

const QUESTION_WORDS = new Set([
  "what",
  "whats",
  "where",
  "when",
  "why",
  "how",
  "who",
  "which",
  "is",
  "are",
  "will",
  "does",
  "do",
  "can",
  "should",
  "could",
  "would",
  "was",
  "were",
  "has",
  "have",
]);

/**
 * Words that carry no topic on their own. Dropped before keyword
 * matching so "will it rain in lagos tomorrow?" is matched on "rain"
 * (and "lagos"), not on "will", "it", "in".
 */
const STOPWORDS = new Set([
  ...QUESTION_WORDS,
  "a",
  "an",
  "the",
  "it",
  "its",
  "to",
  "of",
  "in",
  "on",
  "at",
  "for",
  "near",
  "around",
  "me",
  "my",
  "i",
  "we",
  "you",
  "be",
  "going",
  "there",
  "any",
  "this",
  "that",
  "and",
  "or",
  "about",
  "today",
  "tomorrow",
  "tonight",
  "now",
  "right",
  "week",
  "weekend",
  "show",
  "find",
  "get",
  "tell",
]);

/** Lowercases, strips accents and punctuation, collapses whitespace. */
export function normalizeQuery(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .replace(/'/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Topic-bearing tokens: normalized, stopwords removed. */
export function topicTokens(raw: string): string[] {
  return normalizeQuery(raw)
    .split(" ")
    .filter((token) => token.length > 0 && !STOPWORDS.has(token));
}

/**
 * "Question" means it reads as a free-form question the app can't
 * answer directly: ends in "?" or opens with a question word and has
 * at least three words ("is it going to flood near me"). A bare
 * "what" or "how" is just a keyword attempt, not a question.
 */
export function classifyQuery(raw: string): QueryKind {
  const trimmed = raw.trim();
  if (!trimmed) return "empty";
  const words = normalizeQuery(trimmed).split(" ").filter(Boolean);
  if (words.length === 0) return "empty";
  if (trimmed.endsWith("?") && words.length >= 2) return "question";
  if (words.length >= 3 && QUESTION_WORDS.has(words[0] ?? "")) return "question";
  return "keywords";
}

const PLACE_PREPOSITIONS = ["in", "near", "at", "around", "for", "of", "outside"];
/** Trailing time words that are not part of a place name. */
const TRAILING_TIME_WORDS = new Set([
  "today",
  "tomorrow",
  "tonight",
  "now",
  "currently",
  "soon",
  "yet",
  "later",
  "again",
  "this",
  "next",
  "week",
  "weekend",
  "month",
  "year",
  "morning",
  "evening",
  "right",
]);

/**
 * Pulls a likely place name out of a question: the words after the
 * last place-preposition ("is it going to flood near Lagos tomorrow?"
 * → "Lagos"). Returns `null` when there isn't one, or when what
 * follows looks like a pronoun ("near me") — the app has no location
 * permission and will not guess one.
 *
 * This is a heuristic for routing, never a claim: the host app geocodes
 * the candidate and shows what it found, and the person can see and
 * reject a wrong guess.
 */
export function extractPlaceCandidate(raw: string): string | null {
  const cleaned = raw
    .replace(/[?!.]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return null;
  const words = cleaned.split(" ");
  let startIndex = -1;
  for (let i = words.length - 1; i >= 0; i -= 1) {
    if (PLACE_PREPOSITIONS.includes((words[i] ?? "").toLowerCase())) {
      startIndex = i;
      break;
    }
  }
  if (startIndex < 0 || startIndex === words.length - 1) return null;

  const tail = words.slice(startIndex + 1);
  while (tail.length > 0 && TRAILING_TIME_WORDS.has((tail[tail.length - 1] ?? "").toLowerCase())) {
    tail.pop();
  }
  const first = (tail[0] ?? "").toLowerCase();
  if (tail.length === 0 || ["me", "us", "here", "home", "my", "our", "the"].includes(first)) {
    return null;
  }
  const candidate = tail.join(" ").trim();
  return candidate.length >= 2 ? candidate : null;
}

function wordsOf(text: string): string[] {
  return normalizeQuery(text).split(" ").filter(Boolean);
}

/** Results scoring below this fraction of the best score are dropped. */
const RELATIVE_SCORE_CUTOFF = 0.4;

export interface RankedEntry {
  entry: SearchEntry;
  score: number;
}

/**
 * Scores every entry against the query and returns matches, best
 * first. Deterministic, and ties are broken by index order so results
 * don't shuffle between keystrokes.
 *
 * Scoring (higher is better): exact label 100; label prefix 80; label
 * substring 60; then per topic token — label-word prefix +20, exact
 * keyword +15, keyword prefix +10 (3+ letters only, so "ca" doesn't
 * match "cargo"), description word +4. An entry must match at least
 * one topic token (or the whole-label rules) to appear at all; inherited
 * (parent) keywords add +5 on an exact match; and anything scoring under
 * 40% of the best match is dropped.
 */
export function rankEntries(entries: SearchEntry[], rawQuery: string, limit = 8): RankedEntry[] {
  const normalized = normalizeQuery(rawQuery);
  if (!normalized) return [];
  const tokens = topicTokens(rawQuery);

  const ranked: (RankedEntry & { index: number })[] = [];
  entries.forEach((entry, index) => {
    const label = normalizeQuery(entry.label);
    const labelWords = label.split(" ");
    const keywordSet = entry.keywords.map((k) => normalizeQuery(k));
    const keywordWords = new Set(keywordSet.flatMap((k) => k.split(" ")));
    const descriptionWords = new Set(wordsOf(entry.description ?? ""));
    const inheritedWords = new Set((entry.inheritedKeywords ?? []).map((k) => normalizeQuery(k)));

    let score = 0;
    if (label === normalized) score += 100;
    else if (label.startsWith(normalized)) score += 80;
    else if (normalized.length >= 3 && label.includes(normalized)) score += 60;

    for (const token of tokens) {
      let best = 0;
      if (labelWords.some((w) => w.startsWith(token)) && token.length >= 2)
        best = Math.max(best, 20);
      if (keywordSet.includes(token) || keywordWords.has(token)) best = Math.max(best, 15);
      else if (token.length >= 3 && [...keywordWords].some((k) => k.startsWith(token))) {
        best = Math.max(best, 10);
      }
      if (inheritedWords.has(token)) best = Math.max(best, 5);
      if (descriptionWords.has(token)) best = Math.max(best, 4);
      score += best;
    }

    // Multi-word keyword phrases ("soil moisture", "lesson plan").
    if (
      normalized.length >= 4 &&
      keywordSet.some((k) => k.includes(" ") && normalized.includes(k))
    ) {
      score += 12;
    }

    if (score > 0) ranked.push({ entry, score, index });
  });

  ranked.sort((a, b) => b.score - a.score || a.index - b.index);
  // Drop weak tail matches relative to the best one: when something
  // matches strongly, a page that only matched a stray word is noise.
  const cutoff = (ranked[0]?.score ?? 0) * RELATIVE_SCORE_CUTOFF;
  return ranked
    .filter((r) => r.score >= cutoff)
    .slice(0, limit)
    .map(({ entry, score }) => ({ entry, score }));
}

/** Convenience: ranked entries as plain suggestions. */
export function suggestionsFromEntries(
  entries: SearchEntry[],
  rawQuery: string,
  limit = 8,
): SearchSuggestion[] {
  return rankEntries(entries, rawQuery, limit).map(({ entry }) => ({
    id: entry.id,
    kind: entry.kind,
    label: entry.label,
    description: entry.description,
    href: entry.href,
  }));
}
