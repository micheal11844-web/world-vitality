"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export interface PropertyMarkerData {
  id: string;
  /** The property's address — this workspace's analog of a field's
   *  name; `InsuranceProperty` has no separate short display name. */
  name: string;
  latitude: number;
  longitude: number;
  /** Soil moisture value (0=dry, 1=saturated), or undefined if no
   *  reading is available for this property. */
  moistureValue?: number;
  /** The same plain-language summary the Portfolio Overview/Report
   *  cards show for this property, reused verbatim in the marker
   *  popup so this page never states the reading differently than
   *  they do. */
  summary: string;
}

export interface MapViewProps {
  markers: PropertyMarkerData[];
}

/** Color a marker by moisture level — reuses the same band boundaries
 *  as `SoilMoistureStatusProvider`, kept in sync manually since this
 *  is a display concern, not logic worth importing a whole service
 *  for. Identical to Agriculture's own `MapView.tsx` — kept in sync
 *  manually there too, not extracted into a shared package, since a
 *  genuine second-but-different consumer hasn't emerged yet to justify
 *  the promotion (Engineering Blueprint 4.5). */
function colorForMoisture(value: number): string {
  if (value <= 0.2) return "#b3401f"; // very dry — critical family
  if (value <= 0.4) return "#d4652f"; // dry
  if (value <= 0.6) return "#a8a89e"; // moderate — neutral
  if (value <= 0.8) return "#3f9f7e"; // moist — accent
  return "#175a46"; // saturated
}

/** Grey — used for a property with no current moisture reading, so
 *  it's still visible on the map without implying a false reading it
 *  doesn't have. */
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
 * Map view (BUILD_PLAN "STAGE — INSURANCE FOLLOW-UP: MULTI-MARKER
 * MAP") — Insurance's own instance of the multi-marker map Agriculture
 * already built for Fields. Structurally identical to
 * `agriculture/map/MapView.tsx`; see that component's own doc comment
 * for the fuller rationale (base layer choice, bounds-fitting
 * behavior, scope boundaries) — repeated only briefly here to avoid
 * drifting out of sync with a copy-pasted explanation.
 *
 * Base layer: OpenStreetMap raster tiles via MapLibre GL, no API key.
 * Data overlay: one marker per visible property, colored by the same
 * soil-moisture band the Stage 4 provider classifies into (or grey if
 * that property has no current reading). The map fits its viewport to
 * every marker's bounds on load.
 */
export function MapView({ markers }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRefs = useRef<maplibregl.Marker[]>([]);
  const [overlayOn, setOverlayOn] = useState(true);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

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
      fitBoundsOptions: { padding: 48, maxZoom: 14 },
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers.length]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    for (const marker of markerRefs.current) marker.remove();
    markerRefs.current = [];

    if (!overlayOn) return;

    for (const property of markers) {
      const color =
        property.moistureValue !== undefined
          ? colorForMoisture(property.moistureValue)
          : NO_DATA_COLOR;
      const popupText =
        property.moistureValue !== undefined
          ? `${property.name}: ${moistureLabel(property.moistureValue)} (${property.moistureValue.toFixed(2)} of 1.0)`
          : `${property.name}: no current soil moisture reading`;

      const popup = new maplibregl.Popup({ offset: 24, closeButton: false }).setText(popupText);

      const marker = new maplibregl.Marker({ color })
        .setLngLat([property.longitude, property.latitude])
        .setPopup(popup)
        .addTo(map);

      marker.getElement().addEventListener("click", () => setSelectedPropertyId(property.id));
      markerRefs.current.push(marker);
    }
  }, [overlayOn, markers]);

  const selectedProperty = markers.find((p) => p.id === selectedPropertyId);
  const description =
    markers.length === 0
      ? "No properties to show on the map."
      : overlayOn
        ? `Map showing ${markers.length} propert${markers.length === 1 ? "y" : "ies"}. ${markers
            .map((p) =>
              p.moistureValue !== undefined
                ? `${p.name}: ${moistureLabel(p.moistureValue)} (${p.moistureValue.toFixed(2)} on a 0 to 1 scale)`
                : `${p.name}: no current reading`,
            )
            .join(". ")}.`
        : `Map showing ${markers.length} propert${markers.length === 1 ? "y" : "ies"}. Soil moisture overlay is currently hidden.`;

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
        Soil moisture ({markers.length} propert{markers.length === 1 ? "y" : "ies"})
      </label>
      {selectedProperty && (
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
          <strong>{selectedProperty.name}</strong>
          <div style={{ color: "var(--wv-text-secondary)", marginTop: "0.25rem" }}>
            {selectedProperty.summary}
          </div>
        </div>
      )}
    </div>
  );
}
