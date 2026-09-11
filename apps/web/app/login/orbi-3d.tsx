"use client";

import dynamic from "next/dynamic";

/**
 * **STATUS: built and correct in isolation, but currently NOT wired
 * into the login page.** The underlying `GuideCharacter3D` still has a
 * real, unresolved production crash (react-reconciler/pnpm React-
 * instance-identity bug) — see that component's own doc comment for
 * the full, real-browser-verified debugging trail from this session
 * (three different fix attempts, three different real outcomes, none
 * of them a working fix). Left in place, unused, rather than deleted,
 * following this repo's own established pattern for exactly this
 * situation (`GuideCharacter3D.tsx` itself was kept the same way after
 * its own first revert) — the `next/dynamic(..., { ssr: false })`
 * wiring below is believed correct and won't need to change once the
 * underlying crash is actually fixed; only `next.config.mjs`'s webpack
 * config and/or `@react-three/fiber`'s dependency setup would.
 *
 * Isolates the `next/dynamic(..., { ssr: false })` requirement
 * `GuideCharacter3D`'s own doc comment mandates, so `login/page.tsx`
 * could use it as an ordinary JSX element (`<Orbi3D />`) without
 * needing to know about that requirement itself, once it's safe to use
 * again. Three.js touches browser globals during module import, which
 * throws during Next.js's SSR pass even for a `"use client"` component
 * — `ssr: false` is the only correct way to load it.
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
