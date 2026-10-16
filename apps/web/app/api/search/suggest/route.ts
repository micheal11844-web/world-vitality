import { NextResponse } from "next/server";
import { matchLocale } from "@world-vitality/i18n";
import { suggestionsFromEntries } from "@world-vitality/ui-components";
import { buildSearchIndex } from "../../../../lib/search-index";

/** Search text is capped well below anything a person would type on purpose. */
const MAX_QUERY_LENGTH = 200;

/**
 * Type-ahead for workspace/page matches (Global Search, PRD B.4).
 * Pure in-process keyword ranking over the app's own page index — no
 * database, no third party — so it's fast and safe to leave public
 * (it only reveals which pages exist, and the sidebar already shows
 * every one of them to anyone, signed in or not).
 *
 * The query is never logged: people type places and personal topics
 * into search, and nothing here needs to know what.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const q = params.get("q") ?? "";
  if (!q.trim() || q.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ suggestions: [] });
  }
  // The language comes from the URL, not a cookie, so the cached response
  // is correct for whoever asks for that URL. An unknown value is English.
  const locale = matchLocale(params.get("lang")) ?? "en";
  const suggestions = suggestionsFromEntries(buildSearchIndex(locale), q, 6);
  return NextResponse.json(
    { suggestions },
    { headers: { "Cache-Control": "private, max-age=60" } },
  );
}
