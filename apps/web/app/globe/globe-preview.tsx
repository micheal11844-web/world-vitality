"use client";

import { pinColor, type GlobePin } from "./globe-types";

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
 */
const COLUMNS = [0, 1, 2, 3];
// Tile rows count from the south (TMS), so draw row 1 above row 0.
const ROWS = [1, 0];

export function GlobePreview({ pins }: { pins: GlobePin[] }) {
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
      </div>
    </div>
  );
}
