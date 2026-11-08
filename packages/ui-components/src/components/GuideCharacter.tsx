"use client";

import { useEffect, useId, useRef, useState } from "react";

export type GuideCharacterMood = "idle" | "thinking" | "happy" | "concerned";

export interface GuideCharacterProps {
  /** Provisional name — trivial to change, it's just this one prop's
   *  default. Not yet confirmed with the product owner. */
  name?: string;
  mood?: GuideCharacterMood;
  /** Pixel HEIGHT of the character (width follows the artwork's ratio). */
  size?: number;
  /** Plays a single wave gesture once, e.g. on first mount of a page. */
  wave?: boolean;
  /** Walks off to the right and fades out (e.g. on successful sign-in).
   *  Calls `onWalkAwayComplete` when finished — immediately under
   *  reduced motion. */
  walkAway?: boolean;
  onWalkAwayComplete?: () => void;
  /** Turns off cursor-following eyes, blinking and the click hop (the
   *  explicit `wave`/`walkAway` props are unaffected). Reduced-motion
   *  users get this automatically. Default: alive. */
  still?: boolean;
  className?: string;
}

/*
 * Fixed identity colors — deliberately NOT theme tokens. Theme tokens
 * invert in dark mode, which made earlier versions of the character
 * disappear into the background. A sticker-style character keeps its
 * own colors and carries a thin light halo so it reads on any surface.
 */
const OCEAN_COLOR = "#bfe0ee"; // the globe's sea
const LAND_COLOR = "#4a9d5f"; // continents
const LEAF_COLOR = "#6cc788"; // the sprout
const RING_COLOR = "#f0b43c"; // the orbit ring
const MITT_COLOR = "#fbe3a6"; // hands
const INK = "#2c2620"; // outline + face

/* Face, as offsets from the globe's centre so the artwork can move as a whole. */
const MOUTH_PATH: Record<GuideCharacterMood, string> = {
  idle: "M 60 97 Q 70 105 80 97",
  thinking: "M 62 99 Q 70 97 78 99",
  happy: "M 57 95 Q 70 110 83 95",
  concerned: "M 61 102 Q 70 94 79 102",
};

const EYEBROW_TRANSFORM: Record<GuideCharacterMood, { left: string; right: string }> = {
  idle: { left: "translateY(-1px) rotate(0deg)", right: "translateY(-1px) rotate(0deg)" },
  thinking: { left: "rotate(4deg)", right: "translateY(-3px) rotate(-8deg)" },
  happy: { left: "translateY(-2px) rotate(-5deg)", right: "translateY(-2px) rotate(5deg)" },
  concerned: { left: "translateY(-1px) rotate(-15deg)", right: "translateY(-1px) rotate(15deg)" },
};

/** Eyes scale around their own centre when blinking. */
const EYE_STYLE = {
  transformBox: "fill-box",
  transformOrigin: "center",
  transition: "transform 90ms ease-out",
} as const;

/** The artwork is drawn in a 140 x 140 box. */
const VIEW_W = 140;
const VIEW_H = 140;
/** The globe: centre and radius. The eyes track the cursor from its centre. */
const BODY_CX = 70;
const BODY_CY = 84;
const BODY_R = 42;
/** The ring is one ellipse, tilted; the same numbers draw its back and front halves. */
const RING_CY = 104;
const RING_RX = 62;
const RING_RY = 12;
const RING_TILT = -10;
const RING_LEFT = BODY_CX - RING_RX;
const RING_RIGHT = BODY_CX + RING_RX;
/** Far half (over the top) and near half (underneath, in front of the globe). */
const RING_BACK = `M ${RING_LEFT} ${RING_CY} A ${RING_RX} ${RING_RY} 0 0 1 ${RING_RIGHT} ${RING_CY}`;
const RING_FRONT = `M ${RING_LEFT} ${RING_CY} A ${RING_RX} ${RING_RY} 0 0 0 ${RING_RIGHT} ${RING_CY}`;
/** How far (artwork units) the eyes travel toward the cursor. */
const MAX_EYE_TRAVEL = 2.6;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * The Guide Character ("Orbi") — a small 2D, sticker-style Earth: a round globe
 * with a leaf sprouting from the top and a golden orbit ring tilted around it,
 * the same globe, leaf and ribbon the logo is made of. Flat vector art with a
 * heavy outline, like a Telegram sticker: it works at any size, on any surface,
 * and costs one SVG instead of a WebGL canvas.
 *
 * Anatomy: the ring is drawn in two halves, its far half behind the globe and
 * its near half in front, so it reads as circling it. The two hands hold the ring
 * at its sides; the left one lifts to wave.
 *
 * Motion is gentle (slow float, a swaying leaf, one soft wave) per the app's
 * calm-motion principle. Purely decorative: `aria-hidden`; it never carries
 * meaning that isn't also present as real text.
 */
