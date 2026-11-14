import type * as CesiumTypes from "cesium";
import {
  CAMERA_COLOR,
  FIRE_COLOR,
  FLOOD_COLOR,
  SELECTED_COLOR,
  fireMarkerSize,
  floodMarkerSize,
  type GlobeFire,
  type GlobeFlood,
  type GlobeSelection,
  type PublicCamera,
} from "./globe-types";

export interface MarkerLayer {
  /** Highlights one marker (`null` clears it). */
  setSelected(selection: Pick<GlobeSelection, "kind" | "id"> | null): void;
  /** Moves the camera closer to a marker, unless it is already near. */
  flyTo(selection: Pick<GlobeSelection, "kind" | "id">): void;
  destroy(): void;
}

const CAMERA_SIZE = 7;
/** How far from a marker (in pixels) a click still counts as hitting it. Small dots are hard to hit on a touch screen. */
const PICK_SIZE_PX = 14;
const FIRE_FLY_HEIGHT_M = 2_000_000;
/** A flood event is a point in the middle of a large area, so the view stays wider than for a fire. */
const FLOOD_FLY_HEIGHT_M = 3_000_000;
const CAMERA_FLY_HEIGHT_M = 1_200_000;

interface Entry {
  point: CesiumTypes.PointPrimitive;
  baseSize: number;
  baseColor: CesiumTypes.Color;
  latitude: number;
  longitude: number;
  height: number;
}

/**
 * Draws the fire areas, flood events and public cameras as one batch of points and turns a
 * click on one into `onSelect`. Thousands of markers are drawn this way
 * (a point collection) instead of one `Entity` each: entities carry far more
 * per-item cost and would make the globe heavy to open and to turn.
 *
 * Cameras are added first, then floods, then fires, so a fire is drawn on top
 * where they overlap. Marker ids are `fire:<id>` / `flood:<id>` / `camera:<id>`.
 */
export function addMarkerLayer(
  Cesium: typeof CesiumTypes,
  viewer: CesiumTypes.Viewer,
  {
    fires,
    floods = [],
    cameras,
    onSelect,
  }: {
    fires: readonly GlobeFire[];
    floods?: readonly GlobeFlood[];
    cameras: readonly PublicCamera[];
    onSelect: (selection: GlobeSelection) => void;
  },
): MarkerLayer {
  const points = viewer.scene.primitives.add(new Cesium.PointPrimitiveCollection());
  const entries = new Map<string, Entry>();
  const fireColor = Cesium.Color.fromCssColorString(FIRE_COLOR);
  const cameraColor = Cesium.Color.fromCssColorString(CAMERA_COLOR);
  const floodColor = Cesium.Color.fromCssColorString(FLOOD_COLOR);
  const selectedColor = Cesium.Color.fromCssColorString(SELECTED_COLOR);
  // Far away, dots shrink so thousands of them do not smear into one patch.
  const scale = new Cesium.NearFarScalar(1_500_000, 1, 15_000_000, 0.55);

  const add = (
    id: string,
    latitude: number,
    longitude: number,
    size: number,
    color: CesiumTypes.Color,
    height: number,
  ) => {
    const point = points.add({
      id,
      position: Cesium.Cartesian3.fromDegrees(longitude, latitude),
      pixelSize: size,
      color,
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 1.5,
      scaleByDistance: scale,
    });
    entries.set(id, { point, baseSize: size, baseColor: color, latitude, longitude, height });
  };

  for (const camera of cameras) {
    add(
      `camera:${camera.id}`,
      camera.latitude,
      camera.longitude,
      CAMERA_SIZE,
      cameraColor,
      CAMERA_FLY_HEIGHT_M,
    );
  }
  for (const flood of floods) {
    add(
      `flood:${flood.id}`,
      flood.latitude,
      flood.longitude,
      floodMarkerSize(flood.alert),
      floodColor,
      FLOOD_FLY_HEIGHT_M,
    );
  }
  for (const fire of fires) {
    add(
      `fire:${fire.id}`,
      fire.latitude,
      fire.longitude,
      fireMarkerSize(fire.count),
      fireColor,
      FIRE_FLY_HEIGHT_M,
    );
  }

  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction((click: { position: CesiumTypes.Cartesian2 }) => {
    // Look through everything under the click (place names, the person's own pins) for
    // the first fire or camera dot: a name drawn over a dot must not swallow the click.
    const picks = viewer.scene.drillPick(click.position, 12, PICK_SIZE_PX, PICK_SIZE_PX) as {
      id?: unknown;
    }[];
    for (const picked of picks) {
      const id = picked?.id;
      if (typeof id !== "string" || !entries.has(id)) continue;
      const separator = id.indexOf(":");
      const kind = id.slice(0, separator);
      if (kind === "fire" || kind === "flood" || kind === "camera") {
        onSelect({ kind, id: id.slice(separator + 1) });
        return;
      }
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  let selectedKey: string | null = null;
  const restore = (key: string | null) => {
    const entry = key ? entries.get(key) : undefined;
    if (!entry) return;
    entry.point.pixelSize = entry.baseSize;
    entry.point.color = entry.baseColor;
    entry.point.outlineWidth = 1.5;
  };

  return {
    setSelected(selection) {
      restore(selectedKey);
      selectedKey = selection ? `${selection.kind}:${selection.id}` : null;
      const entry = selectedKey ? entries.get(selectedKey) : undefined;
      if (entry) {
        entry.point.pixelSize = entry.baseSize + 6;
        entry.point.color = selectedColor;
        entry.point.outlineWidth = 3;
      }
      viewer.scene.requestRender();
    },
    flyTo(selection) {
      const entry = entries.get(`${selection.kind}:${selection.id}`);
      if (!entry || viewer.isDestroyed()) return;
      if (viewer.camera.positionCartographic.height <= entry.height * 1.5) return;
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(entry.longitude, entry.latitude, entry.height),
        duration: 1.2,
      });
    },
    destroy() {
      handler.destroy();
      if (!viewer.isDestroyed()) {
        viewer.scene.primitives.remove(points);
        viewer.scene.requestRender();
      }
    },
  };
}
