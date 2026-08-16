"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export interface MapViewProps {
  latitude: number;
  longitude: number;
  /** Temperature at 2 meters, °C, for the one data overlay. */
  temperatureValue?: number;
}

/** Color the one data overlay by temperature band — reuses the same
 *  band boundaries as `WeatherStatusProvider`, kept in sync manually
 *  since this is a display concern, not logic worth importing a whole
 *  service for (same precedent as Agriculture's MapView). Reuses two
 *  of the same hex values Agriculture's map already uses for its
 *  "concerning" bands (dry/very-dry), since both represent temperature
 *  extremes here too — not a coincidence, a deliberate small reuse. */
function colorForTemperature(value: number): string {
  if (value <= 5) return "#5b7a8c"; // cold
  if (value <= 15) return "#8fa8a0"; // cool
  if (value <= 25) return "#3f9f7e"; // mild — accent, same as "moist" on Agriculture's map
  if (value <= 32) return "#d4652f"; // warm — same hex as Agriculture's "dry"
  return "#b3401f"; // hot — same hex as Agriculture's "very dry"
}

/** Same band boundaries, in plain language — mirrors
 *  WeatherStatusProvider's own band labels exactly. */
function temperatureLabel(value: number): string {
  if (value <= 5) return "cold";
  if (value <= 15) return "cool";
  if (value <= 25) return "mild";
  if (value <= 32) return "warm";
  return "hot";
}

/**
 * Weather & Climate's map view (BUILD_PLAN Stage 10, ticket 10.5).
 * Deliberately structured identically to Agriculture's `MapView.tsx` —
 * this is the real, concrete test of whether that pattern generalizes,
 * per PRD Section C's "adding a new Workspace is fundamentally a
 * configuration and content exercise" claim, applied one level deeper
 * than the workspace-shell-level test Stage 10.2/10.3 already ran.
 *
 * Same honest scope as Agriculture's: "base layers + one data overlay"
 * (BUILD_PLAN 6.4's narrow-scope precedent), not the PRD's full vision
 * (layer switching, timeline scrubber, drawing tools, search). Base
 * layer and overlay-toggle mechanics are copied as-is from Agriculture;
 * only the data (temperature instead of soil moisture) and its color
 * mapping differ.
 */
export function MapView({ latitude, longitude, temperatureValue }: MapViewProps) {
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

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markerRef.current?.remove();
    markerRef.current = null;

    if (overlayOn && temperatureValue !== undefined) {
      markerRef.current = new maplibregl.Marker({ color: colorForTemperature(temperatureValue) })
        .setLngLat([longitude, latitude])
        .addTo(map);
    }
  }, [overlayOn, temperatureValue, latitude, longitude]);

  const description =
    overlayOn && temperatureValue !== undefined
      ? `Map centered on the selected location. Temperature overlay shows ${temperatureLabel(temperatureValue)} conditions (${temperatureValue.toFixed(1)}°C) at the location marker.`
      : "Map centered on the selected location. Temperature overlay is currently hidden.";

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      {/* Same accessible-description pattern as Agriculture's MapView —
          per Experience Blueprint Section 15, a screen reader describing
          a map should convey the finding, not just "image of a map". */}
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
        Temperature
      </label>
    </div>
  );
}
