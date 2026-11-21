"use client";

import { useEffect, useState, type RefObject } from "react";

/** Things a keyboard can Tab to. */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

/** Out of the tab order because it is not drawn (browsers without `checkVisibility` say yes). */
function reachable(el: Element): boolean {
  if (el.closest("[hidden], [inert]")) return false;
  const check = (
    el as Element & { checkVisibility?: (o?: { visibilityProperty?: boolean }) => boolean }
  ).checkVisibility;
  return typeof check === "function" ? check.call(el, { visibilityProperty: true }) : true;
}

/** True when the element scrolls and nothing inside it can take keyboard focus. */
export function needsKeyboardStop(el: HTMLElement): boolean {
  const scrolls = el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1;
  if (!scrolls) return false;
  return !Array.from(el.querySelectorAll(FOCUSABLE)).some(reachable);
}

/**
 * The `tabIndex` a scrolling region needs, if any.
 *
 * The app shell's `<main>` is the one scroll region of a page (the document itself never
 * scrolls). A mouse or a touch screen scrolls it fine, but a person using only the keyboard
 * scrolls with the arrow keys, Page Up/Down and Space — and those scroll whatever is focused.
 * When the page has a link, button or field in it, Tab reaches it and the keys work from there.
 * When it is only text (an empty state, a long explanation), there is nothing to focus, and some
 * browsers do not make a scroller focusable by themselves (WCAG 2.1.1, axe's
 * `scrollable-region-focusable`). Then, and only then, this returns `0`, which makes the region
 * one Tab stop with a visible focus ring; otherwise `undefined`, so a page that already works
 * gains no extra stop.
 *
 * It re-checks when the region is resized, when its contents change and when the window is
 * resized, since a page can start short and grow, or lose its only link.
 */
export function useKeyboardScrollable(ref: RefObject<HTMLElement | null>): 0 | undefined {
  const [needsStop, setNeedsStop] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = () => {
      timer = undefined;
      setNeedsStop(needsKeyboardStop(el));
    };
    // Many changes arrive together (a page rendering); look once, shortly after.
    const schedule = () => {
      if (timer === undefined) timer = setTimeout(check, 50);
    };
    check();

    const observers: Array<{ disconnect(): void }> = [];
    // Through `window`, which is where a browser keeps them (and where a test DOM does).
    if (typeof window.MutationObserver !== "undefined") {
      const mo = new window.MutationObserver(schedule);
      mo.observe(el, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["hidden", "disabled", "href", "tabindex", "style", "class"],
      });
      observers.push(mo);
    }
    if (typeof window.ResizeObserver !== "undefined") {
      const ro = new window.ResizeObserver(schedule);
      ro.observe(el);
      for (const child of Array.from(el.children)) ro.observe(child);
      observers.push(ro);
    }
    window.addEventListener("resize", schedule);
    return () => {
      if (timer !== undefined) clearTimeout(timer);
      window.removeEventListener("resize", schedule);
      for (const o of observers) o.disconnect();
    };
  }, [ref]);

  return needsStop ? 0 : undefined;
}
