import type { ReactNode } from "react";
import { Text } from "./Typography.js";
import { Button } from "./Button.js";

export type StateDisplayStatus = "empty" | "loading" | "error" | "success";

export interface StateDisplayProps {
  status: StateDisplayStatus;
  title: string;
  description?: string;
  /** Empty state: "a single, obvious next action" (Section 13) — not a
   *  menu of options. Error state: the recovery action ("try again",
   *  "go back"). Ignored for loading/success. */
  action?: { label: string; onClick: () => void };
}

const ICON: Record<StateDisplayStatus, ReactNode> = {
  empty: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  loading: (
    <span
      aria-hidden="true"
      style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        border: "2.5px solid var(--wv-border)",
        borderTopColor: "var(--wv-color-accent-500)",
        display: "inline-block",
        animation: "wv-spin 0.9s linear infinite",
      }}
    />
  ),
  error: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  success: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 12l2.5 2.5L16 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

const COLOR: Record<StateDisplayStatus, string> = {
  empty: "var(--wv-text-tertiary)",
  loading: "var(--wv-text-tertiary)",
  error: "var(--wv-color-critical-500)",
  success: "var(--wv-color-accent-500)",
};

/**
 * The shared Empty/Loading/Error/Success pattern (ticket 5.2), per
 * Section 13's specific tone requirements for each:
 * - Empty: "never a blank void — always a clear explanation... and a
 *   single, obvious next action."
 * - Loading: "calm, informative... never so lengthy that a user
 *   perceives failure."
 * - Error: "honest, plain-language, blame-free... never a raw technical
 *   message" — `description` here must be written that way by the
 *   caller; this component doesn't sanitize it.
 * - Success: "quiet and confirming, not celebratory-for-its-own-sake."
 *
 * `role="status"` for loading/success (polite live-region announcement),
 * `role="alert"` for error (assertive — the one case worth interrupting
 * a screen reader user for).
 */
export function StateDisplay({ status, title, description, action }: StateDisplayProps) {
  return (
    <div
      role={status === "error" ? "alert" : "status"}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: "var(--wv-space-sm)",
        padding: "var(--wv-space-xl)",
        color: COLOR[status],
      }}
    >
      {ICON[status]}
      <Text variant="sectionTitle" as="p" style={{ color: "var(--wv-text-primary)" }}>
        {title}
      </Text>
      {description && (
        <Text variant="body" style={{ color: "var(--wv-text-secondary)", maxWidth: "28rem" }}>
          {description}
        </Text>
      )}
      {action && (status === "empty" || status === "error") && (
        <Button
          variant="secondary"
          size="sm"
          onClick={action.onClick}
          style={{ marginTop: "var(--wv-space-sm)" }}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
