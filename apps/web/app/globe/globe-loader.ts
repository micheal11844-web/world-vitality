import type * as ResiumTypes from "resium";
import type * as CesiumTypes from "cesium";

export interface CesiumModules {
  resium: typeof ResiumTypes;
  Cesium: typeof CesiumTypes;
  imageryProviderPromise: Promise<CesiumTypes.ImageryProvider>;
}

let pending: Promise<CesiumModules> | null = null;

/**
 * Starts (once) and returns the download of the 3D engine.
 *
 * It is a separate module so the Globe page can call it the instant its own
 * script runs — while React is still hydrating — instead of waiting for the
 * viewer component to mount first. The engine is the biggest thing this page
 * downloads, so every millisecond it starts earlier is a millisecond off the
 * wait. Calling it again returns the same promise; a failed attempt is
 * forgotten so a later call can retry.
 *
 * Both libraries are still loaded with a runtime `import()`, never a static
 * one — see the long note in `globe-viewer.tsx` for the production crash that
 * a static import caused.
 */
export function loadCesium(): Promise<CesiumModules> {
  if (!pending) {
    // Must be set before Cesium's own asset-loading paths are touched.
    (window as unknown as { CESIUM_BASE_URL: string }).CESIUM_BASE_URL = "/cesium/";
    pending = Promise.all([import("resium"), import("cesium")]).then(([resium, Cesium]) => {
      // `TileMapServiceImageryProvider` is built by an async `fromUrl`
      // factory in this Cesium version, not a plain constructor.
      const imageryProviderPromise = Cesium.TileMapServiceImageryProvider.fromUrl(
        Cesium.buildModuleUrl("Assets/Textures/NaturalEarthII"),
      );
      return { resium, Cesium, imageryProviderPromise };
    });
    pending.catch(() => {
      pending = null;
    });
  }
  return pending;
}

/** True when this browser can create a WebGL context (the 3D globe needs one). */
export function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") || canvas.getContext("webgl")) as
      WebGLRenderingContext | WebGL2RenderingContext | null;
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}
