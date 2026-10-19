"use client";

import { useEffect, useLayoutEffect } from "react";

/**
 * `useLayoutEffect` in the browser, `useEffect` on the server (where a
 * layout effect would only log a warning, since nothing is ever laid
 * out). A layout effect's state updates re-render before the browser
 * paints, which is what the app shell needs for "decide the layout, then
 * show it" — a plain effect would let one wrong frame reach the screen.
 */
export const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;
