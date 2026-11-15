"use client";

import { createContext, useContext } from "react";

/**
 * Makes the Guide Character in the shell's corner a button.
 *
 * A screen (or the app around it) provides one of these and every
 * `AppShell` below it turns Orbi into a button with a small pill under it
 * (`label`), without each of the ~13 shells needing to opt in — the same
 * reasoning that put the character in the shell rather than in each page.
 * Without a provider Orbi stays what it was: a decoration that ignores the
 * pointer.
 */
export interface GuideDockValue {
  /** The pill's text. */
  label: string;
  /** The button's accessible name when it should say more than the pill ("Open the help chat"); defaults to `label`. */
  ariaLabel?: string;
  /** Whether the thing it opens is open now (drives `aria-expanded`). */
  open: boolean;
  onActivate: () => void;
}

const GuideDockContext = createContext<GuideDockValue | null>(null);

export const GuideDockProvider = GuideDockContext.Provider;

export function useGuideDock(): GuideDockValue | null {
  return useContext(GuideDockContext);
}
