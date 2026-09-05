// Copies CesiumJS's static runtime assets (Workers, Assets, ThirdParty,
// Widgets — ~23MB) from node_modules into public/cesium/ (BUILD_PLAN
// "STAGE — GOD'S EYE GLOBE VIEW"). Cesium loads these at *runtime* via
// plain HTTP requests to a configurable base URL (`window.CESIUM_BASE_URL`,
// set in globe-viewer.tsx) — they are not bundled by webpack/Next.js the
// way normal imports are, so they have to exist as real static files
// under `public/` for the browser to fetch.
//
// Deliberately NOT committed to git (public/cesium/ is gitignored) —
// same reasoning every other generated/build-derived directory in this
// monorepo already follows (e.g. each package's own dist/): this is a
// verbatim copy of files already tracked in cesium's own npm package,
// re-copying it into git would just be a second, driftable copy of
// something `pnpm install` already gives us reproducibly. Run via
// `predev`/`prebuild` npm lifecycle scripts (package.json) so it
// happens automatically before both `next dev` and `next build` —
// Vercel's own build runs `pnpm install` then this app's `build`
// script, so `prebuild` firing automatically is exactly what makes
// this work in production without a manual extra step to forget.
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const source = path.join(__dirname, "..", "node_modules", "cesium", "Build", "Cesium");
const dest = path.join(__dirname, "..", "public", "cesium");

if (!existsSync(source)) {
  console.error(`[copy-cesium-assets] source not found: ${source} — is "cesium" installed?`);
  process.exit(1);
}

const dirsToCopy = ["Workers", "Assets", "ThirdParty", "Widgets"];
mkdirSync(dest, { recursive: true });
for (const dir of dirsToCopy) {
  cpSync(path.join(source, dir), path.join(dest, dir), { recursive: true });
}
console.log(`[copy-cesium-assets] copied ${dirsToCopy.join(", ")} to ${dest}`);
