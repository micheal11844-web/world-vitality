"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MessageKey } from "@world-vitality/i18n";
import { maplibregl } from "../../lib/maps/maplibre";
import { siteNameKey } from "../../lib/maps/site-names";
import { useI18n } from "../../lib/i18n/i18n-provider";
import type { SiteReading } from "../../lib/reference-sites";

/**
 * Which reading, and which band scheme, a workspace's map colors its
 * markers by. One shared map component for the six workspaces that
 * plot reference sites (see `lib/reference-sites.ts`) — extracted once
 * five more consumers existed, instead of six near-identical copies of
 * the same ~150-line MapLibre component (Engineering Blueprint 4.5).
 * Each workspace's own `map/MapView.tsx` is now a one-line wrapper that
 * picks its mode.
 */
export type ReferenceMapMode =
  | "temperature" // Weather & Climate
  | "generation" // Renewable Energy (wind turbine output band)
  | "route-risk" // Logistics & Shipping (wind route-risk band)
  | "site-risk" // Construction (go / caution / no-go)
  | "moisture" // Education (plain-language ground wetness)
  | "raw"; // Research (raw values, deliberately uncolored)

/** The band's colour and, as a message key, its plain-language name (none for raw readings). */
interface Verdict {
  color: string;
  labelKey?: MessageKey;
}

/** Numbers and joins in the reader's language, built once per language. */
interface Formatters {
  temp: (v: number) => string;
  wind: (v: number) => string;
  join: string;
}

const MODE_TOGGLE_KEY: Record<ReferenceMapMode, MessageKey> = {
  temperature: "map.mode.temperature",
  generation: "map.mode.generation",
  "route-risk": "map.mode.routeRisk",
  "site-risk": "map.mode.siteRisk",
  moisture: "map.mode.moisture",
  raw: "map.mode.raw",
};

// Band boundaries mirror each workspace's interpretation provider and
// the single-marker maps these replace; kept in sync manually since
// this is a display concern (same precedent as the original MapViews).

function temperatureVerdict(t: number): Verdict {
  if (t <= 5) return { color: "#5b7a8c", labelKey: "map.verdict.cold" };
  if (t <= 15) return { color: "#8fa8a0", labelKey: "map.verdict.cool" };
  if (t <= 25) return { color: "#3f9f7e", labelKey: "map.verdict.mild" };
  if (t <= 32) return { color: "#d4652f", labelKey: "map.verdict.warm" };
  return { color: "#b3401f", labelKey: "map.verdict.hot" };
}

function generationVerdict(w: number): Verdict {
  if (w < 3) return { color: "#9a9a9a", labelKey: "map.verdict.belowCutIn" };
  if (w < 12) return { color: "#3f7f9f", labelKey: "map.verdict.ramping" };
  if (w < 25) return { color: "#3f9f7e", labelKey: "map.verdict.rated" };
  return { color: "#b3401f", labelKey: "map.verdict.cutOut" };
}

function routeRiskVerdict(w: number): Verdict {
  if (w < 8) return { color: "#3f9f7e", labelKey: "map.verdict.clear" };
  if (w < 14) return { color: "#d4a72f", labelKey: "map.verdict.elevated" };
  if (w < 20) return { color: "#d4652f", labelKey: "map.verdict.high" };
  return { color: "#b3401f", labelKey: "map.verdict.severe" };
}

function siteRiskVerdict(t?: number, w?: number): Verdict | undefined {
  if (t === undefined && w === undefined) return undefined;
  const levels: number[] = []; // 0 go, 1 caution, 2 no-go
  if (t !== undefined) levels.push(t < 5 ? 2 : t > 32 ? 1 : 0);
  if (w !== undefined) levels.push(w >= 13 ? 2 : w >= 8 ? 1 : 0);
  const worst = Math.max(...levels);
  if (worst === 2) return { color: "#b3401f", labelKey: "construction.status.noGo" };
  if (worst === 1) return { color: "#d4652f", labelKey: "construction.status.caution" };
  return { color: "#3f9f7e", labelKey: "construction.status.go" };
}

function moistureVerdict(m: number): Verdict {
  const color =
    m <= 0.2
      ? "#b3401f"
      : m <= 0.4
        ? "#d4652f"
        : m <= 0.6
          ? "#a8a89e"
          : m <= 0.8
            ? "#3f9f7e"
            : "#175a46";
  const labelKey: MessageKey =
    m <= 0.4 ? "map.verdict.dry" : m <= 0.6 ? "map.verdict.somewhatWet" : "map.verdict.wet";
  return { color, labelKey };
}

function rawText(site: SiteReading, fmt: Formatters): string {
  return [
    site.temperatureValue !== undefined ? fmt.temp(site.temperatureValue) : undefined,
    site.windValue !== undefined ? fmt.wind(site.windValue) : undefined,
  ]
    .filter((v): v is string => Boolean(v))
    .join(fmt.join);
}

/** The verdict for one site under one mode, or undefined if the site has
 *  no reading for what this mode needs (it is then simply not plotted —
 *  never shown with a placeholder value). */
