"use client";

import { useEffect, useState } from "react";

export interface NotificationBellProps {
  /** JSON endpoint returning `{ signedIn, unread?, criticalUnread? }`. */
  endpoint?: string;
  /** Where the bell links. Defaults to the app's Notification Center. */
  href?: string;
  /** How often to re-check while the tab is visible (ms). Default 5 minutes. */
  pollMs?: number;
}

type BellState =
  | { kind: "loading" }
  | { kind: "signed-out" }
  | { kind: "unknown" }
  | { kind: "ready"; unread: number; criticalUnread: number };

interface SummaryResponse {
  signedIn?: boolean;
  unread?: number;
  criticalUnread?: number;
  degraded?: boolean;
}

async function fetchSummary(endpoint: string, signal: AbortSignal): Promise<BellState> {
  const response = await fetch(endpoint, { signal, headers: { accept: "application/json" } });
  if (!response.ok) return { kind: "unknown" };
  const data = (await response.json()) as SummaryResponse;
  if (data.signedIn === false) return { kind: "signed-out" };
  if (data.degraded || typeof data.unread !== "number") return { kind: "unknown" };
  return {
    kind: "ready",
    unread: Math.max(0, Math.floor(data.unread)),
    criticalUnread: Math.max(0, Math.floor(data.criticalUnread ?? 0)),
  };
}

/**
 * The header's notification bell (PRD B.6). Shows an unread count and
 * links to the Notification Center. Like `GlobalSearch` and the account
 * controls it points at fixed app routes by default, so every shell
 * gets it without opting in.
 *
 * **The critical look is reserved.** Only an unread *critical*
 * notification changes the bell to the critical colour and adds the "!"
 * mark; an ordinary unread count uses the neutral accent. That keeps the
 * emergency treatment meaningful (Experience Blueprint Section 12:
 * "never reused for … lower-stakes alerts"). Colour is never the only
 * signal — the accessible name spells out the critical count too.
 *
 * Renders nothing for an anonymous visitor. If the count can't be
 * fetched it shows a plain bell (still a working link) rather than
 * hiding — a missing badge is never mistaken for "nothing unread" in
 * the accessible name, which then simply says "Notifications".
 */
export function NotificationBell({
  endpoint = "/api/notifications/summary",
  href = "/notifications",
  pollMs = 5 * 60 * 1000,
}: NotificationBellProps) {
  const [state, setState] = useState<BellState>({ kind: "loading" });

  useEffect(() => {
    let controller = new AbortController();
    let cancelled = false;

    async function refresh() {
      controller.abort();
      controller = new AbortController();
      try {
        const next = await fetchSummary(endpoint, controller.signal);
        if (!cancelled) setState(next);
      } catch {
        // Aborted by a newer refresh/unmount, or offline: keep what we
        // have, but leave "loading" so a first failure shows a plain bell.
        if (!cancelled && !controller.signal.aborted) {
          setState((prev) => (prev.kind === "loading" ? { kind: "unknown" } : prev));
        }
      }
    }

    void refresh();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, pollMs);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [endpoint, pollMs]);

  if (state.kind === "signed-out") return null;

  const unread = state.kind === "ready" ? state.unread : 0;
  const critical = state.kind === "ready" ? state.criticalUnread : 0;

  const parts = ["Notifications"];
  if (unread > 0) parts.push(`${unread} unread`);
  if (critical > 0) parts.push(`${critical} critical`);
  const label = parts.join(", ");

  return (
    <a
      href={href}
      aria-label={label}
      data-critical={critical > 0 ? "true" : undefined}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: "2.25rem",
        height: "2.25rem",
        padding: "0 0.5rem",
        borderRadius: "var(--wv-radius-sm)",
        border: `1px solid ${critical > 0 ? "var(--wv-critical)" : "var(--wv-border)"}`,
        backgroundColor: critical > 0 ? "var(--wv-color-critical-50)" : "transparent",
        color: critical > 0 ? "var(--wv-critical)" : "var(--wv-text-primary)",
        textDecoration: "none",
        fontFamily: "var(--wv-font-sans)",
      }}
    >
      <svg
        aria-hidden="true"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      {unread > 0 && (
        <span
          aria-hidden="true"
          data-testid="notification-badge"
          style={{
            marginLeft: "0.375rem",
            minWidth: "1.125rem",
            padding: "0 0.3rem",
            borderRadius: "999px",
            fontSize: "0.75rem",
            fontWeight: 700,
            lineHeight: "1.125rem",
            textAlign: "center",
            color: "#ffffff",
            backgroundColor: critical > 0 ? "var(--wv-critical)" : "var(--wv-accent)",
          }}
        >
          {critical > 0 ? "! " : ""}
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </a>
  );
}
