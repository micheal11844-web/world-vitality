"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export interface MapViewProps {
  latitude: number;
  longitude: number;
  /** Soil moisture value (0=dry, 1=saturated), for the one data overlay. */
  moistureValue?: number;
}

/** Same band boundaries as every other workspace's MapView, kept in
 *  sync manually — a display concern, not logic worth importing a
 *  whole service for. */
function colorForMoisture(value: number): string {
  if (value <= 0.2) return "#b3401f";
  if (value <= 0.4) return "#d4652f";
  if (value <= 0.6) return "#a8a89e";
  if (value <= 0.8) return "#3f9f7e";
  return "#175a46";
}

/**
 * Insurance's map view (BUILD_PLAN "STAGE — INSURANCE WORKSPACE").
 * Same "base layers + one data overlay" pattern as every other
 * workspace's MapView — single demo insured-location point, colored by
 * soil moisture band. No real hazard-layer or historical-event overlay
 * (this app has neither) — see `page.tsx`'s honest-scope notes.
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
      zoom: 8,
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
  }, [overlayOn, moistureValue, longitude, latitude]);

  const description =
    overlayOn && moistureValue !== undefined
      ? `Map centered on the demo insured location. Soil moisture overlay shows a value of ${moistureValue.toFixed(2)} at the marker.`
      : "Map centered on the demo insured location. Data overlay is currently hidden.";

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
        Soil moisture overlay
      </label>
    </div>
  );
}
