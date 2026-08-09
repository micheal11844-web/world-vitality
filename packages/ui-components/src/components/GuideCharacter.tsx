export type GuideCharacterMood = "idle" | "thinking" | "happy" | "concerned";

export interface GuideCharacterProps {
  /** Provisional name — trivial to change, it's just this one prop's
   *  default. Not yet confirmed with the product owner (BUILD_PLAN
   *  Stage 9, ticket 9.1). */
  name?: string;
  mood?: GuideCharacterMood;
  /** Pixel size of the character's bounding box (square). */
  size?: number;
  /** Plays a single wave gesture once, e.g. on first mount of a page. */
  wave?: boolean;
  className?: string;
}

const MOUTH_PATH: Record<GuideCharacterMood, string> = {
  idle: "M 44 74 Q 54 80 64 74",
  thinking: "M 46 76 Q 54 74 62 76",
  happy: "M 40 72 Q 54 88 68 72",
  concerned: "M 44 78 Q 54 70 64 78",
};

const EYEBROW_TRANSFORM: Record<GuideCharacterMood, { left: string; right: string }> = {
  idle: { left: "rotate(0deg)", right: "rotate(0deg)" },
  thinking: { left: "rotate(-8deg)", right: "rotate(10deg)" },
  happy: { left: "rotate(-4deg)", right: "rotate(4deg)" },
  concerned: { left: "rotate(14deg)", right: "rotate(-14deg)" },
};

/**
 * The Guide Character (BUILD_PLAN Stage 9, un-deferred from PRD
 * Amendment 3's "AI Workforce" item at the owner's explicit request —
 * see BUILD_PLAN's EXPLICITLY DEFERRED section for that history).
 *
 * A globe-headed, friendly guide — the owner's own description was "an
 * Earth globe as its head... like Telegram's duck." Deliberately built
 * with *gentle*, not bouncy, motion: `theme.css`'s existing motion
 * principle ("purposeful, calm motion only... never bouncy or
 * attention-grabbing," written for loading states) is applied here too
 * rather than silently set aside for a mascot. A slow float plus a
 * soft one-shot wave reads as alive without clashing with that stated
 * design philosophy — flagged explicitly in the Stage 9 planning
 * rather than resolved unilaterally in code with no record of the
 * tension.
 *
 * Purely illustrative/decorative — `aria-hidden`, same treatment as
 * `MapView`'s canvas (Stage 7 accessibility pass). Any information the
 * character "says" (e.g. tutorial copy) must exist as real, separately
 * rendered text — this component must never be the only carrier of
 * meaning, consistent with the accessibility bar the rest of this
 * design system holds itself to.
 */
export function GuideCharacter({
  name = "Orbi",
  mood = "idle",
  size = 96,
  wave = false,
  className,
}: GuideCharacterProps) {
  const eyebrow = EYEBROW_TRANSFORM[mood];

  return (
    <div
      role="presentation"
      aria-hidden="true"
      title={name}
      className={className}
      style={{
        display: "inline-block",
        width: size,
        height: size,
        animation: "wv-guide-float 4.5s ease-in-out infinite",
      }}
    >
      <svg viewBox="0 0 108 132" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        {/* Body — a simple rounded pill, quiet enough not to compete
            with the globe head, which is the character's focal point. */}
        <rect
          x="30"
          y="86"
          width="48"
          height="36"
          rx="18"
          fill="var(--wv-color-neutral-200)"
          stroke="var(--wv-border)"
        />

        {/* Waving arm — a single deliberate gesture (wv-guide-wave),
            not a continuous loop, per the calm-motion principle. */}
        <line
          x1="30"
          y1="98"
          x2="14"
          y2="86"
          stroke="var(--wv-color-neutral-400)"
          strokeWidth="6"
          strokeLinecap="round"
          style={
            wave
              ? {
                  transformOrigin: "30px 98px",
                  animation: "wv-guide-wave 1.4s ease-in-out 1",
                }
              : undefined
          }
        />

        {/* Thinking indicator — a small satellite orbiting the head,
            reusing the existing wv-spin token rather than inventing a
            second spinner language. Only rendered in "thinking" mood. */}
        {mood === "thinking" && (
          <g style={{ transformOrigin: "54px 46px", animation: "wv-spin 2.4s linear infinite" }}>
            <circle cx="54" cy="10" r="4" fill="var(--wv-accent)" />
          </g>
        )}

        {/* Head — the globe. Ocean in neutral, continents in the
            existing accent green, so the character sits naturally in
            this app's already-earthy palette rather than introducing
            new colors. */}
        <circle
          cx="54"
          cy="46"
          r="38"
          fill="var(--wv-color-neutral-100)"
          stroke="var(--wv-border)"
          strokeWidth="2"
        />
        <path
          d="M 24 34 Q 38 22 54 30 Q 66 20 82 32 Q 74 46 60 44 Q 50 54 34 48 Q 26 44 24 34 Z"
          fill="var(--wv-color-accent-400)"
          opacity="0.85"
        />
        <path
          d="M 30 66 Q 44 60 52 70 Q 44 78 32 74 Z"
          fill="var(--wv-color-accent-400)"
          opacity="0.85"
        />
        {/* Latitude/longitude lines — a light hint of "globe," not a
            literal map, kept subtle so it doesn't read as clutter. */}
        <ellipse
          cx="54"
          cy="46"
          rx="38"
          ry="14"
          fill="none"
          stroke="var(--wv-border)"
          strokeWidth="1"
          opacity="0.5"
        />
        <line
          x1="54"
          y1="8"
          x2="54"
          y2="84"
          stroke="var(--wv-border)"
          strokeWidth="1"
          opacity="0.5"
        />

        {/* Face */}
        <circle cx="42" cy="46" r="4.5" fill="var(--wv-text-primary)" />
        <circle cx="66" cy="46" r="4.5" fill="var(--wv-text-primary)" />
        <line
          x1="36"
          y1="36"
          x2="46"
          y2="36"
          stroke="var(--wv-text-primary)"
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{ transformOrigin: "41px 36px", transform: eyebrow.left }}
        />
        <line
          x1="62"
          y1="36"
          x2="72"
          y2="36"
          stroke="var(--wv-text-primary)"
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{ transformOrigin: "67px 36px", transform: eyebrow.right }}
        />
        <path
          d={MOUTH_PATH[mood]}
          fill="none"
          stroke="var(--wv-text-primary)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
