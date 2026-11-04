"use client";

import { useEffect, useRef, useState } from "react";
import { maplibregl } from "../../../../lib/maps/maplibre";
import { formatReading, moistureLabelKey } from "../../../../lib/maps/moisture";
import { useI18n } from "../../../../lib/i18n/i18n-provider";

export interface LocationMarkerData {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  /** Soil moisture value (0=dry, 1=saturated), or undefined if no
   *  reading is available for this location. */
  moistureValue?: number;
  /** The same plain-language summary the Home/Report cards show for
   *  this location, reused verbatim in the marker popup so this page
   *  never states the reading differently than they do. */
  summary: string;
}

export interface MapViewProps {
  markers: LocationMarkerData[];
}

/** Color a marker by moisture level — reuses the same band boundaries
 *  as `SoilMoistureStatusProvider`, kept in sync manually since this
 *  is a display concern, not logic worth importing a whole service
 *  for. Identical to Agriculture's and Insurance's own `MapView.tsx`
 *  — kept in sync manually there too, not extracted into a shared
 *  package, since a genuine second-but-different consumer hasn't
 *  emerged yet to justify the promotion (Engineering Blueprint 4.5). */
function colorForMoisture(value: number): string {
  if (value <= 0.2) return "#b3401f"; // very dry — critical family
  if (value <= 0.4) return "#d4652f"; // dry
  if (value <= 0.6) return "#a8a89e"; // moderate — neutral
  if (value <= 0.8) return "#3f9f7e"; // moist — accent
  return "#175a46"; // saturated
}

/** Grey — used for a location with no current moisture reading, so
 *  it's still visible on the map without implying a false reading it
 *  doesn't have. */
const NO_DATA_COLOR = "#8a8a80";

/**
 * Map view (BUILD_PLAN "STAGE — GOVERNMENT & NGOS FOLLOW-UP:
 * MULTI-MARKER MAP") — this workspace's own instance of the
 * multi-marker map Agriculture and Insurance already built.
 * Structurally identical to `agriculture/map/MapView.tsx` and
 * `insurance/map/MapView.tsx`; see those components' own doc comments
 * for the fuller rationale (base layer choice, bounds-fitting
 * behavior, scope boundaries) — repeated only briefly here to avoid
 * drifting out of sync with a copy-pasted explanation.
 *
 * Base layer: OpenStreetMap raster tiles via MapLibre GL, no API key.
 * Data overlay: one marker per visible location, colored by the same
 * soil-moisture band the Stage 4 provider classifies into (or grey if
 * that location has no current reading). The map fits its viewport to
 * every marker's bounds on load.
 */
export function MapView({ markers }: MapViewProps) {
  const { t, locale } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRefs = useRef<maplibregl.Marker[]>([]);
  const [overlayOn, setOverlayOn] = useState(true);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

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

    for (const location of markers) {
      const color =
        location.moistureValue !== undefined
          ? colorForMoisture(location.moistureValue)
          : NO_DATA_COLOR;
      const popupText =
        location.moistureValue !== undefined
          ? t("map.popupReading", {
              name: location.name,
              // The band in the reader's language, the reading in their numerals.
              label: t(moistureLabelKey(location.moistureValue)),
              value: formatReading(location.moistureValue, locale),
            })
          : t("map.popupNoReading", { name: location.name });

      const popup = new maplibregl.Popup({ offset: 24, closeButton: false }).setText(popupText);

      const marker = new maplibregl.Marker({ color })
        .setLngLat([location.longitude, location.latitude])
        .setPopup(popup)
        .addTo(map);

      marker.getElement().addEventListener("click", () => setSelectedLocationId(location.id));
      markerRefs.current.push(marker);
    }
  }, [overlayOn, markers, t, locale]);

  const selectedLocation = markers.find((l) => l.id === selectedLocationId);
  const description =
    markers.length === 0
      ? t("gov.map.descNone")
      : overlayOn
        ? t("gov.map.descOn", {
            count: markers.length,
            items: `${markers
              .map((m) =>
                m.moistureValue !== undefined
                  ? t("map.descItem", {
                      name: m.name,
                      label: t(moistureLabelKey(m.moistureValue)),
                      value: formatReading(m.moistureValue, locale),
                    })
                  : t("map.descItemNoReading", { name: m.name }),
              )
              .join(". ")}.`,
          })
        : t("gov.map.descOff", { count: markers.length });

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
        {t("gov.map.toggle", { count: markers.length })}
      </label>
      {selectedLocation && (
        <div
          style={{
            position: "absolute",
            // Above MapLibre's attribution bar (bottom-right, a physical corner): in a
            // right-to-left page this panel starts at the right and would sit on top of it.
            bottom: "2.25rem",
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
          <strong>
            <bdi>{selectedLocation.name}</bdi>
          </strong>
          <div
            // The engine's sentence is written in English; marked as such on a translated page.
            {...(locale === "en" ? {} : ({ lang: "en", dir: "ltr" } as const))}
            style={{ color: "var(--wv-text-secondary)", marginTop: "0.25rem" }}
          >
            {selectedLocation.summary}
          </div>
        </div>
      )}
    </div>
  );
}
