"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
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

interface Verdict {
  color: string;
  label: string;
}

const MODE_TOGGLE_LABEL: Record<ReferenceMapMode, string> = {
  temperature: "Temperature",
  generation: "Generation band",
  "route-risk": "Route risk band",
  "site-risk": "Site risk",
  moisture: "Show ground wetness",
  raw: "Raw readings",
};

// Band boundaries mirror each workspace's interpretation provider and
// the single-marker maps these replace; kept in sync manually since
// this is a display concern (same precedent as the original MapViews).

function temperatureVerdict(t: number): Verdict {
  if (t <= 5) return { color: "#5b7a8c", label: "cold" };
  if (t <= 15) return { color: "#8fa8a0", label: "cool" };
  if (t <= 25) return { color: "#3f9f7e", label: "mild" };
  if (t <= 32) return { color: "#d4652f", label: "warm" };
  return { color: "#b3401f", label: "hot" };
}

function generationVerdict(w: number): Verdict {
  if (w < 3) return { color: "#9a9a9a", label: "below cut-in" };
  if (w < 12) return { color: "#3f7f9f", label: "ramping" };
  if (w < 25) return { color: "#3f9f7e", label: "rated output" };
  return { color: "#b3401f", label: "cut-out" };
}

function routeRiskVerdict(w: number): Verdict {
  if (w < 8) return { color: "#3f9f7e", label: "clear" };
  if (w < 14) return { color: "#d4a72f", label: "elevated" };
  if (w < 20) return { color: "#d4652f", label: "high" };
  return { color: "#b3401f", label: "severe" };
}

function siteRiskVerdict(t?: number, w?: number): Verdict | undefined {
  if (t === undefined && w === undefined) return undefined;
  const levels: number[] = []; // 0 go, 1 caution, 2 no-go
  if (t !== undefined) levels.push(t < 5 ? 2 : t > 32 ? 1 : 0);
  if (w !== undefined) levels.push(w >= 13 ? 2 : w >= 8 ? 1 : 0);
  const worst = Math.max(...levels);
  if (worst === 2) return { color: "#b3401f", label: "no-go" };
  if (worst === 1) return { color: "#d4652f", label: "caution" };
  return { color: "#3f9f7e", label: "go" };
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
  const label = m <= 0.4 ? "Dry" : m <= 0.6 ? "Somewhat wet" : "Wet";
  return { color, label };
}

function rawText(site: SiteReading): string {
  return [
    site.temperatureValue !== undefined ? `${site.temperatureValue.toFixed(1)}°C` : undefined,
    site.windValue !== undefined ? `${site.windValue.toFixed(1)} m/s wind` : undefined,
  ]
    .filter((v): v is string => Boolean(v))
    .join(", ");
}

/** The verdict for one site under one mode, or undefined if the site has
 *  no reading for what this mode needs (it is then simply not plotted —
 *  never shown with a placeholder value). */
function verdictFor(
  mode: ReferenceMapMode,
  site: SiteReading,
): (Verdict & { detail: string }) | undefined {
  switch (mode) {
    case "temperature":
      if (site.temperatureValue === undefined) return undefined;
      return {
        ...temperatureVerdict(site.temperatureValue),
        detail: `${site.temperatureValue.toFixed(1)}°C`,
      };
    case "generation":
      if (site.windValue === undefined) return undefined;
      return {
        ...generationVerdict(site.windValue),
        detail: `${site.windValue.toFixed(1)} m/s wind`,
      };
    case "route-risk":
      if (site.windValue === undefined) return undefined;
      return {
        ...routeRiskVerdict(site.windValue),
        detail: `${site.windValue.toFixed(1)} m/s wind`,
      };
    case "site-risk": {
      const v = siteRiskVerdict(site.temperatureValue, site.windValue);
      return v ? { ...v, detail: rawText(site) } : undefined;
    }
    case "moisture":
      if (site.moistureValue === undefined) return undefined;
      return { ...moistureVerdict(site.moistureValue), detail: "" };
    case "raw": {
      const text = rawText(site);
      // Neutral gray — deliberately not a status color (Research shows
      // raw values, minimally interpreted).
      return text ? { color: "#6b7280", label: "", detail: text } : undefined;
    }
  }
}

function popupTextFor(site: SiteReading, v: Verdict & { detail: string }): string {
  const parts = [site.name];
  if (v.detail) parts.push(v.detail);
  if (v.label) parts.push(v.label);
  return parts.join(" — ");
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
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRefs = useRef<maplibregl.Marker[]>([]);
  const [overlayOn, setOverlayOn] = useState(true);

  const plotted = useMemo(
    () =>
      sites.flatMap((site) => {
        const v = verdictFor(mode, site);
        return v ? [{ site, v }] : [];
      }),
    [mode, sites],
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
  }, [overlayOn, plotted]);

  const description = overlayOn
    ? `Map of ${plotted.length} sample reference sites. ${plotted
        .map(({ site, v }) => popupTextFor(site, v))
        .join("; ")}.`
    : "Map of sample reference sites. The overlay is currently hidden.";

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
        {MODE_TOGGLE_LABEL[mode]}
      </label>
      <span style={{ ...chip, bottom: "var(--wv-space-sm)", left: "var(--wv-space-sm)" }}>
        Sample reference sites — {plotted.length} of {sites.length + failedSites} reporting
      </span>
    </div>
  );
}