function verdictFor(
  mode: ReferenceMapMode,
  site: SiteReading,
  fmt: Formatters,
): (Verdict & { detail: string }) | undefined {
  switch (mode) {
    case "temperature":
      if (site.temperatureValue === undefined) return undefined;
      return {
        ...temperatureVerdict(site.temperatureValue),
        detail: fmt.temp(site.temperatureValue),
      };
    case "generation":
      if (site.windValue === undefined) return undefined;
      return {
        ...generationVerdict(site.windValue),
        detail: fmt.wind(site.windValue),
      };
    case "route-risk":
      if (site.windValue === undefined) return undefined;
      return {
        ...routeRiskVerdict(site.windValue),
        detail: fmt.wind(site.windValue),
      };
    case "site-risk": {
      const v = siteRiskVerdict(site.temperatureValue, site.windValue);
      return v ? { ...v, detail: rawText(site, fmt) } : undefined;
    }
    case "moisture":
      if (site.moistureValue === undefined) return undefined;
      return { ...moistureVerdict(site.moistureValue), detail: "" };
    case "raw": {
      const text = rawText(site, fmt);
      // Neutral gray — deliberately not a status color (Research shows
      // raw values, minimally interpreted).
      return text ? { color: "#6b7280", detail: text } : undefined;
    }
  }
}

export interface ReferenceSitesMapProps {
  mode: ReferenceMapMode;
  sites: SiteReading[];
  /** Sites that failed to load, so the map can say so rather than
   *  silently looking complete. */
  failedSites?: number;
}

/**
 * Multi-marker map over the shared reference sites. Base layer:
 * OpenStreetMap raster tiles via MapLibre GL (no API key — same choice
 * as every other workspace map). One toggleable overlay; the viewport
 * fits every plotted site once on load. Each marker has a popup with
 * the site name, its reading and its band.
 *
 * Honest scope: these are sample sites, and the map says so on-screen.
 * No clustering (six sites), no layer switching, search or drawing —
 * same boundary the single-marker maps drew.
 */
export function ReferenceSitesMap({ mode, sites, failedSites = 0 }: ReferenceSitesMapProps) {
  const { t, locale } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRefs = useRef<maplibregl.Marker[]>([]);
  const [overlayOn, setOverlayOn] = useState(true);

  // Readings in the reader's numerals and units.
  const fmt = useMemo<Formatters>(() => {
    const one = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    return {
      temp: (v) => t("map.tempValue", { value: one.format(v) }),
      wind: (v) => t("map.windValue", { value: one.format(v) }),
      join: locale === "ar" ? "، " : ", ",
    };
  }, [t, locale]);

  const plotted = useMemo(
    () =>
      sites.flatMap((site) => {
        const v = verdictFor(mode, site, fmt);
        return v ? [{ site, v }] : [];
      }),
    [mode, sites, fmt],
  );

  /** "Name — reading — band", with the place name in the reader's language. */
  const popupTextFor = useCallback(
    (site: SiteReading, v: Verdict & { detail: string }): string => {
      const nameKey = siteNameKey(site.id);
      const parts = [nameKey ? t(nameKey) : site.name];
      if (v.detail) parts.push(v.detail);
      if (v.labelKey) parts.push(t(v.labelKey));
      return parts.reduce((first, second) => t("map.popup.pair", { first, second }));
    },
    [t],
  );

  useEffect(() => {
    if (!containerRef.current || sites.length === 0) return;

    const bounds = new maplibregl.LngLatBounds();
    for (const site of sites) bounds.extend([site.longitude, site.latitude]);

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "&copy; OpenStreetMap contributors",
          },
        },
        layers: [{ id: "osm", type: "raster", source: "osm" }],
      },
      bounds,
      fitBoundsOptions: { padding: 56, maxZoom: 10 },
    });
    map.addControl(new maplibregl.NavigationControl(), "top-right");
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // Fit once over every site regardless of toggle state, so a toggle
    // click never re-fits the viewport.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sites.length]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    for (const marker of markerRefs.current) marker.remove();
    markerRefs.current = [];
    if (!overlayOn) return;

    for (const { site, v } of plotted) {
      markerRefs.current.push(
        new maplibregl.Marker({ color: v.color })
          .setLngLat([site.longitude, site.latitude])
          .setPopup(new maplibregl.Popup({ closeButton: false }).setText(popupTextFor(site, v)))
          .addTo(map),
      );
    }
  }, [overlayOn, plotted, popupTextFor]);

  const description = overlayOn
    ? t("map.ref.descOn", {
        count: plotted.length,
        items: `${plotted.map(({ site, v }) => popupTextFor(site, v)).join("; ")}.`,
      })
    : t("map.ref.descOff");

  const chip = {
    position: "absolute" as const,
    backgroundColor: "var(--wv-surface)",
    borderRadius: "var(--wv-radius-sm)",
    padding: "var(--wv-space-xs) var(--wv-space-sm)",
    fontFamily: "var(--wv-font-sans)",
    fontSize: "0.8125rem",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
  };

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      <p
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        {description}
      </p>
      <div ref={containerRef} aria-hidden="true" style={{ height: "100%", width: "100%" }} />
      <label
        style={{
          ...chip,
          top: "var(--wv-space-sm)",
          left: "var(--wv-space-sm)",
          display: "flex",
          alignItems: "center",
          gap: "var(--wv-space-xs)",
        }}
      >
        <input
          type="checkbox"
          checked={overlayOn}
          onChange={(e) => setOverlayOn(e.target.checked)}
        />
        {t(MODE_TOGGLE_KEY[mode])}
      </label>
      <span style={{ ...chip, bottom: "var(--wv-space-sm)", left: "var(--wv-space-sm)" }}>
        {t("map.ref.coverage", { plotted: plotted.length, total: sites.length + failedSites })}
      </span>
    </div>
  );
}
