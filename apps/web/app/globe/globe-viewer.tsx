"use client";

import { useEffect, useState } from "react";
import type * as ResiumTypes from "resium";
import type * as CesiumTypes from "cesium";
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
 * "God's Eye" global view (BUILD_PLAN "STAGE — GOD'S EYE GLOBE VIEW",
 * fixed by "STAGE — GLOBE VIEW PRODUCTION FIX") — a single 3D-globe
 * visualization of every real, resource-scoped location this app
 * already tracks across workspaces, inspired by the open-source "God's
 * Eye View" project (github.com/bilawalsidhu/gods-eye-view) but
 * deliberately scoped to this app's own real data rather than
 * replicating its actual feature set (flights/ships/CCTV/military are
 * off-mission for World Vitality's PRD verticals — see this stage's
 * BUILD_PLAN entry for the full reasoning).
 *
 * **Both `cesium` and `resium` are loaded via a runtime `import()`
 * inside `useEffect`, never a static top-level `import`, and this is
 * not a style preference — it's the actual fix for a real production
 * bug this app shipped with initially.** A static `import * as Cesium
 * from "cesium"` (and `resium` itself statically imports `cesium`
 * internally too, confirmed by reading its own compiled output —
 * fixing only this file's own import would not have been enough) let
 * webpack's normal bundling pipeline process Cesium's module graph,
 * which somewhere inlines a WASM/binary resource as a raw string
 * inside a JS template literal — those raw bytes happened to contain
 * byte sequences JS parses as illegal octal escape sequences,
 * producing `SyntaxError: Octal escape sequences are not allowed in
 * template strings` at runtime in the browser (never caught by this
 * sandbox's own `next build`, since that only *type-checks* and
 * *bundles* successfully — it doesn't execute the resulting JS in a
 * real browser, so a syntactically-invalid-at-runtime chunk still
 * "builds" cleanly). A real, independently-verified reference project
 * (github.com/hyundotio/nextjs-ts-cesium-example, "actually builds and
 * runs on Vercel") empirically found the same class of bug and
 * documented the same fix: defer both libraries to a runtime `import()`
 * so webpack code-splits them into an opaque async chunk rather than
 * statically analyzing/transforming their source the same way it does
 * this app's own code. `import type` (type-only, fully erased at
 * compile time — zero runtime output) is used for the TypeScript types
 * themselves, which is safe precisely because it never reaches the
 * runtime bundling path that caused the bug in the first place.
 */
export function GlobeViewer({ pins }: { pins: GlobePin[] }) {
  const [modules, setModules] = useState<{
    resium: typeof ResiumTypes;
    Cesium: typeof CesiumTypes;
    imageryProviderPromise: Promise<CesiumTypes.ImageryProvider>;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Must be set before Cesium's own asset-loading paths
    // (`buildModuleUrl`, called below once the module has loaded) are
    // touched at all.
    (window as unknown as { CESIUM_BASE_URL: string }).CESIUM_BASE_URL = "/cesium/";

    Promise.all([import("resium"), import("cesium")]).then(([resium, Cesium]) => {
      if (cancelled) return;
      // `TileMapServiceImageryProvider` is constructed via an async
      // `fromUrl` factory in this Cesium version, not a plain
      // constructor — confirmed against this installed version's own
      // type definitions rather than assumed from older examples.
      const imageryProviderPromise = Cesium.TileMapServiceImageryProvider.fromUrl(
        Cesium.buildModuleUrl("Assets/Textures/NaturalEarthII"),
      );
      setModules({ resium, Cesium, imageryProviderPromise });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!modules) {
    return null;
  }

  const { resium, Cesium, imageryProviderPromise } = modules;
  const { Viewer, Entity, ImageryLayer, PointGraphics, LabelGraphics } = resium;

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
