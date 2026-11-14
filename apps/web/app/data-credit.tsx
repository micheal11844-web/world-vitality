"use client";

import Link from "next/link";
import { GEONAMES_CREDIT_URL, OPEN_METEO_CREDIT_URL } from "@world-vitality/hazard-feeds";
import { useOptionalI18n } from "../lib/i18n/i18n-provider";

/**
 * The credit line Open-Meteo asks for, placed next to the data it covers.
 *
 * Open-Meteo's free licence (CC BY 4.0) requires "a link next to any location
 * Open-Meteo data are displayed", so every card that shows a forecast carries
 * `kind="weather"` ("Weather data by Open-Meteo.com", linked to their site), and
 * every place that shows a place-search result carries `kind="places"` (the
 * search is Open-Meteo's, and its place names are GeoNames data, which has its
 * own credit). Both end with a link to the full "Data sources and credits"
 * page.
 *
 * Translated where the page is (inside a `LocaleBoundary`), English elsewhere,
 * like `AppDownloadsLink`. The names stay as written in every language.
 */
export type DataCreditKind = "weather" | "places";

const EXTERNAL_LINK = { target: "_blank", rel: "noopener noreferrer" } as const;
const LINK_STYLE = { color: "var(--wv-accent)", textDecoration: "underline" } as const;

export function DataCredit({ kind }: { kind: DataCreditKind }) {
  const i18n = useOptionalI18n();
  const t = (key: Parameters<NonNullable<typeof i18n>["t"]>[0], fallback: string) =>
    i18n ? i18n.t(key) : fallback;

  return (
    <p
      data-testid={`data-credit-${kind}`}
      style={{
        margin: "var(--wv-space-sm) 0 0",
        color: "var(--wv-text-secondary)",
        fontFamily: "var(--wv-font-sans)",
        fontSize: "var(--wv-text-sm, 0.875rem)",
      }}
    >
      {kind === "weather" ? (
        <>
          {t("credits.weatherBy", "Weather data by")}{" "}
          <a href={OPEN_METEO_CREDIT_URL} {...EXTERNAL_LINK} style={LINK_STYLE}>
            Open-Meteo.com
          </a>
        </>
      ) : (
        <>
          {t("credits.placesBy", "Place search by")}{" "}
          <a href={OPEN_METEO_CREDIT_URL} {...EXTERNAL_LINK} style={LINK_STYLE}>
            Open-Meteo.com
          </a>
          {" · "}
          {t("credits.placesData", "Location data based on")}{" "}
          <a href={GEONAMES_CREDIT_URL} {...EXTERNAL_LINK} style={LINK_STYLE}>
            GeoNames
          </a>
        </>
      )}
      {" · "}
      <Link href="/sources" style={LINK_STYLE}>
        {t("credits.title", "Data sources and credits")}
      </Link>
    </p>
  );
}
