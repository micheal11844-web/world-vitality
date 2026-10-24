"use client";

import { useEffect, useState } from "react";
import { useUiStrings, type UiStrings } from "../i18n/ui-strings.js";

export interface NotificationBellProps {
  /** JSON endpoint returning `{ signedIn, unread?, criticalUnread? }`. */
  endpoint?: string;
  /** Where the bell links. Defaults to the app's Notification Center. */
  href?: string;
  /** How often to re-check while the tab is visible (ms). Default 5 minutes. */
  pollMs?: number;
}

export type BellState =
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

const DEFAULT_ENDPOINT = "/api/notifications/summary";
const DEFAULT_POLL_MS = 5 * 60 * 1000;
const SIGNED_OUT: BellState = { kind: "signed-out" };

/**
 * Fetches the unread summary and keeps it fresh: once on mount, again
 * whenever the tab becomes visible, and on a slow timer while it is.
 * Split out of the bell so the app shell can fetch it **once** and hand
 * the result to both places that show it (the header bell on wide
 * screens, the "Alerts" tab on phones) rather than polling twice.
 * `enabled: false` makes no request and reports "signed out".
 */
export function useNotificationSummary({
  endpoint = DEFAULT_ENDPOINT,
  pollMs = DEFAULT_POLL_MS,
  enabled = true,
}: { endpoint?: string; pollMs?: number; enabled?: boolean } = {}): BellState {
  const [state, setState] = useState<BellState>({ kind: "loading" });

  useEffect(() => {
    if (!enabled) return;
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
  }, [endpoint, pollMs, enabled]);

  return enabled ? state : SIGNED_OUT;
}

/** How many are unread, and how many of those are critical (0 when unknown). */
export function bellCounts(state: BellState): { unread: number; critical: number } {
  return state.kind === "ready"
    ? { unread: state.unread, critical: state.criticalUnread }
    : { unread: 0, critical: 0 };
}

/** The spoken name: the label, then each count that is non-zero. */
export function bellLabel(ui: UiStrings, state: BellState, label = ui.bell.label): string {
  const { unread, critical } = bellCounts(state);
  const parts = [label];
  if (unread > 0) parts.push(ui.bell.unread(unread));
  if (critical > 0) parts.push(ui.bell.critical(critical));
  return parts.join(ui.listSeparator);
}

/**
 * The bell itself, given a state. `NotificationBell` is this plus the
 * fetching; the app shell uses it directly with its own shared state.
 */
export function NotificationBellView({
  state,
  href = "/notifications",
  className,
}: {
  state: BellState;
  href?: string;
  className?: string;
}) {
  const ui = useUiStrings();
  if (state.kind === "signed-out") return null;

  const { unread, critical } = bellCounts(state);
  const label = bellLabel(ui, state);

  return (
    <a
      href={href}
      className={className}
      aria-label={label}
      data-critical={critical > 0 ? "true" : undefined}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        // Same height as the other header controls (see AppShell).
        boxSizing: "border-box",
        minWidth: "2.5rem",
        minHeight: "2.5rem",
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
            marginInlineStart: "0.375rem",
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
          {unread > 99 ? `${ui.formatNumber(99)}+` : ui.formatNumber(unread)}
        </span>
      )}
    </a>
  );
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
  endpoint = DEFAULT_ENDPOINT,
  href = "/notifications",
  pollMs = DEFAULT_POLL_MS,
}: NotificationBellProps) {
  const state = useNotificationSummary({ endpoint, pollMs });
  return <NotificationBellView state={state} href={href} />;
}
