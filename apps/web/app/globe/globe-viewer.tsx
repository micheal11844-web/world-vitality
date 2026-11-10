"use client";

import { useEffect, useRef, useState } from "react";
import type { CesiumComponentRef } from "resium";
import type * as CesiumTypes from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { loadCesium, type CesiumModules } from "./globe-loader";
import { addMarkerLayer, type MarkerLayer } from "./globe-markers";
import {
  pinColor,
  type GlobeFire,
  type GlobePin,
  type GlobeSelection,
  type PublicCamera,
} from "./globe-types";

/** If the opening view's pictures have not all arrived by now, show the globe anyway. */
const READY_TIMEOUT_MS = 6000;

/** Pin names are drawn only when the camera is closer than this to the pin. */
const LABEL_MAX_DISTANCE_M = 1_500_000;

/**
 * The opening view for a set of pins: their bounding box, padded by at least
 * 8° (a quarter of the spread, if larger) so a single pin is not a
 * street-level zoom. `null` when there are no pins. Pins that straddle the
 * antimeridian simply produce a wide box — acceptable for an opening view.
 */
export function framingRectangle(
  pins: Pick<GlobePin, "latitude" | "longitude">[],
): { west: number; south: number; east: number; north: number } | null {
  if (pins.length === 0) return null;
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  for (const pin of pins) {
    west = Math.min(west, pin.longitude);
    east = Math.max(east, pin.longitude);
    south = Math.min(south, pin.latitude);
    north = Math.max(north, pin.latitude);
  }
  const padLon = Math.max(8, (east - west) * 0.25);
  const padLat = Math.max(8, (north - south) * 0.25);
  return {
    west: Math.max(-180, west - padLon),
    east: Math.min(180, east + padLon),
    south: Math.max(-85, south - padLat),
    north: Math.min(85, north + padLat),
  };
}

