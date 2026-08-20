"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export interface MapViewProps {
  latitude: number;
  longitude: number;
  temperatureValue?: number;
  windValue?: number;
}

/**
 * Research's map view (BUILD_PLAN Stage 14). Deliberately does NOT
 * color-code the marker by any band or threshold, unlike every other
 * workspace's MapView — there is no "risk" concept in this workspace's
 * design, only raw readings. The marker's popup shows the numeric
 * values directly, matching the PRD's "minimally interpreted" framing
 * (see the page component's doc comment). Same base-layer/overlay-
 * toggle mechanics as every other workspace's MapView otherwise.
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

  const hasData = temperatureValue !== undefined || windValue !== undefined;
  const popupText = [
    temperatureValue !== undefined ? `${temperatureValue.toFixed(1)}°C` : undefined,
    windValue !== undefined ? `${windValue.toFixed(1)} m/s wind` : undefined,
  ]
    .filter((v): v is string => Boolean(v))
    .join(", ");

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markerRef.current?.remove();
    markerRef.current = null;

    if (overlayOn && hasData) {
      // Neutral gray — not a risk color, per this component's doc
      // comment. Deliberately the one marker color in this app that
      // isn't drawn from a status/threshold palette.
      markerRef.current = new maplibregl.Marker({ color: "#6b7280" })
        .setLngLat([longitude, latitude])
        .setPopup(new maplibregl.Popup({ closeButton: false }).setText(popupText))
        .addTo(map);
    }
  }, [overlayOn, hasData, popupText, longitude, latitude]);

  const description =
    overlayOn && hasData
      ? `Map centered on the selected location. Raw-data overlay shows the current reading (${popupText}) at the marker, without interpretation.`
      : "Map centered on the selected location. Raw-data overlay is currently hidden.";

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
        Raw data
      </label>
    </div>
  );
}
