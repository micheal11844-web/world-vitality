"use client";

import dynamic from "next/dynamic";

/**
 * Wired back into the login page for this stage (BUILD_PLAN "STAGE —
 * GUIDE CHARACTER 3D: RAW THREE.JS, NO RECONCILER") — `GuideCharacter3D`
 * was rewritten from `@react-three/fiber` to raw `three.js`
 * (imperative `useRef`/`useEffect`, no reconciler at all) specifically
 * to eliminate the react-reconciler/pnpm React-instance crash by
 * removing the dependency that had it, rather than continuing to work
 * around it — see that component's own doc comment for the fuller
 * account of why the three prior alias-based fix attempts didn't work.
 * This wiring itself is unchanged from before (same `next/dynamic(...,
 * { ssr: false })` requirement, same subpath import) — only what's on
 * the other end of the import changed.
 *
 * Three.js touches browser globals during module import, which throws
 * during Next.js's SSR pass even for a `"use client"` component —
 * `ssr: false` is the only correct way to load it.
 *
 * Imported from the dedicated `@world-vitality/ui-components/
 * GuideCharacter3D` subpath, not the package's main barrel — see that
 * component's own doc comment and the barrel's own NOTE for why:
 * re-exporting it from the main index inflates every unrelated page's
 * bundle by pulling Three.js into Next's shared-chunk heuristic.
 */
const GuideCharacter3D = dynamic(
  () => import("@world-vitality/ui-components/GuideCharacter3D").then((m) => m.GuideCharacter3D),
  { ssr: false },
);

export function Orbi3D() {
  return <GuideCharacter3D size={88} mood="happy" wave />;
}
