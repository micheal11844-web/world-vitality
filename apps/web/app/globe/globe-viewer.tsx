"use client";

import { useMemo } from "react";
import { Viewer, Entity, ImageryLayer, PointGraphics, LabelGraphics } from "resium";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

export interface GlobePin {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  /** Which workspace this pin belongs to — drives pin color and the
   *  "open in workspace" link, not fetched/rendered here directly. */
  workspaceKey: string;
  workspaceLabel: string;
  href: string;
}

const WORKSPACE_PIN_COLOR: Record<string, string> = {
  agriculture: "#1d6e56", // --wv-color-accent-500, this app's core green
  insurance: "#b3401f", // --wv-color-critical-500
  "government-ngos": "#2563a8", // a distinct blue, matches the logo's globe
};

/**
 * "God's Eye" global view (BUILD_PLAN "STAGE — GOD'S EYE GLOBE VIEW")
 * — a single 3D-globe visualization of every real, resource-scoped
 * location this app already tracks across workspaces, inspired by the
 * open-source "God's Eye View" project
 * (github.com/bilawalsidhu/gods-eye-view) but deliberately scoped to
 * this app's own real data rather than replicating its actual feature
 * set (flights/ships/CCTV/military are off-mission for World
 * Vitality's PRD verticals — see this stage's BUILD_PLAN entry for the
 * full reasoning).
 *
 * **Fully keyless, zero external network requests for the globe itself
 * — a deliberate default, not a limitation glossed over.** Real
 * satellite imagery (Cesium World Imagery, Bing, Google Photorealistic
 * 3D Tiles) all require a Cesium ion account and access token, the
 * same "sign up for a token" step the reference project's own README
 * walks through as an *optional* upgrade tier. This app's own
 * established pattern (NASA POWER, Open-Meteo, USGS, FEMA/HIFLD — every
 * external data source used so far) never requires the person running
 * this app to obtain a key just to see the feature work at all, so the
 * default here is Cesium's own bundled Natural Earth II imagery
 * (`node_modules/cesium/Build/Cesium/Assets/Textures/NaturalEarthII`,
 * copied to `public/cesium/` at build time — see
 * `scripts/copy-cesium-assets.mjs`), served from this app's own origin
 * via `TileMapServiceImageryProvider`. Lower-resolution than real
 * satellite photography, genuinely visually plainer, and stated as
 * such rather than implied to be equivalent — upgrading to a real
 * imagery provider by adding a Cesium ion token is real, optional,
 * separate follow-up work for whoever runs this app, not required to
 * use this feature at all.
 *
 * No terrain provider is configured either (Cesium's default flat
 * WGS84 ellipsoid) — real elevation terrain (Cesium World Terrain) is
 * also an ion-gated asset; the ellipsoid is visually flatter but
 * functionally sufficient for plotting point locations, which is all
 * this view does.
 *
 * All of Cesium's own default UI chrome (base layer picker, timeline,
 * animation controls, geocoder, home button, scene mode picker,
 * navigation help, fullscreen button) is disabled — this app has its
 * own consistent design system, and Cesium's stock demo-app look would
 * clash with it rather than fit in.
 */
export function GlobeViewer({ pins }: { pins: GlobePin[] }) {
  // `useMemo`, not `useState`/`useEffect` — computed once, synchronously,
  // in the render body rather than after a mount effect. Safe to touch
  // `window` here specifically because this whole component is
  // dynamically imported with `ssr: false` by its page (see
  // `globe-shell.tsx`), so by the time this function body ever runs we
  // are already guaranteed to be client-side.
  const imageryProviderPromise = useMemo(() => {
    // Must be set before Cesium's own asset-loading paths
    // (`buildModuleUrl` below) are touched at all.
    (window as unknown as { CESIUM_BASE_URL: string }).CESIUM_BASE_URL = "/cesium/";
    // `TileMapServiceImageryProvider` is constructed via an async
    // `fromUrl` factory in this Cesium version, not a plain
    // constructor — confirmed against this installed version's own
    // type definitions (`node_modules/cesium/Source/Cesium.d.ts`)
    // rather than assumed from older Cesium tutorials/examples, which
    // commonly still show the old synchronous-constructor pattern.
    // `ImageryLayer`'s own `imageryProvider` prop accepts this promise
    // directly (confirmed against resium's own type definitions too),
    // so no manual promise-resolution state is needed here at all.
    return Cesium.TileMapServiceImageryProvider.fromUrl(
      Cesium.buildModuleUrl("Assets/Textures/NaturalEarthII"),
    );
  }, []);

  return (
    <Viewer
      full
      baseLayer={false}
      baseLayerPicker={false}
      timeline={false}
      animation={false}
      geocoder={false}
      homeButton={false}
      sceneModePicker={false}
      navigationHelpButton={false}
      fullscreenButton={false}
      selectionIndicator={true}
      infoBox={false}
    >
      <ImageryLayer imageryProvider={imageryProviderPromise} />
      {pins.map((pin) => (
        <Entity
          key={pin.id}
          name={pin.label}
          position={Cesium.Cartesian3.fromDegrees(pin.longitude, pin.latitude)}
          onClick={() => {
            window.location.href = pin.href;
          }}
        >
          <PointGraphics
            pixelSize={10}
            color={Cesium.Color.fromCssColorString(
              WORKSPACE_PIN_COLOR[pin.workspaceKey] ?? "#666666",
            )}
            outlineColor={Cesium.Color.WHITE}
            outlineWidth={2}
          />
          <LabelGraphics
            text={pin.label}
            font="13px sans-serif"
            fillColor={Cesium.Color.WHITE}
            outlineColor={Cesium.Color.BLACK}
            outlineWidth={3}
            style={Cesium.LabelStyle.FILL_AND_OUTLINE}
            verticalOrigin={Cesium.VerticalOrigin.TOP}
            pixelOffset={new Cesium.Cartesian2(0, 14)}
          />
        </Entity>
      ))}
    </Viewer>
  );
}
