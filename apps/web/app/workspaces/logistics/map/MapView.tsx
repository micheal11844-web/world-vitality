"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export interface MapViewProps {
  latitude: number;
  longitude: number;
  /** Wind speed at 2 meters, m/s. */
  windValue?: number;
}

/**
 * Route-risk band and marker color, purely for map display — duplicates
 * `LogisticsRouteRiskProvider`'s band boundaries manually, same
 * precedent as every other workspace's MapView ("a display concern,
 * not logic worth importing a whole service for"). Kept in sync by
 * hand; if the provider's thresholds change, this needs a matching
 * edit.
 */
function bandFor(windMs: number): "clear" | "elevated" | "high" | "severe" {
  if (windMs < 8) return "clear";
  if (windMs < 14) return "elevated";
  if (windMs < 20) return "high";
  return "severe";
}

function colorForBand(band: ReturnType<typeof bandFor>): string {
  if (band === "severe") return "#b3401f";
  if (band === "high") return "#d4652f";
  if (band === "elevated") return "#d4a72f";
  return "#3f9f7e";
}

/**
 * Logistics & Shipping's map view (BUILD_PLAN "STAGE — LOGISTICS &
 * SHIPPING WORKSPACE"). Deliberately structured identically to every
 * other workspace's `MapView.tsx` — the sixth concrete run of the same
 * base-layer/overlay-toggle pattern.
 */
export function MapView({ latitude, longitude, windValue }: MapViewProps) {
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

  const band = windValue !== undefined ? bandFor(windValue) : undefined;

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markerRef.current?.remove();
    markerRef.current = null;

    if (overlayOn && band) {
      markerRef.current = new maplibregl.Marker({ color: colorForBand(band) })
        .setLngLat([longitude, latitude])
        .addTo(map);
    }
  }, [overlayOn, band, longitude, latitude]);

  const description =
    overlayOn && band
      ? `Map centered on the selected route point. Route risk overlay shows a "${band}" band at the marker.`
      : "Map centered on the selected route point. Route risk overlay is currently hidden.";

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
        Route risk band
      </label>
    </div>
  );
}
