export type ChevronPointing = "left" | "right" | "down";

const PATHS: Record<ChevronPointing, string> = {
  left: "M15 6l-6 6 6 6",
  right: "M9 6l6 6-6 6",
  down: "M6 9l6 6 6-6",
};

/**
 * The one arrow used by the shell's toggles (sidebar collapse, the
 * assistant panel's open/close, a sidebar row's disclosure). It replaces
 * typed triangles (◀ ▶ ▼): those are drawn by whichever font the device
 * picks, so they came out at different weights and sizes from one system
 * to the next, and some phones draw ▶ as a coloured emoji.
 *
 * `data-pointing` states the direction in the DOM so right-to-left
 * behaviour can be tested without comparing pictures.
 */
export function Chevron({ pointing, size = 16 }: { pointing: ChevronPointing; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      data-pointing={pointing}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", flexShrink: 0 }}
    >
      <path d={PATHS[pointing]} />
    </svg>
  );
}
