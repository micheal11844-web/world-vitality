// Puts MapLibre GL's background-worker file where the browser can fetch it
// (apps/web/public/maplibre/). Since MapLibre 6 the worker is its own file,
// `maplibre-gl-worker.mjs`, which has to be served from the site itself;
// lib/maps/maplibre.ts tells the library the address. Same approach, and the
// same reasons, as copy-cesium-assets.mjs: a verbatim copy of a file
// `pnpm install` already provides, so it is generated before `next dev` and
// `next build` (predev / prebuild) and not committed (see .gitignore).
//
// It also fails the build, loudly, if the address lib/maps/maplibre.ts uses
// is not the one this copies to. Otherwise the maps would still look fine
// (markers and raster tiles do not need the worker) while the worker
// quietly failed to load in production.
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(here, "..");
const FILE = "maplibre-gl-worker.mjs";
const source = path.join(webRoot, "node_modules", "maplibre-gl", "dist", FILE);
const destDir = path.join(webRoot, "public", "maplibre");
const publicPath = `/maplibre/${FILE}`;

if (!existsSync(source)) {
  console.error(
    `[copy-maplibre-worker] source not found: ${source} — is "maplibre-gl" (version 6 or later) installed?`,
  );
  process.exit(1);
}

const wiring = readFileSync(path.join(webRoot, "lib", "maps", "maplibre.ts"), "utf8");
if (!wiring.includes(`"${publicPath}"`)) {
  console.error(
    `[copy-maplibre-worker] lib/maps/maplibre.ts does not point at ${publicPath}; ` +
      "it and this script must agree on where the worker is served from.",
  );
  process.exit(1);
}

mkdirSync(destDir, { recursive: true });
copyFileSync(source, path.join(destDir, FILE));
console.log(`[copy-maplibre-worker] copied ${FILE} to ${destDir}`);