export function GuideCharacter({
  name = "Orbi",
  mood = "idle",
  size = 140,
  wave = false,
  walkAway = false,
  onWalkAwayComplete,
  still = false,
  className,
}: GuideCharacterProps) {
  const eyebrow = EYEBROW_TRANSFORM[mood];
  const rootRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const eyeRefs = useRef<Array<SVGCircleElement | null>>([null, null]);
  const look = useRef({ x: 0, y: 0 });
  const blinking = useRef(false);
  const onCompleteRef = useRef(onWalkAwayComplete);
  onCompleteRef.current = onWalkAwayComplete;
  // The clip path needs an id that is unique per Orbi (several can share a page).
  const clipId = `wv-orbi-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  // Decided after mount, so server and first client render agree.
  const [calm, setCalm] = useState(false);
  useEffect(() => setCalm(still || prefersReducedMotion()), [still]);
  // While thinking the gold of the ring becomes dashes that travel round it, so the
  // ring seems to turn (its far half runs one way, the near half the other).
  const ringMarch = (animationName: string) =>
    mood === "thinking" && !calm
      ? {
          strokeDasharray: "12 9",
          style: { animation: `${animationName} 1.2s linear infinite` },
        }
      : {};

  // Cursor-following eyes, idle blink and a small hop on any click.
  // Eyes are moved by writing their `style.transform` directly — a
  // pointermove must never trigger a React re-render. Skipped entirely
  // for reduced-motion users and when `still`.
  useEffect(() => {
    if (still || prefersReducedMotion()) return;

    const applyEyes = () => {
      const { x, y } = look.current;
      const scaleY = blinking.current ? 0.1 : 1;
      for (const eye of eyeRefs.current) {
        if (eye) eye.style.transform = `translate(${x}px, ${y}px) scaleY(${scaleY})`;
      }
    };

    const aimAt = (clientX: number, clientY: number) => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0) return;
      // The globe's centre, as a fraction of the artwork box.
      const cx = rect.left + rect.width * (BODY_CX / VIEW_W);
      const cy = rect.top + rect.height * (BODY_CY / VIEW_H);
      const dx = clientX - cx;
      const dy = clientY - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const reach = Math.min(dist / 200, 1) * MAX_EYE_TRAVEL;
      look.current = { x: (dx / dist) * reach, y: (dy / dist) * reach };
      applyEyes();
    };

    const onMove = (e: PointerEvent) => aimAt(e.clientX, e.clientY);
    const onDown = (e: PointerEvent) => {
      aimAt(e.clientX, e.clientY);
      const svg = svgRef.current;
      if (svg && typeof svg.animate === "function") {
        svg.animate(
          [
            { transform: "translateY(0) scale(1, 1)" },
            { transform: "translateY(-9px) scale(0.98, 1.03)" },
            { transform: "translateY(0) scale(1.03, 0.97)" },
            { transform: "translateY(0) scale(1, 1)" },
          ],
          { duration: 420, easing: "ease-out" },
        );
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });

    let blinkTimer: number | undefined;
    let openTimer: number | undefined;
    const scheduleBlink = () => {
      blinkTimer = window.setTimeout(
        () => {
          blinking.current = true;
          applyEyes();
          openTimer = window.setTimeout(() => {
            blinking.current = false;
            applyEyes();
            scheduleBlink();
          }, 130);
        },
        2600 + Math.random() * 3200,
      );
    };
    scheduleBlink();

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.clearTimeout(blinkTimer);
      window.clearTimeout(openTimer);
    };
  }, [still]);

  // Walk away to the right with a small step-bob, then fade.
  useEffect(() => {
    if (!walkAway) return;
    const svg = svgRef.current;
    if (prefersReducedMotion() || !svg || typeof svg.animate !== "function") {
      onCompleteRef.current?.();
      return;
    }
    const animation = svg.animate(
      [
        { transform: "translate(0px, 0px)", opacity: 1 },
        { transform: "translate(30px, -5px)", opacity: 1, offset: 0.2 },
        { transform: "translate(60px, 0px)", opacity: 1, offset: 0.4 },
        { transform: "translate(90px, -5px)", opacity: 0.8, offset: 0.6 },
        { transform: "translate(120px, 0px)", opacity: 0.4, offset: 0.8 },
        { transform: "translate(150px, -5px)", opacity: 0 },
      ],
      { duration: 1100, easing: "ease-in", fill: "forwards" },
    );
    animation.onfinish = () => onCompleteRef.current?.();
    return () => animation.cancel();
  }, [walkAway]);
  const waveStyle = wave ? { animation: "wv-guide-wave 1.4s ease-in-out 1" } : undefined;

  return (
    <div
      ref={rootRef}
      role="presentation"
      aria-hidden="true"
      title={name}
      className={className}
      style={{
        display: "inline-block",
        width: (size * VIEW_W) / VIEW_H,
        height: size,
        animation: "wv-guide-float 4.5s ease-in-out infinite",
        filter: "drop-shadow(0 0 1.5px rgba(255, 248, 230, 0.95))",
      }}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* The ring's far half — behind the globe. */}
        <g transform={`rotate(${RING_TILT} ${BODY_CX} ${RING_CY})`} data-part="ring-back">
          <path d={RING_BACK} fill="none" stroke={INK} strokeWidth="10" strokeLinecap="round" />
          <path
            d={RING_BACK}
            fill="none"
            stroke={RING_COLOR}
            strokeWidth="5"
            strokeLinecap="round"
            {...ringMarch("wv-guide-march-fwd")}
          />
        </g>

        {/* The leaf on top — sways slowly from its base. */}
        <g
          data-part="sprout"
          style={{
            transformOrigin: `${BODY_CX}px ${BODY_CY - BODY_R}px`,
            animation: "wv-guide-sway 5s ease-in-out infinite",
          }}
        >
          <path
            d="M 70 46 L 70 31"
            fill="none"
            stroke={INK}
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M 70 46 L 70 31"
            fill="none"
            stroke={LAND_COLOR}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M 70 33 C 60 33 51 26 50 15 C 62 14 71 21 70 33 Z"
            fill={LEAF_COLOR}
            stroke={INK}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M 70 31 C 78 24 88 22 98 13 C 99 26 90 36 70 33 Z"
            fill={LEAF_COLOR}
            stroke={INK}
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </g>

        {/* The globe. */}
        <defs>
          <clipPath id={clipId}>
            <circle cx={BODY_CX} cy={BODY_CY} r={BODY_R} />
          </clipPath>
        </defs>
        <circle
          data-part="body"
          cx={BODY_CX}
          cy={BODY_CY}
          r={BODY_R}
          fill={OCEAN_COLOR}
          stroke={INK}
          strokeWidth="3.5"
        />
        <g clipPath={`url(#${clipId})`}>
          <path
            d="M 34 66 Q 42 48 62 44 Q 76 42 88 47 Q 80 58 67 58 Q 62 66 50 68 Q 40 74 34 66 Z"
            fill={LAND_COLOR}
          />
          <path
            d="M 92 100 Q 104 95 114 104 Q 112 120 96 125 Q 86 112 92 100 Z"
            fill={LAND_COLOR}
          />
          <path d="M 26 100 Q 36 97 42 106 Q 38 116 27 113 Z" fill={LAND_COLOR} />
          <path
            d="M 44 72 Q 47 63 57 56"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.55"
          />
        </g>

        {/* The ring's near half — in front of the globe. */}
        <g transform={`rotate(${RING_TILT} ${BODY_CX} ${RING_CY})`} data-part="ring-front">
          <path d={RING_FRONT} fill="none" stroke={INK} strokeWidth="10" strokeLinecap="round" />
          <path
            d={RING_FRONT}
            fill="none"
            stroke={RING_COLOR}
            strokeWidth="5"
            strokeLinecap="round"
            {...ringMarch("wv-guide-march-back")}
          />
        </g>

        {/* Hands — they hold the ring at its two sides; the left one waves. */}
        <circle
          data-part="hand-left"
          cx="21"
          cy="119"
          r="8"
          fill={MITT_COLOR}
          stroke={INK}
          strokeWidth="3"
          style={waveStyle}
        />
        <circle
          data-part="hand-right"
          cx="122"
          cy="101"
          r="8"
          fill={MITT_COLOR}
          stroke={INK}
          strokeWidth="3"
        />

        {/* Face */}
        <circle
          ref={(el) => {
            eyeRefs.current[0] = el;
          }}
          data-part="eye"
          cx="58"
          cy="84"
          r="4.5"
          fill={INK}
          style={EYE_STYLE}
        />
        <circle
          ref={(el) => {
            eyeRefs.current[1] = el;
          }}
          data-part="eye"
          cx="82"
          cy="84"
          r="4.5"
          fill={INK}
          style={EYE_STYLE}
        />
        <line
          x1="52"
          y1="74"
          x2="62"
          y2="74"
          stroke={INK}
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{ transformOrigin: "57px 74px", transform: eyebrow.left }}
        />
        <line
          x1="78"
          y1="74"
          x2="88"
          y2="74"
          stroke={INK}
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{ transformOrigin: "83px 74px", transform: eyebrow.right }}
        />
        <path
          data-part="mouth"
          d={MOUTH_PATH[mood]}
          fill="none"
          stroke={INK}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
