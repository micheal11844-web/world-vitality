/**
 * The browser's own full-screen mode, with Safari's older `webkit` names.
 *
 * A page can only enter it in answer to a tap or key press (the browser
 * refuses otherwise), so the Globe never calls this by itself: it fills the
 * window on its own once it has drawn (the layout's `immersive` mode), and
 * offers a button for the browser's full screen. iPhones do not allow it for
 * a page at all, so `canFullscreen` is false there and the button is not shown.
 */

type FullscreenDocument = Document & {
  webkitFullscreenEnabled?: boolean;
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => void;
};
type FullscreenElement = HTMLElement & { webkitRequestFullscreen?: () => void };

/** Whether this browser lets a page go full screen (false on the server and on iPhones). */
export function canFullscreen(): boolean {
  if (typeof document === "undefined") return false;
  const doc = document as FullscreenDocument;
  return doc.fullscreenEnabled === true || doc.webkitFullscreenEnabled === true;
}

/** The element that is full screen right now, or null. */
export function fullscreenElement(): Element | null {
  if (typeof document === "undefined") return null;
  const doc = document as FullscreenDocument;
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

/** Asks the browser to show `element` full screen. Resolves false if the browser said no. */
export async function enterFullscreen(element: HTMLElement): Promise<boolean> {
  try {
    const el = element as FullscreenElement;
    if (typeof el.requestFullscreen === "function") {
      await el.requestFullscreen();
      return true;
    }
    if (typeof el.webkitRequestFullscreen === "function") {
      el.webkitRequestFullscreen();
      return true;
    }
  } catch {
    // Refused (not a real tap, or blocked by the browser): the page keeps its own full-window view.
  }
  return false;
}

/** Leaves the browser's full screen, if it is on. */
export async function leaveFullscreen(): Promise<void> {
  try {
    const doc = document as FullscreenDocument;
    if (doc.fullscreenElement && typeof doc.exitFullscreen === "function") {
      await doc.exitFullscreen();
    } else if (doc.webkitFullscreenElement && typeof doc.webkitExitFullscreen === "function") {
      doc.webkitExitFullscreen();
    }
  } catch {
    // Already out.
  }
}

/** Calls `listener` whenever the browser enters or leaves full screen. Returns the undo. */
export function onFullscreenChange(listener: () => void): () => void {
  document.addEventListener("fullscreenchange", listener);
  document.addEventListener("webkitfullscreenchange", listener);
  return () => {
    document.removeEventListener("fullscreenchange", listener);
    document.removeEventListener("webkitfullscreenchange", listener);
  };
}
