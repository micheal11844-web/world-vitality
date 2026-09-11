"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export type HazardKind = "flood" | "shelter" | "fire";

export interface HazardMarker {
  id: string;
  kind: HazardKind;
  name: string;
  latitude: number;
  longitude: number;
  summary: string;
}

export interface MapViewProps {
  markers: HazardMarker[];
}

/** Distinct color per hazard type — deliberately not the soil-moisture
 *  band palette Agriculture/Insurance/Government & NGoS's maps use,
 *  since these are three unrelated categories, not one metric's
 *  severity gradient. Blue reads as water, green as safety/shelter,
 *  orange-red as fire/heat — a conventional mapping, not this app's
 *  own invention. */
const KIND_COLOR: Record<HazardKind, string> = {
  flood: "#2f6fa8",
  shelter: "#3f9f7e",
  fire: "#c2410c",
};

const KIND_LABEL: Record<HazardKind, string> = {
  flood: "Flood impact location",
  shelter: "Designated shelter",
  fire: "Fire detection",
};

const KIND_LABEL_PLURAL: Record<HazardKind, string> = {
  flood: "flood impact locations",
  shelter: "designated shelters",
  fire: "fire detections",
};

/**
 * Map view (BUILD_PLAN "STAGE — DISASTER MONITORING FOLLOW-UP:
 * MULTI-MARKER MAP") — this workspace's own instance of the
 * multi-marker map follow-up, using three real hazard-data layers
 * instead of a portfolio of user-created resources. See `page.tsx`'s
 * doc comment for the fuller rationale (why Active Alerts are
 * excluded, why each layer fetches independently).
 *
 * Base layer: OpenStreetMap raster tiles via MapLibre GL, no API key
 * — same choice every other workspace's map already made.
 *
 * Data overlay: three independently toggleable layers (flood/shelter/
 * fire), each with its own color and its own checkbox — genuinely
 * different from the single on/off toggle Agriculture's/Insurance's/
 * Government & NGoS's maps use, since those have one metric while this
 * page has three unrelated categories a person may want to see
 * independently (e.g. shelters without fires). The map fits its
 * viewport to every visible marker's bounds on load.
 */
export function MapView({ markers }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRefs = useRef<maplibregl.Marker[]>([]);
  const [visibleKinds, setVisibleKinds] = useState<Record<HazardKind, boolean>>({
    flood: true,
    shelter: true,
    fire: true,
  });
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || markers.length === 0) return;

    const bounds = new maplibregl.LngLatBounds();
    for (const marker of markers) {
      bounds.extend([marker.longitude, marker.latitude]);
    }

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
      fitBoundsOptions: { padding: 48, maxZoom: 12 },
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // Bounds are fit once, over every marker regardless of initial
    // toggle state, so re-fitting never happens on a toggle click —
    // same reasoning as the other workspaces' maps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers.length]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    for (const marker of markerRefs.current) marker.remove();
    markerRefs.current = [];

    for (const hazard of markers) {
      if (!visibleKinds[hazard.kind]) continue;

      const popup = new maplibregl.Popup({ offset: 24, closeButton: false }).setText(
        `${hazard.name} — ${KIND_LABEL[hazard.kind]}`,
      );

      const marker = new maplibregl.Marker({ color: KIND_COLOR[hazard.kind] })
        .setLngLat([hazard.longitude, hazard.latitude])
        .setPopup(popup)
        .addTo(map);

      marker.getElement().addEventListener("click", () => setSelectedMarkerId(hazard.id));
      markerRefs.current.push(marker);
    }
  }, [visibleKinds, markers]);

  const selectedMarker = markers.find((m) => m.id === selectedMarkerId);
  const visibleMarkers = markers.filter((m) => visibleKinds[m.kind]);
  const counts: Record<HazardKind, number> = { flood: 0, shelter: 0, fire: 0 };
  for (const m of markers) counts[m.kind]++;

  const description =
    markers.length === 0
      ? "No flood, shelter, or fire data to show on the map."
      : visibleMarkers.length === 0
        ? "All hazard layers are currently hidden."
        : `Map showing ${visibleMarkers.length} location${visibleMarkers.length === 1 ? "" : "s"}: ${(
            ["flood", "shelter", "fire"] as const
          )
            .filter((k) => visibleKinds[k] && counts[k] > 0)
            .map((k) => `${counts[k]} ${KIND_LABEL_PLURAL[k]}`)
            .join(", ")}.`;

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
      <div
        style={{
          position: "absolute",
          top: "var(--wv-space-sm)",
          left: "var(--wv-space-sm)",
          backgroundColor: "var(--wv-surface)",
          borderRadius: "var(--wv-radius-sm)",
          padding: "var(--wv-space-xs) var(--wv-space-sm)",
          display: "flex",
          flexDirection: "column",
          gap: "0.25rem",
          fontFamily: "var(--wv-font-sans)",
          fontSize: "0.8125rem",
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
        }}
      >
        {(["flood", "shelter", "fire"] as const).map((kind) => (
          <label
            key={kind}
            style={{ display: "flex", alignItems: "center", gap: "var(--wv-space-xs)" }}
          >
            <input
              type="checkbox"
              checked={visibleKinds[kind]}
              onChange={(e) => setVisibleKinds((prev) => ({ ...prev, [kind]: e.target.checked }))}
            />
            <span
              aria-hidden="true"
              style={{
                display: "inline-block",
                width: "0.65rem",
                height: "0.65rem",
                borderRadius: "50%",
                backgroundColor: KIND_COLOR[kind],
              }}
            />
            {KIND_LABEL[kind]}s ({counts[kind]})
          </label>
        ))}
      </div>
      {selectedMarker && (
        <div
          style={{
            position: "absolute",
            bottom: "var(--wv-space-sm)",
            left: "var(--wv-space-sm)",
            right: "var(--wv-space-sm)",
            backgroundColor: "var(--wv-surface)",
            borderRadius: "var(--wv-radius-sm)",
            padding: "var(--wv-space-sm)",
            fontFamily: "var(--wv-font-sans)",
            fontSize: "0.875rem",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
            maxWidth: "24rem",
          }}
        >
          <strong>{selectedMarker.name}</strong>
          <div style={{ color: "var(--wv-text-secondary)", marginTop: "0.25rem" }}>
            {selectedMarker.summary}
          </div>
        </div>
      )}
    </div>
  );
}
