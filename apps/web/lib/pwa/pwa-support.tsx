"use client";

import { useEffect } from "react";
import { captureInstallPrompt } from "./install";

/**
 * Mounted once in the root layout; renders nothing. Registers the service
 * worker (`public/sw.js` — offline page and saved copies, see that file for
 * what it does and does not keep) and starts listening for the browser's
 * "this can be installed" event (see `install.ts`).
 *
 * Production only: a worker caching build files would fight the dev
 * server's hot reloading.
 */
export function PwaSupport() {
  useEffect(() => {
    const stopCapturing = captureInstallPrompt();

    let stopWaiting: (() => void) | undefined;
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      const register = () => {
        navigator.serviceWorker
          .register("/sw.js", { scope: "/", updateViaCache: "none" })
          // Offline support is an extra; failing to register must never
          // show as an error to the person using the page.
          .catch(() => undefined);
      };
      if (document.readyState === "complete") {
        register();
      } else {
        // After the page has loaded, so registering never competes with it.
        window.addEventListener("load", register, { once: true });
        stopWaiting = () => window.removeEventListener("load", register);
      }
    }

    return () => {
      stopCapturing();
      stopWaiting?.();
    };
  }, []);

  return null;
}
