import type { ConfidenceLevel } from "@world-vitality/interpretation-engine";
import { getConfidenceDisplay } from "../confidence.js";

const COLOR_VAR: Record<string, string> = {
  "confidence-high": "var(--wv-color-accent-500)",
  "confidence-moderate": "var(--wv-color-accent-400)",
  "confidence-low": "var(--wv-text-tertiary)",
  "confidence-unknown": "var(--wv-text-tertiary)",
};

const BG_VAR: Record<string, string> = {
  "confidence-high": "var(--wv-color-accent-100)",
  "confidence-moderate": "var(--wv-color-accent-50)",
  "confidence-low": "var(--wv-color-neutral-100)",
  "confidence-unknown": "var(--wv-color-neutral-100)",
};

export interface ConfidenceBadgeProps {
  level: ConfidenceLevel;
  /** Show the one-sentence description below the label. Default false —
   *  most surfaces (Experience Blueprint Section 10) want the compact
   *  label; the description is for a tooltip/expanded detail view. */
  showDescription?: boolean;
  className?: string;
}

/**
 * Renders the confidence/uncertainty design language (BUILD_PLAN ticket
 * 4.3, now a real component per ticket 5.2 now that React is confirmed).
 *
 * Never signals confidence by color alone (Experience Blueprint Section
 * 13: "never color-alone signaling, always paired with shape/icon/text")
 * — the label text is always present; a small dot is a secondary visual
 * reinforcement, not the only signal, and `insufficient-data` uses a
 * dashed-outline dot shape (not just a different color) so the
 * distinction survives grayscale/colorblind viewing too.
 */
export function ConfidenceBadge({
  level,
  showDescription = false,
  className,
}: ConfidenceBadgeProps) {
  const display = getConfidenceDisplay(level);
  const color = COLOR_VAR[display.colorToken];
  const bg = BG_VAR[display.colorToken];

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        flexDirection: showDescription ? "column" : "row",
        alignItems: showDescription ? "flex-start" : "center",
        gap: "var(--wv-space-xs)",
        padding: "var(--wv-space-xs) var(--wv-space-sm)",
        borderRadius: "var(--wv-radius-full)",
        backgroundColor: bg,
        fontFamily: "var(--wv-font-sans)",
        fontSize: "0.8125rem",
        color: "var(--wv-text-primary)",
      }}
      role="status"
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--wv-space-xs)" }}>
        <span
          aria-hidden="true"
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: level === "insufficient-data" ? "transparent" : color,
            border: level === "insufficient-data" ? `1.5px dashed ${color}` : "none",
            flexShrink: 0,
          }}
        />
        <span>{display.label}</span>
      </span>
      {showDescription && (
        <span style={{ color: "var(--wv-text-secondary)", fontSize: "0.75rem" }}>
          {display.description}
        </span>
      )}
    </span>
  );
}
