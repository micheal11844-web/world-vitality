import { NextResponse } from "next/server";
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
  const q = new URL(request.url).searchParams.get("q") ?? "";
  if (!q.trim() || q.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ suggestions: [] });
  }
  const suggestions = suggestionsFromEntries(buildSearchIndex(), q, 6);
  return NextResponse.json(
    { suggestions },
    { headers: { "Cache-Control": "private, max-age=60" } },
  );
}
