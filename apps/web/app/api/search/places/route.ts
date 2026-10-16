import { NextResponse } from "next/server";
import { createTranslator, matchLocale } from "@world-vitality/i18n";
import { geocodeCandidates } from "../../../../lib/geocode";
import { exploreHref, placeLabel } from "../../../../lib/explore-link";
import { logSecurity } from "../../../../lib/logger";

const MIN_QUERY_LENGTH = 3;
const MAX_QUERY_LENGTH = 100;

/**
 * Type-ahead for place matches: a free-text query resolved through the
 * same Open-Meteo geocoder Public Explorer already uses. Anonymous on
 * purpose, like Explorer itself ("no sign-up required for first
 * exploration").
 *
 * Because this is a public endpoint that forwards to a free third-
 * party API, it is bounded: a minimum and maximum query length, at
 * most five results, and a shared-cache header so the same query from
 * many keystrokes/visitors is served from the CDN rather than hitting
 * the geocoder each time. There is no per-user rate limit here — the
 * honest limit of this cache-based protection is that unique queries
 * still reach the geocoder; add a real limiter if abuse shows up.
 *
 * A geocoder failure is not an error to the person typing: type-ahead
 * just shows no places, and the full results page tells them what
 * happened. Neither the query nor any place name is logged.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const q = (params.get("q") ?? "").trim();
  // Language from the URL (not a cookie): this response is shared-cached
  // by URL, so the language has to be part of it.
  const { t } = createTranslator(matchLocale(params.get("lang")) ?? "en");
  if (q.length < MIN_QUERY_LENGTH || q.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const places = await geocodeCandidates(q, 5);
    const suggestions = places.map((place, index) => ({
      id: `place-${index}-${place.latitude}-${place.longitude}`,
      kind: "place" as const,
      label: placeLabel(place),
      description: t("search.placeDescription"),
      href: exploreHref(place),
    }));
    return NextResponse.json(
      { suggestions },
      { headers: { "Cache-Control": "public, max-age=300, s-maxage=3600" } },
    );
  } catch (err) {
    logSecurity.error("search_places_geocode_failed", err);
    return NextResponse.json({ suggestions: [], degraded: true });
  }
}
