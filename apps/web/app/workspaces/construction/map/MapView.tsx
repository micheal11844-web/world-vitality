"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export interface MapViewProps {
  latitude: number;
  longitude: number;
  /** Temperature at 2 meters, °C. */
  temperatureValue?: number;
  /** Wind speed at 2 meters, m/s. */
  windValue?: number;
}

/**
 * Worst-case status across activities, purely for the marker color —
 * duplicates `ConstructionRiskStatusProvider`'s threshold values
 * manually, same precedent as Weather & Climate's and Agriculture's own
 * MapViews ("a display concern, not logic worth importing a whole
 * service for"). Kept in sync by hand; if the provider's thresholds
 * change, this needs a matching edit.
 */
function worstStatus(temperatureValue?: number, windValue?: number): "go" | "caution" | "no-go" {
  const statuses: Array<"go" | "caution" | "no-go"> = [];
  if (temperatureValue !== undefined) {
    if (temperatureValue < 5) statuses.push("no-go");
    else if (temperatureValue > 32) statuses.push("caution");
    else statuses.push("go");
  }
  if (windValue !== undefined) {
    if (windValue >= 13) statuses.push("no-go");
    else if (windValue >= 8) statuses.push("caution");
    else statuses.push("go");
  }
  if (statuses.includes("no-go")) return "no-go";
  if (statuses.includes("caution")) return "caution";
  return "go";
}

function colorForStatus(status: "go" | "caution" | "no-go"): string {
  if (status === "no-go") return "#b3401f";
  if (status === "caution") return "#d4652f";
  return "#3f9f7e";
}

/**
 * Construction's map view (BUILD_PLAN Stage 12). Deliberately
 * structured identically to Agriculture's and Weather & Climate's
 * `MapView.tsx` — a third, concrete run of the same "adding a
 * Workspace is a configuration and content exercise" test those two
 * already validated. Base layer and overlay-toggle mechanics are
 * copied as-is; only the data (a combined temperature+wind risk
 * status instead of a single metric) and its color mapping differ.
 */
export function MapView({ latitude, longitude, temperatureValue, windValue }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const [overlayOn, setOverlayOn] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

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
      center: [longitude, latitude],
      zoom: 11,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude]);

  const status = worstStatus(temperatureValue, windValue);
  const hasData = temperatureValue !== undefined || windValue !== undefined;

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markerRef.current?.remove();
    markerRef.current = null;

    if (overlayOn && hasData) {
      markerRef.current = new maplibregl.Marker({ color: colorForStatus(status) })
        .setLngLat([longitude, latitude])
        .addTo(map);
    }
  }, [overlayOn, hasData, status, longitude, latitude]);

  const description =
    overlayOn && hasData
      ? `Map centered on the selected site. Site risk overlay shows an overall "${status}" status at the site marker.`
      : "Map centered on the selected site. Site risk overlay is currently hidden.";

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      {/* Same accessible-description pattern as Agriculture's and
          Weather & Climate's MapViews — Experience Blueprint Section 15. */}
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
          position: "absolute",
          top: "var(--wv-space-sm)",
          left: "var(--wv-space-sm)",
          backgroundColor: "var(--wv-surface)",
          borderRadius: "var(--wv-radius-sm)",
          padding: "var(--wv-space-xs) var(--wv-space-sm)",
          display: "flex",
          alignItems: "center",
          gap: "var(--wv-space-xs)",
          fontFamily: "var(--wv-font-sans)",
          fontSize: "0.8125rem",
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
        }}
      >
        <input
          type="checkbox"
          checked={overlayOn}
          onChange={(e) => setOverlayOn(e.target.checked)}
        />
        Site risk
      </label>
    </div>
  );
}