/**
 * "God's Eye" global view (BUILD_PLAN "STAGE — GOD'S EYE GLOBE VIEW",
 * fixed by "STAGE — GLOBE VIEW PRODUCTION FIX") — a single 3D-globe
 * visualization of every real, resource-scoped location this app
 * already tracks across workspaces, inspired by the open-source "God's
 * Eye View" project (github.com/bilawalsidhu/gods-eye-view). It was
 * first scoped to this app's own data only; at the owner's request
 * (BUILD_PLAN v109, Decision #027) it also shows two safety layers
 * borrowed from that project's idea: worldwide satellite heat
 * detections and official public traffic cameras, so a person can see
 * a possible fire, look at a nearby camera, and call the fire service.
 * Flights, ships and military layers remain off-mission and are not
 * included. Those two layers are drawn as one batch of points by
 * `globe-markers.ts`, and opened in `globe-panel.tsx`.
 *
 * **Both `cesium` and `resium` are loaded via a runtime `import()`
 * (in `globe-loader.ts`, started as early as the page's own script
 * runs), never a static top-level `import`, and this is
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
export function GlobeViewer({
  pins,
  focusPins = [],
  fires = [],
  cameras = [],
  selection = null,
  onSelect,
  onReady,
  onFailed,
}: {
  pins: GlobePin[];
  /** Pins to frame in the opening view (the person's own locations). With none, the engine's default view is used. */
  focusPins?: GlobePin[];
  /** Satellite heat-detection areas, drawn as markers that can be opened. */
  fires?: GlobeFire[];
  /** Public cameras (every one to draw, including those listed under a fire), drawn as markers that can be opened. */
  cameras?: PublicCamera[];
  /** The marker the person has opened, highlighted on the globe. */
  selection?: GlobeSelection | null;
  onSelect?: (selection: GlobeSelection) => void;
  /** Called once the globe has drawn with its map pictures loaded, so the page can retire the instant preview. */
  onReady?: () => void;
  /** Called if the 3D engine could not be downloaded, so the page can keep the flat map. */
  onFailed?: () => void;
}) {
  const [modules, setModules] = useState<CesiumModules | null>(null);
  const viewerRef = useRef<CesiumComponentRef<CesiumTypes.Viewer>>(null);
  const markerLayerRef = useRef<MarkerLayer | null>(null);
  // Read through refs so a new callback or selection never rebuilds the markers.
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const selectionRef = useRef(selection);
  selectionRef.current = selection;

  useEffect(() => {
    let cancelled = false;
    // The page usually started this download already (see globe-loader.ts),
    // so this normally just picks up the same in-flight promise.
    loadCesium().then(
      (loaded) => {
        if (!cancelled) setModules(loaded);
      },
      () => {
        if (!cancelled) onFailed?.();
      },
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- callbacks are stable page handlers; re-running would only re-read the same promise
  }, []);

  // Tell the page when the globe is genuinely ready to be looked at: it has
  // drawn, its map imagery has been set up, and the map pictures for the
  // opening view have arrived. (A first frame alone can be a blank black
  // globe — the pictures load a moment after it.) The viewer's element is
  // created just after this component mounts, so wait for it briefly.
  useEffect(() => {
    if (!modules) return;
    let cancelled = false;
    let removeFrameCounter: (() => void) | undefined;
    let timer: ReturnType<typeof setInterval> | undefined;
    let tries = 0;
    const attach = () => {
      if (cancelled) return;
      const viewer = viewerRef.current?.cesiumElement;
      if (!viewer) {
        if (tries++ < 200) requestAnimationFrame(attach);
        return;
      }
      // Open on the person's own locations, set before the first frame so
      // the globe never visibly jumps. Padded so one point is not a
      // street-level zoom; skipped when there is nothing of theirs to frame.
      const framing = framingRectangle(focusPins);
      if (framing) {
        viewer.camera.setView({
          destination: modules.Cesium.Rectangle.fromDegrees(
            framing.west,
            framing.south,
            framing.east,
            framing.north,
          ),
        });
      }
      let frames = 0;
      removeFrameCounter = viewer.scene.postRender.addEventListener(() => {
        frames += 1;
      });
      const startedAt = performance.now();
      timer = setInterval(() => {
        const layer = viewer.imageryLayers.length > 0 ? viewer.imageryLayers.get(0) : undefined;
        const ready = frames > 0 && layer?.ready === true && viewer.scene.globe.tilesLoaded;
        // Never leave the flat map up forever if a picture is slow or missing.
        if (ready || performance.now() - startedAt > READY_TIMEOUT_MS) {
          clearInterval(timer);
          timer = undefined;
          if (!cancelled) onReady?.();
        } else {
          // The scene only draws when asked to (see `requestRenderMode`), so
          // keep asking until the imagery has arrived.
          viewer.scene.requestRender();
        }
      }, 120);
    };
    attach();
    return () => {
      cancelled = true;
      removeFrameCounter?.();
      if (timer) clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per loaded engine
  }, [modules]);

  // Fire areas and cameras: one batch of points, rebuilt only when the data changes.
  useEffect(() => {
    if (!modules) return;
    let cancelled = false;
    let tries = 0;
    const attach = () => {
      if (cancelled) return;
      const viewer = viewerRef.current?.cesiumElement;
      if (!viewer) {
        if (tries++ < 200) requestAnimationFrame(attach);
        return;
      }
      const layer = addMarkerLayer(modules.Cesium, viewer, {
        fires,
        cameras,
        onSelect: (picked) => onSelectRef.current?.(picked),
      });
      markerLayerRef.current = layer;
      layer.setSelected(selectionRef.current);
      viewer.scene.requestRender();
    };
    attach();
    return () => {
      cancelled = true;
      markerLayerRef.current?.destroy();
      markerLayerRef.current = null;
    };
  }, [modules, fires, cameras]);

  // Highlight the opened marker and bring the globe closer to it.
  useEffect(() => {
    const layer = markerLayerRef.current;
    layer?.setSelected(selection);
    if (selection) layer?.flyTo(selection);
  }, [selection, modules, fires, cameras]);

  if (!modules) {
    return null;
  }

  const { resium, Cesium, imageryProviderPromise } = modules;
  const { Viewer, Entity, ImageryLayer, PointGraphics, LabelGraphics } = resium;

  return (
    <Viewer
      ref={viewerRef}
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
      // The scene is static until someone moves it, so draw only when
      // something changes (camera, tiles, pins) instead of 60 times a
      // second — a real saving on phones and laptops on battery.
      requestRenderMode
      maximumRenderTimeChange={Infinity}
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
            color={Cesium.Color.fromCssColorString(pinColor(pin.workspaceKey))}
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
            // Names appear once the person has zoomed in. From far away
            // nearby pins sit on top of each other and their names would
            // pile up into an unreadable smear.
            distanceDisplayCondition={new Cesium.DistanceDisplayCondition(0, LABEL_MAX_DISTANCE_M)}
          />
        </Entity>
      ))}
    </Viewer>
  );
}
