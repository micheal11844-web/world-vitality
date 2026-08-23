"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export interface MapViewProps {
  latitude: number;
  longitude: number;
  /** Highest-severity active alert's own NWS `severity` field, if any — not an invented band. */
  topSeverity?: string;
  alertCount: number;
}

/**
 * Color reflects the National Weather Service's OWN `severity` field
 * on the alert, unmodified — not a risk band this app invented (unlike
 * every other workspace's MapView, which does color by its own
 * threshold classification). Consistent with this whole workspace's
 * "relay, don't reinterpret" design — see `page.tsx`'s doc comment.
 */
function colorForSeverity(severity: string | undefined): string {
  switch (severity) {
    case "Extreme":
      return "#b3401f";
    case "Severe":
      return "#d4652f";
    case "Moderate":
      return "#d4a72f";
    case "Minor":
      return "#3f9f7e";
    default:
      return "#6b7280";
  }
}

/**
 * Disaster Monitoring's map view (BUILD_PLAN "STAGE — DISASTER
 * MONITORING WORKSPACE"). Same base-layer/overlay-toggle mechanics as
 * every other workspace's `MapView.tsx`. Shows a single marker at the
 * demo location, colored by the highest-severity active alert's own
 * NWS-assigned severity (or gray if none) — not a fire-perimeter or
 * flood-extent overlay, which the PRD describes but this app has no
 * data source for (see `page.tsx`'s honest-scope section).
 */
export function MapView({ latitude, longitude, topSeverity, alertCount }: MapViewProps) {
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
      zoom: 9,
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

    if (overlayOn) {
      markerRef.current = new maplibregl.Marker({ color: colorForSeverity(topSeverity) })
        .setLngLat([longitude, latitude])
        .addTo(map);
    }
  }, [overlayOn, topSeverity, longitude, latitude]);

  const description =
    alertCount > 0
      ? `Map centered on the monitored point. ${alertCount} active alert(s), highest severity "${topSeverity}" per the National Weather Service.`
      : "Map centered on the monitored point. No active alerts.";

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
        Alert severity marker
      </label>
    </div>
  );
}
