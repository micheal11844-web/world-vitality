import type * as CesiumTypes from "cesium";
import {
  CITY_PLACES,
  CITY_VISIBLE_M,
  COUNTRY_PLACES,
  COUNTRY_VISIBLE_M,
  countryName,
} from "@world-vitality/hazard-feeds";

export interface PlaceLayer {
  destroy(): void;
}

const LABEL_FONT_FAMILY = "system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans', sans-serif";
const COUNTRY_FONT = `700 14px ${LABEL_FONT_FAMILY}`;
const CITY_FONT = `600 12px ${LABEL_FONT_FAMILY}`;
/** Dark edge so a name stays readable over both the green land and the blue sea of the base map. */
const OUTLINE_COLOR = "#0b1220";
const COUNTRY_COLOR = "#ffffff";
const CITY_COLOR = "#fff7d6";
const CITY_DOT_PX = 4;

/**
 * Draws country and city names on the 3D globe (the base map is pictures only, with
 * no text of its own).
 *
 * Names are drawn as one batch of labels and points, not as one `Entity` each, for
 * the same reason the fire and camera dots are: hundreds of entities would make the
 * globe heavy to open and to turn. Labels and points are also not selectable, so no
 * selection box appears around a name when it is clicked.
 *
 * What is shown depends on distance (see `COUNTRY_VISIBLE_M` / `CITY_VISIBLE_M`):
 * the whole-Earth view carries only the biggest country names, and city names arrive
 * in steps as the person comes closer. Country names are the browser's own names in
 * the person's language; city names are English. Names on the far side of the Earth
 * are hidden by the globe itself.
 *
 * The names sit under the fire and camera dots where they overlap: clicks are
 * resolved by `globe-markers.ts`, which looks through a name to the dot below it.
 */
export function addPlaceLayer(
  Cesium: typeof CesiumTypes,
  viewer: CesiumTypes.Viewer,
  { locale }: { locale: string },
): PlaceLayer {
  const labels = viewer.scene.primitives.add(new Cesium.LabelCollection({ scene: viewer.scene }));
  const dots = viewer.scene.primitives.add(new Cesium.PointPrimitiveCollection());
  const outline = Cesium.Color.fromCssColorString(OUTLINE_COLOR);
  const countryColor = Cesium.Color.fromCssColorString(COUNTRY_COLOR);
  const cityColor = Cesium.Color.fromCssColorString(CITY_COLOR);
  // Far away, names shrink a little so the whole-Earth view is not crowded.
  const scale = new Cesium.NearFarScalar(1_000_000, 1, 25_000_000, 0.8);

  for (const [code, longitude, latitude, tier] of COUNTRY_PLACES) {
    const text = countryName(code, locale);
    if (!text) continue;
    const range = COUNTRY_VISIBLE_M[tier];
    labels.add({
      position: Cesium.Cartesian3.fromDegrees(longitude, latitude),
      text,
      font: COUNTRY_FONT,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      fillColor: countryColor,
      outlineColor: outline,
      outlineWidth: 3,
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      verticalOrigin: Cesium.VerticalOrigin.CENTER,
      scaleByDistance: scale,
      distanceDisplayCondition: new Cesium.DistanceDisplayCondition(range.near, range.far),
    });
  }

  for (const [name, longitude, latitude, tier] of CITY_PLACES) {
    const range = CITY_VISIBLE_M[tier];
    const position = Cesium.Cartesian3.fromDegrees(longitude, latitude);
    const distanceDisplayCondition = new Cesium.DistanceDisplayCondition(range.near, range.far);
    dots.add({
      position,
      pixelSize: CITY_DOT_PX,
      color: cityColor,
      outlineColor: outline,
      outlineWidth: 1,
      scaleByDistance: scale,
      distanceDisplayCondition,
    });
    labels.add({
      position,
      text: name,
      font: CITY_FONT,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      fillColor: cityColor,
      outlineColor: outline,
      outlineWidth: 3,
      horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
      verticalOrigin: Cesium.VerticalOrigin.CENTER,
      pixelOffset: new Cesium.Cartesian2(CITY_DOT_PX + 3, 0),
      scaleByDistance: scale,
      distanceDisplayCondition,
    });
  }

  viewer.scene.requestRender();

  return {
    destroy() {
      if (viewer.isDestroyed()) return;
      viewer.scene.primitives.remove(labels);
      viewer.scene.primitives.remove(dots);
      viewer.scene.requestRender();
    },
  };
}
