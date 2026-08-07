"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export interface MapViewProps {
  latitude: number;
  longitude: number;
  /** Soil moisture value (0=dry, 1=saturated) for the one data overlay. */
  moistureValue?: number;
}

/** Color the one data overlay by moisture level — reuses the same
 *  band boundaries as `SoilMoistureStatusProvider`, kept in sync
 *  manually since this is a display concern, not logic worth importing
 *  a whole service for. */
function colorForMoisture(value: number): string {
  if (value <= 0.2) return "#b3401f"; // very dry — critical family
  if (value <= 0.4) return "#d4652f"; // dry
  if (value <= 0.6) return "#a8a89e"; // moderate — neutral
  if (value <= 0.8) return "#3f9f7e"; // moist — accent
  return "#175a46"; // saturated
}

/** Same band boundaries, in plain language — used for the accessible
 *  description below. */
function moistureLabel(value: number): string {
  if (value <= 0.2) return "very dry";
  if (value <= 0.4) return "dry";
  if (value <= 0.6) return "moderate moisture";
  if (value <= 0.8) return "moist";
  return "saturated";
}

/**
 * Map view (ticket 6.4) — "base layers + one data overlay" per
 * BUILD_PLAN's own narrow scope, not the full Section 11 spec (which
 * additionally describes satellite/terrain layer switching, a timeline
 * scrubber, drawing tools, search, bookmarks, and sharing — none of
 * which are built here; see this component's README note).
 *
 * Base layer: OpenStreetMap raster tiles via MapLibre GL — chosen as a
 * low-stakes, reversible tooling pick (no API key, no vendor account
 * required, unlike Mapbox). Swappable later without touching any other
 * component, same as the pnpm/Zod choices earlier in this build.
 *
 * Data overlay: a single marker at the field location, colored by the
 * same soil-moisture band the Stage 4 provider classifies into —
 * "toggleable, never all-on by default" (Section 11) is honored via the
 * checkbox below, though with only one real overlay, "toggleable" here
 * just means on/off rather than a full layer-control panel.
 */
export function MapView({ latitude, longitude, moistureValue }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const [overlayOn, setOverlayOn] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      // A clean, minimal "insight-first" base style (Section 11's
      // default) — free OSM raster tiles, no API key.
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

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markerRef.current?.remove();
    markerRef.current = null;

    if (overlayOn && moistureValue !== undefined) {
      markerRef.current = new maplibregl.Marker({ color: colorForMoisture(moistureValue) })
        .setLngLat([longitude, latitude])
        .addTo(map);
    }
  }, [overlayOn, moistureValue, latitude, longitude]);

  const description =
    overlayOn && moistureValue !== undefined
      ? `Map centered on the selected field. Soil moisture overlay shows ${moistureLabel(moistureValue)} conditions (${moistureValue.toFixed(2)} on a 0 to 1 scale) at the field marker.`
      : "Map centered on the selected field. Soil moisture overlay is currently hidden.";

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      {/* Per Experience Blueprint Section 15: "a screen reader describing
          a map should convey the finding, not just 'image of a map'." The
          canvas itself is aria-hidden (MapLibre's tile/marker rendering
          has no meaningful DOM structure for assistive tech to read) and
          this text carries the actual insight instead. */}
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
        Soil moisture
      </label>
    </div>
  );
}
