"use client";

import { useState } from "react";
import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect.js";

/**
 * Whether a CSS media query currently matches. Always `false` on the
 * server and on the first browser render (so both agree and hydration is
 * clean), then the real answer — before the browser paints — then live as
 * the window resizes or the phone rotates.
 *
 * Use it only for behaviour (keyboard shortcuts, focus handling); what
 * the page *looks like* at a width belongs in CSS (`shell-styles.ts`),
 * where there is no flash. Environments without `matchMedia` (jsdom) just
 * stay `false`.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useIsomorphicLayoutEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    update();
    list.addEventListener("change", update);
    return () => list.removeEventListener("change", update);
  }, [query]);

  return matches;
}
