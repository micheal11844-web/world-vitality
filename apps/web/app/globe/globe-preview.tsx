"use client";

import { useI18n } from "../../lib/i18n/i18n-provider";
import {
  CAMERA_COLOR,
  FIRE_COLOR,
  SELECTED_COLOR,
  fireMarkerSize,
  pinColor,
  type GlobeFire,
  type GlobePin,
  type GlobeSelection,
  type PublicCamera,
} from "./globe-types";

/**
 * The Globe's instant first view: a flat world map with every pin on it,
 * ready the moment the page's own script runs. The 3D globe is a large
 * download, and for the first seconds it is not there yet; this keeps the
 * area useful in the meantime (pins can already be opened) and stays as the
 * fallback on devices that cannot run WebGL at all.
 *
 * The picture is made of the bundled low-resolution Natural Earth tiles the
 * 3D globe uses itself (zoom level 1: 4 × 2 tiles of 256 px), so there is
 * nothing extra to ship and the browser already has them cached by the time
 * the globe asks for the same tiles. The map is an equirectangular
 * projection: a pin sits at `(longitude + 180) / 360` across and
 * `(90 − latitude) / 180` down. It is drawn at a 2:1 shape that always fits
 * inside the available space.
 *
 * Satellite heat-detection areas and public cameras are drawn as real
 * buttons here, so a keyboard or screen-reader user (and anyone on a device
 * without WebGL) can open the same details panel the 3D globe opens. The
 * caller passes a limited set (the strongest fires and the cameras worth
 * looking at), because a thousand buttons would not be a usable page.
 */
const COLUMNS = [0, 1, 2, 3];
// Tile rows count from the south (TMS), so draw row 1 above row 0.
const ROWS = [1, 0];

export function GlobePreview({
  pins,
  fires = [],
  cameras = [],
  selection = null,
  onSelect,
}: {
  pins: GlobePin[];
  fires?: GlobeFire[];
  cameras?: PublicCamera[];
  selection?: GlobeSelection | null;
  onSelect?: (selection: GlobeSelection) => void;
}) {
  const { t } = useI18n();
  const isSelected = (kind: GlobeSelection["kind"], id: string) =>
    selection?.kind === kind && selection.id === id;
  const marker = (
    kind: GlobeSelection["kind"],
    id: string,
    latitude: number,
    longitude: number,
    size: number,
    color: string,
    label: string,
  ) => {
    const selected = isSelected(kind, id);
    const px = selected ? size + 6 : size;
    return (
      <button
        key={`${kind}:${id}`}
        type="button"
        title={label}
        aria-label={label}
        aria-pressed={selected}
        onClick={() => onSelect?.({ kind, id })}
        style={{
          position: "absolute",
          left: `${((longitude + 180) / 360) * 100}%`,
          top: `${((90 - latitude) / 180) * 100}%`,
          width: px,
          height: px,
          marginLeft: -px / 2,
          marginTop: -px / 2,
          padding: 0,
          cursor: "pointer",
          borderRadius: "50%",
          background: selected ? SELECTED_COLOR : color,
          border: `${selected ? 3 : 1.5}px solid #fff`,
          boxSizing: "border-box",
          zIndex: selected ? 2 : 1,
        }}
      />
    );
  };
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#050b16",
        containerType: "size",
      }}
    >
      <div
        data-testid="globe-preview-map"
        style={{
          position: "relative",
          // A map never mirrors: west stays on the left in right-to-left
          // languages too.
          direction: "ltr",
          // A 2:1 box that always fits inside the container (container
          // query units: Chrome 105+, Safari 16+, Firefox 110+).
          width: "min(100cqw, 200cqh)",
          height: "min(50cqw, 100cqh)",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gridTemplateRows: "repeat(2, 1fr)",
        }}
      >
        {ROWS.flatMap((y) =>
          COLUMNS.map((x) => (
            // eslint-disable-next-line @next/next/no-img-element -- bundled static map tiles, sized by the grid; next/image adds nothing here
            <img
              key={`${x}-${y}`}
              src={`/cesium/Assets/Textures/NaturalEarthII/1/${x}/${y}.jpg`}
              alt=""
              draggable={false}
              style={{ width: "100%", height: "100%", display: "block", objectFit: "fill" }}
            />
          )),
        )}
        {pins.map((pin) => (
          <a
            key={pin.id}
            href={pin.href}
            title={`${pin.label} — ${pin.workspaceLabel}`}
            aria-label={`${pin.label} — ${pin.workspaceLabel}`}
            style={{
              position: "absolute",
              left: `${((pin.longitude + 180) / 360) * 100}%`,
              top: `${((90 - pin.latitude) / 180) * 100}%`,
              width: 14,
              height: 14,
              marginLeft: -7,
              marginTop: -7,
              borderRadius: "50%",
              background: pinColor(pin.workspaceKey),
              border: "2px solid #fff",
              boxSizing: "border-box",
            }}
          />
        ))}
        {cameras.map((camera) =>
          marker(
            "camera",
            camera.id,
            camera.latitude,
            camera.longitude,
            9,
            CAMERA_COLOR,
            t("globe.marker.camera", { name: camera.name }),
          ),
        )}
        {fires.map((fire) =>
          marker(
            "fire",
            fire.id,
            fire.latitude,
            fire.longitude,
            fireMarkerSize(fire.count),
            FIRE_COLOR,
            t("globe.marker.fire", {
              latitude: fire.latitude.toFixed(2),
              longitude: fire.longitude.toFixed(2),
            }),
          ),
        )}
      </div>
    </div>
  );
}
