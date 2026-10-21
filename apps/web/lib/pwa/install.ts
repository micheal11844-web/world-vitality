"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Installing the app (adding it to a phone's home screen or a desktop).
 *
 * Chromium browsers announce that the site can be installed with a
 * `beforeinstallprompt` event, early in page load and only once. The
 * browser would show its own banner for it; instead the event is held back
 * here and used by one quiet button in Settings ("Install app") — no
 * banners, no nagging (Constitution: never manipulate attention). Safari
 * and Firefox never fire the event, so there the Settings card explains how
 * to install from the browser's own menu instead.
 */

/** The browser's install prompt (not in the DOM typings yet). */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let held: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

/**
 * Starts listening for the install event. Called once by `PwaSupport`,
 * which sits in the root layout so it is listening before anyone opens
 * Settings. Returns the function that stops listening.
 */
export function captureInstallPrompt(): () => void {
  const onPrompt = (event: Event) => {
    event.preventDefault();
    held = event as BeforeInstallPromptEvent;
    notify();
  };
  const onInstalled = () => {
    held = null;
    notify();
  };
  window.addEventListener("beforeinstallprompt", onPrompt);
  window.addEventListener("appinstalled", onInstalled);
  return () => {
    window.removeEventListener("beforeinstallprompt", onPrompt);
    window.removeEventListener("appinstalled", onInstalled);
  };
}

/** Already running as an installed app (its own window, no browser bars). */
export function isRunningInstalled(): boolean {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return iosStandalone || window.matchMedia?.("(display-mode: standalone)").matches === true;
}

export type InstallState =
  /** Running as the installed app already. */
  | "installed"
  /** The browser has offered to install it; `install()` shows its dialog. */
  | "available"
  /** Nothing to offer from here — point at the browser's own menu. */
  | "manual";

export function useInstallState(): { state: InstallState; install: () => Promise<void> } {
  // "manual" on the server and first render (so they agree), then the truth.
  const [state, setState] = useState<InstallState>("manual");

  useEffect(() => {
    const update = () =>
      setState(isRunningInstalled() ? "installed" : held ? "available" : "manual");
    update();
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);

  const install = useCallback(async () => {
    const prompt = held;
    if (!prompt) return;
    // A held event can be used once, whatever the person answers.
    held = null;
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } finally {
      notify();
    }
  }, []);

  return { state, install };
}
