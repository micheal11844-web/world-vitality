"use client";

/**
 * Tells the service worker which language the person is using in the app,
 * so the page it shows when there's no connection (`/offline`) speaks it —
 * their choice in Settings, which the worker has no other way to see, rather
 * than the browser's language. Called by every translated page; a no-op
 * where there's no service worker (development, old browsers).
 */
export function rememberLanguage(language: string): void {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  const send = (worker: ServiceWorker | null | undefined) =>
    worker?.postMessage({ type: "wv-language", language });
  if (navigator.serviceWorker.controller) {
    send(navigator.serviceWorker.controller);
  } else {
    // First visit: the worker is still installing. `ready` resolves when it
    // is active (and simply never does where none is registered).
    navigator.serviceWorker.ready
      .then((registration) => send(registration.active))
      .catch(() => undefined);
  }
}
