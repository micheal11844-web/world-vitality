import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

/**
 * The one place the maps get MapLibre from.
 *
 * Since MapLibre 6 the library's background worker is a separate file
 * (`maplibre-gl-worker.mjs`) that the library finds from its own address.
 * Inside a bundle that address is meaningless, so unless it is told where
 * the file is, the worker fails to start ("Worker failed to load"). The
 * markers and raster tiles on our maps would still draw, but anything that
 * needs the worker (vector maps, GeoJSON layers) would silently not.
 *
 * `apps/web/scripts/copy-maplibre-worker.mjs` (run by `predev` and
 * `prebuild`, like the globe's assets) puts that file under
 * `public/maplibre/`, and this module points MapLibre at it. The file is on
 * our own address, so the site's Content-Security-Policy (`worker-src
 * 'self'`) already allows it. The version in the address keeps a browser
 * from pairing a new library with an old cached worker after an upgrade.
 *
 * Every map imports `maplibregl` from here, never from "maplibre-gl"
 * directly, so the setting always happens before the first map is made.
 * (The script checks that the address below matches where it copies the
 * file, so the two cannot drift apart unnoticed.)
 */
export const MAPLIBRE_WORKER_PATH = "/maplibre/maplibre-gl-worker.mjs";

if (typeof window !== "undefined") {
  maplibregl.setWorkerUrl(`${MAPLIBRE_WORKER_PATH}?v=${maplibregl.getVersion()}`);
}

export { maplibregl };
