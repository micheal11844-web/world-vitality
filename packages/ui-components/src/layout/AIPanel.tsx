import type { ReactNode } from "react";
import { Button } from "../components/Button.js";

export interface AIPanelProps {
  open: boolean;
  onToggle: () => void;
  children?: ReactNode;
}

/**
 * AI Panel dock (ticket 5.4), per Experience Blueprint Section 4: "A
 * docked or full-screen conversational surface, contextually aware of
 * whatever the user is currently viewing... optional/collapsible —
 * collapsing it lets Main Content expand to full width, never the
 * reverse."
 *
 * That last clause is a real layout constraint, not just prose: this
 * component renders nothing but a slim toggle rail when `open` is
 * false — it does not reserve empty space, so the consuming layout's
 * Main Content genuinely gets the width back. `AppShell` (this same
 * folder) is what wires that reflow.
 *
 * The conversational surface itself (chat UI, message history) is
 * Stage 6+ — this is the dock/frame only, per the same "interface
 * before implementation" pattern as Stage 1.
 */
export function AIPanel({ open, onToggle, children }: AIPanelProps) {
  if (!open) {
    return (
      <div
        style={{
          width: "2.5rem",
          borderLeft: "1px solid var(--wv-border)",
          backgroundColor: "var(--wv-surface)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          paddingTop: "var(--wv-space-md)",
        }}
      >
        <Button variant="ghost" size="sm" onClick={onToggle} aria-label="Open AI panel">
          ◀
        </Button>
      </div>
    );
  }

  return (
    <aside
      aria-label="AI assistant"
      style={{
        width: "22rem",
        borderLeft: "1px solid var(--wv-border)",
        backgroundColor: "var(--wv-surface)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "var(--wv-font-sans)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "var(--wv-space-sm) var(--wv-space-md)",
          borderBottom: "1px solid var(--wv-border)",
        }}
      >
        <span style={{ fontSize: "0.9375rem", fontWeight: 500 }}>Assistant</span>
        <Button variant="ghost" size="sm" onClick={onToggle} aria-label="Collapse AI panel">
          ▶
        </Button>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "var(--wv-space-md)" }}>{children}</div>
    </aside>
  );
}
