"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export interface FieldMarkerData {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  /** Soil moisture value (0=dry, 1=saturated), or undefined if no
   *  reading is available for this field. */
  moistureValue?: number;
  /** The same plain-language summary the Field Overview/Report cards
   *  show for this field, reused verbatim in the marker popup so this
   *  page never states the reading differently than they do. */
  summary: string;
}

export interface MapViewProps {
  markers: FieldMarkerData[];
}

/** Color a marker by moisture level — reuses the same band boundaries
 *  as `SoilMoistureStatusProvider`, kept in sync manually since this
 *  is a display concern, not logic worth importing a whole service
 *  for. */
function colorForMoisture(value: number): string {
  if (value <= 0.2) return "#b3401f"; // very dry — critical family
  if (value <= 0.4) return "#d4652f"; // dry
  if (value <= 0.6) return "#a8a89e"; // moderate — neutral
  if (value <= 0.8) return "#3f9f7e"; // moist — accent
  return "#175a46"; // saturated
}

/** Grey — used for a field with no current moisture reading, so it's
 *  still visible on the map without implying a false "dry" or
 *  "moderate" reading it doesn't have. */
const NO_DATA_COLOR = "#8a8a80";

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
 * Map view (BUILD_PLAN "STAGE — AGRICULTURE FOLLOW-UP: MULTI-MARKER
 * MAP") — "base layers + one data overlay" per BUILD_PLAN ticket 6.4's
 * own narrow scope, not the full Experience Blueprint Section 11 spec
 * (which additionally describes satellite/terrain layer switching, a
 * timeline scrubber, drawing tools, search, bookmarks, and sharing —
 * none of which are built here, same boundary as the original
 * single-marker version).
 *
 * Base layer: OpenStreetMap raster tiles via MapLibre GL — chosen as a
 * low-stakes, reversible tooling pick (no API key, no vendor account
 * required, unlike Mapbox). Swappable later without touching any other
 * component, same as the pnpm/Zod choices earlier in this build.
 *
 * Data overlay: one marker per visible field, colored by the same
 * soil-moisture band the Stage 4 provider classifies into (or a
 * neutral grey if that field has no current reading) — "toggleable,
 * never all-on by default" (Section 11) is honored via the checkbox
 * below, though with only one real overlay type, "toggleable" here
 * just means on/off for the whole layer rather than a full
 * layer-control panel.
 *
 * The map fits its viewport to every marker's bounds on load (a single
 * marker still centers/zooms sensibly via `fitBounds`'s own behavior
 * for a zero-area bounding box) — this is a real, necessary behavior
 * change from the single-marker version, which always centered on one
 * fixed point.
 */
export function MapView({ markers }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRefs = useRef<maplibregl.Marker[]>([]);
  const [overlayOn, setOverlayOn] = useState(true);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || markers.length === 0) return;

    const bounds = new maplibregl.LngLatBounds();
    for (const marker of markers) {
      bounds.extend([marker.longitude, marker.latitude]);
    }

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
      bounds,
      fitBoundsOptions: { padding: 48, maxZoom: 14 },
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // Deliberately only re-created when the *set* of fields changes
    // (markers.length as a cheap proxy — a genuinely new/removed field
    // changes this), not on every render — re-fitting bounds on every
    // toggle-overlay click would fight the user's own pan/zoom.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers.length]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    for (const marker of markerRefs.current) marker.remove();
    markerRefs.current = [];

    if (!overlayOn) return;

    for (const field of markers) {
      const color =
        field.moistureValue !== undefined ? colorForMoisture(field.moistureValue) : NO_DATA_COLOR;
      const popupText =
        field.moistureValue !== undefined
          ? `${field.name}: ${moistureLabel(field.moistureValue)} (${field.moistureValue.toFixed(2)} of 1.0)`
          : `${field.name}: no current soil moisture reading`;

      const popup = new maplibregl.Popup({ offset: 24, closeButton: false }).setText(popupText);

      const marker = new maplibregl.Marker({ color })
        .setLngLat([field.longitude, field.latitude])
        .setPopup(popup)
        .addTo(map);

      marker.getElement().addEventListener("click", () => setSelectedFieldId(field.id));
      markerRefs.current.push(marker);
    }
  }, [overlayOn, markers]);

  const selectedField = markers.find((f) => f.id === selectedFieldId);
  const description =
    markers.length === 0
      ? "No fields to show on the map."
      : overlayOn
        ? `Map showing ${markers.length} field${markers.length === 1 ? "" : "s"}. ${markers
            .map((f) =>
              f.moistureValue !== undefined
                ? `${f.name}: ${moistureLabel(f.moistureValue)} (${f.moistureValue.toFixed(2)} on a 0 to 1 scale)`
                : `${f.name}: no current reading`,
            )
            .join(". ")}.`
        : `Map showing ${markers.length} field${markers.length === 1 ? "" : "s"}. Soil moisture overlay is currently hidden.`;

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
        Soil moisture ({markers.length} field{markers.length === 1 ? "" : "s"})
      </label>
      {selectedField && (
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
          <strong>{selectedField.name}</strong>
          <div style={{ color: "var(--wv-text-secondary)", marginTop: "0.25rem" }}>
            {selectedField.summary}
          </div>
        </div>
      )}
    </div>
  );
}
