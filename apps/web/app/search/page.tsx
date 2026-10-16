import type { Metadata } from "next";
import {
  classifyQuery,
  extractPlaceCandidate,
  suggestionsFromEntries,
  type SearchSuggestion,
} from "@world-vitality/ui-components";
import { geocodeCandidates } from "../../lib/geocode";
import { exploreHref, placeLabel } from "../../lib/explore-link";
import { getTranslator } from "../../lib/i18n/server";
import { buildSearchIndex } from "../../lib/search-index";
import { getSessionUserId } from "../../lib/get-session-user-id";
import { logSecurity, logTelemetry } from "../../lib/logger";
import { SearchView } from "./search-view";

export const dynamic = "force-dynamic";

// Result pages are personal-ish (people search for places and topics)
// and have no value in a search engine's index.
export const metadata: Metadata = {
  title: "Search — World Vitality",
  robots: { index: false, follow: false },
};

const MAX_QUERY_LENGTH = 200;

/**
 * Global Search results (PRD B.4). Deliberately outside the
 * `requireSession()` route trees, like Public Explorer: an anonymous
 * visitor can search ("search is the fastest path to insight"), and
 * the sidebar already shows them every workspace. What search *links*
 * to keeps its own gate — a signed-out visitor who follows a workspace
 * result lands on the login page, exactly as the sidebar link would.
 *
 * Three kinds of query, per the PRD:
 * - **Data topics** — matched against the page index (`search-index`).
 * - **Places** — resolved by the geocoder; each result opens Public
 *   Explorer for that exact place.
 * - **Natural-language questions** — recognised and *routed*, not
 *   answered: the topic words and any place named in the question are
 *   looked up, and the page says plainly that the question itself
 *   can't be answered (PRD B.5: "I don't have reliable data for that"
 *   rather than guessing).
 *
 * Only the *kind* and result counts are logged — never the query text.
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.q) ? params.q[0] : params.q;
  const query = (raw ?? "").trim().slice(0, MAX_QUERY_LENGTH);

  const kind = classifyQuery(query);
  const signedIn = (await getSessionUserId()) !== null;
  const { t, locale } = await getTranslator();

  // Page names and descriptions are in the reader's language; the topic
  // keywords they're matched against are English-only for now (the
  // examples on the empty state are English for the same reason).
  const topics: SearchSuggestion[] = query
    ? suggestionsFromEntries(buildSearchIndex(locale), query, 10)
    : [];

  // For a question, geocode the place it names ("…near Lagos") — never
  // the whole sentence, and never a guessed "near me" location.
  const placeQuery = kind === "question" ? extractPlaceCandidate(query) : query;
  let places: SearchSuggestion[] = [];
  let placesFailed = false;
  if (placeQuery && placeQuery.length >= 2) {
    try {
      const found = await geocodeCandidates(placeQuery, 5);
      places = found.map((place, index) => ({
        id: `place-${index}-${place.latitude}-${place.longitude}`,
        kind: "place" as const,
        label: placeLabel(place),
        description: t("search.placeDescription"),
        href: exploreHref(place),
      }));
    } catch (err) {
      placesFailed = true;
      logSecurity.error("search_page_geocode_failed", err);
    }
  }

  if (query) {
    logTelemetry.event("search_performed", {
      kind,
      topicCount: topics.length,
      placeCount: places.length,
      signedIn,
    });
  }

  return (
    <SearchView
      query={query}
      kind={kind}
      topics={topics}
      places={places}
      placeQuery={kind === "question" ? (placeQuery ?? null) : null}
      placesFailed={placesFailed}
      signedIn={signedIn}
    />
  );
}
