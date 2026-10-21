"use client";

import { useEffect, useState } from "react";
import { useUiStrings } from "../i18n/ui-strings.js";

/**
 * The tag the service worker adds to a page it serves from the copy saved
 * on this device (`apps/web/public/sw.js`, `SAVED_COPY_META`): its
 * `content` is the ISO time the copy was saved. A test reads the worker's
 * source and checks the two names agree.
 */
export const SAVED_COPY_META = "wv-saved-copy";

type Saved = { at: string } | null;

function readSavedCopy(): Saved {
  const tag = document.querySelector(`meta[name="${SAVED_COPY_META}"]`);
  if (!tag) return null;
  return { at: tag.getAttribute("content") ?? "" };
}

/**
 * Says so, in words, when what's on screen may be out of date — never
 * leaving a stale page to pass for a live one (Experience Blueprint §16:
 * cached data "clearly labeled with last-updated time"):
 *
 * - a page the service worker served from its saved copy: "You're viewing
 *   the copy you last opened, saved 2 hours ago", with a Reload button
 *   once the connection is back (the copy stays old until it's reloaded);
 * - a live page whose connection has since dropped: "You're offline."
 *
 * Renders nothing otherwise — including on the server and during
 * hydration, so it can never cause a mismatch. A neutral surface, not the
 * critical colours: those are reserved for life-safety alerts.
 */
export function OfflineNotice() {
  const ui = useUiStrings();
  const [saved, setSaved] = useState<Saved>(null);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setSaved(readSavedCopy());
    setOnline(navigator.onLine !== false);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const ago = saved ? ui.formatRelativeTime(saved.at) : "";
  const message = saved && ago ? ui.offline.savedCopy(ago) : !online ? ui.offline.offline : null;
  if (!message) return null;

  const canReload = saved !== null && online;
  return (
    <div
      role="status"
      data-testid="offline-notice"
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "var(--wv-space-sm)",
        marginBlockEnd: "var(--wv-space-md)",
        padding: "var(--wv-space-sm) var(--wv-space-md)",
        borderRadius: "var(--wv-radius-sm)",
        border: "1px solid var(--wv-border)",
        backgroundColor: "var(--wv-color-neutral-100)",
        color: "var(--wv-text-primary)",
        fontFamily: "var(--wv-font-sans)",
        fontSize: "0.875rem",
      }}
    >
      <span style={{ flex: "1 1 14rem" }}>{message}</span>
      {canReload && (
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            minHeight: "2.75rem",
            padding: "0 var(--wv-space-md)",
            borderRadius: "var(--wv-radius-sm)",
            border: "1px solid var(--wv-border)",
            backgroundColor: "var(--wv-surface)",
            color: "var(--wv-text-primary)",
            fontFamily: "inherit",
            fontSize: "inherit",
            cursor: "pointer",
          }}
        >
          {ui.offline.reload}
        </button>
      )}
    </div>
  );
}
