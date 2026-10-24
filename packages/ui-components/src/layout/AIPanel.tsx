import type { ReactNode } from "react";
import { Button } from "../components/Button.js";
import { Chevron, type ChevronPointing } from "./Chevron.js";
import { useUiStrings } from "../i18n/ui-strings.js";

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
  const ui = useUiStrings();
  // The panel docks at the inline-end edge, so "open" points back toward
  // the content: left in LTR, right in RTL (and the reverse for "collapse").
  const towardContent: ChevronPointing = ui.dir === "rtl" ? "right" : "left";
  const towardEdge: ChevronPointing = ui.dir === "rtl" ? "left" : "right";
  if (!open) {
    return (
      <div
        className="wv-ai-rail"
        style={{
          // Wide enough for the toggle's 44px minimum touch target plus the
          // rail's own 1px border (it was 2.5rem, so the button poked out and
          // made the whole page scroll sideways whenever the panel was closed).
          width: "3rem",
          boxSizing: "border-box",
          borderInlineStart: "1px solid var(--wv-border)",
          backgroundColor: "var(--wv-surface)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          paddingTop: "var(--wv-space-md)",
        }}
      >
        <Button variant="ghost" size="sm" onClick={onToggle} aria-label={ui.aiPanel.open}>
          <Chevron pointing={towardContent} />
        </Button>
      </div>
    );
  }

  return (
    <aside
      aria-label={ui.aiPanel.region}
      // Focusable by script only, so opening the phone-layout sheet can
      // move keyboard and screen-reader focus into it.
      tabIndex={-1}
      style={{
        width: "22rem",
        borderInlineStart: "1px solid var(--wv-border)",
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
        <span style={{ fontSize: "0.9375rem", fontWeight: 500 }}>{ui.aiPanel.title}</span>
        <Button variant="ghost" size="sm" onClick={onToggle} aria-label={ui.aiPanel.collapse}>
          {/* Docked: an arrow toward the edge. As a phone bottom sheet (see
              `shell-styles.ts`): a plain close mark. Only one shows. */}
          <span className="wv-ai-side-glyph" aria-hidden="true">
            <Chevron pointing={towardEdge} />
          </span>
          <span className="wv-ai-sheet-glyph" aria-hidden="true">
            ✕
          </span>
        </Button>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "var(--wv-space-md)" }}>{children}</div>
    </aside>
  );
}
