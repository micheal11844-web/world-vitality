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
  className?: string;
}

/*
 * Fixed identity colors — deliberately NOT theme tokens. Theme tokens
 * invert in dark mode, which made earlier versions of the character
 * disappear into the background. A sticker-style character keeps its
 * own colors and carries a thin light halo so it reads on any surface.
 */
const POT_COLOR = "#f0b43c"; // honey-pot body
const POT_BELLY = "#f9d98a"; // lighter belly patch
const POT_RIM = "#d9902a"; // pot lip + drip
const OCEAN_COLOR = "#bfe0ee";
const LAND_COLOR = "#4a9d5f";
const INK = "#2c2620"; // outline + face

const MOUTH_PATH: Record<GuideCharacterMood, string> = {
  idle: "M 60 54 Q 70 60 80 54",
  thinking: "M 62 56 Q 70 54 78 56",
  happy: "M 56 52 Q 70 68 84 52",
  concerned: "M 60 59 Q 70 51 80 59",
};

const EYEBROW_TRANSFORM: Record<GuideCharacterMood, { left: string; right: string }> = {
  idle: { left: "rotate(0deg)", right: "rotate(0deg)" },
  thinking: { left: "rotate(-8deg)", right: "rotate(10deg)" },
  happy: { left: "rotate(-4deg)", right: "rotate(4deg)" },
  concerned: { left: "rotate(14deg)", right: "rotate(-14deg)" },
};

const VIEW_W = 140;
const VIEW_H = 190;

/**
 * The Guide Character ("Orbi") — a 2D, sticker-style honey-pot bear with
 * the Earth globe as its head. Flat vector art with a heavy outline,
 * like a Telegram sticker: it works at any size, on any surface, and
 * costs one SVG instead of a WebGL canvas.
 *
 * Anatomy: the arms are drawn BEHIND the pot so each shoulder is tucked
 * under the belly's edge and the paw hangs clear outside it — attached
 * to the body, never overlapping the stomach.
 *
 * Motion is gentle (slow float, one soft wave) per the app's calm-motion
 * principle. Purely decorative: `aria-hidden`; it never carries meaning
 * that isn't also present as real text.
 */
export function GuideCharacter({
  name = "Orbi",
  mood = "idle",
  size = 140,
  wave = false,
  className,
}: GuideCharacterProps) {
  const eyebrow = EYEBROW_TRANSFORM[mood];
  const waveStyle = wave
    ? { transformOrigin: "38px 94px", animation: "wv-guide-wave 1.4s ease-in-out 1" }
    : undefined;

  return (
    <div
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
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Thinking indicator — satellite orbiting the head. */}
        {mood === "thinking" && (
          <g style={{ transformOrigin: "70px 40px", animation: "wv-spin 2.4s linear infinite" }}>
            <circle cx="70" cy="2" r="4" fill={LAND_COLOR} stroke={INK} strokeWidth="1.5" />
          </g>
        )}

        {/* Feet — behind the pot. */}
        <ellipse cx="50" cy="176" rx="16" ry="9" fill={POT_RIM} stroke={INK} strokeWidth="3" />
        <ellipse cx="90" cy="176" rx="16" ry="9" fill={POT_RIM} stroke={INK} strokeWidth="3" />

        {/* Arms — behind the pot; left arm waves from the shoulder. */}
        <line
          x1="38"
          y1="94"
          x2="16"
          y2="120"
          stroke={INK}
          strokeWidth="22"
          strokeLinecap="round"
          style={waveStyle}
        />
        <line
          x1="38"
          y1="94"
          x2="16"
          y2="120"
          stroke={POT_COLOR}
          strokeWidth="15"
          strokeLinecap="round"
          style={waveStyle}
        />
        <circle
          cx="14"
          cy="122"
          r="10"
          fill={POT_BELLY}
          stroke={INK}
          strokeWidth="3"
          style={waveStyle}
        />

        <line
          x1="102"
          y1="94"
          x2="124"
          y2="120"
          stroke={INK}
          strokeWidth="22"
          strokeLinecap="round"
        />
        <line
          x1="102"
          y1="94"
          x2="124"
          y2="120"
          stroke={POT_COLOR}
          strokeWidth="15"
          strokeLinecap="round"
        />
        <circle cx="126" cy="122" r="10" fill={POT_BELLY} stroke={INK} strokeWidth="3" />

        {/* Honey pot body — wide, round belly with a narrower neck. */}
        <path
          d="M 52,76 C 38,82 26,98 24,120 C 22,144 34,168 70,170 C 106,168 118,144 116,120 C 114,98 102,82 88,76 Z"
          fill={POT_COLOR}
          stroke={INK}
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* Belly patch */}
        <ellipse cx="70" cy="130" rx="27" ry="28" fill={POT_BELLY} opacity="0.9" />
        {/* Pot lip + honey drip */}
        <rect
          x="46"
          y="70"
          width="48"
          height="12"
          rx="6"
          fill={POT_RIM}
          stroke={INK}
          strokeWidth="3"
        />
        <ellipse cx="62" cy="86" rx="4" ry="6" fill={POT_RIM} stroke={INK} strokeWidth="2" />
        {/* Honey label — a small hexagon on the belly */}
        <polygon
          points="70,118 80,124 80,136 70,142 60,136 60,124"
          fill={POT_COLOR}
          stroke={INK}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Head — the globe, large and in front of the neck. */}
        <circle cx="70" cy="40" r="34" fill={OCEAN_COLOR} stroke={INK} strokeWidth="3.5" />
        <path
          d="M 42 30 Q 54 18 70 26 Q 82 17 96 28 Q 90 42 76 40 Q 66 50 52 44 Q 44 40 42 30 Z"
          fill={LAND_COLOR}
        />
        <path d="M 46 60 Q 58 54 66 63 Q 58 71 48 68 Z" fill={LAND_COLOR} />
        <ellipse
          cx="70"
          cy="40"
          rx="34"
          ry="12"
          fill="none"
          stroke={INK}
          strokeWidth="1"
          opacity="0.25"
        />

        {/* Face */}
        <circle cx="59" cy="42" r="4.5" fill={INK} />
        <circle cx="81" cy="42" r="4.5" fill={INK} />
        <line
          x1="52"
          y1="32"
          x2="62"
          y2="32"
          stroke={INK}
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{ transformOrigin: "57px 32px", transform: eyebrow.left }}
        />
        <line
          x1="78"
          y1="32"
          x2="88"
          y2="32"
          stroke={INK}
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{ transformOrigin: "83px 32px", transform: eyebrow.right }}
        />
        <path
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
