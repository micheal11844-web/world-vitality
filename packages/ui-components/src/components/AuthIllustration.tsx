import { GuideCharacter } from "./GuideCharacter.js";

export interface AuthIllustrationProps {
  className?: string;
}

/**
 * A full-bleed illustration for the auth pages' split-screen layout
 * (professional-auth-page research: a visual side panel is the current
 * SaaS convention, paired with a plain, unadorned form on the other
 * side rather than decorating the form itself).
 *
 * **Deliberately an original SVG illustration, not a photograph.**
 * Sourcing a real photo for this would mean either using a stock/
 * licensed image (this project has no image-licensing budget or
 * process, and Claude's own copyright policy doesn't permit fetching
 * and embedding third-party photos into someone else's production
 * codebase without a verified license) or an AI-generated image
 * (no image-generation tool was available/appropriate for a committed
 * production asset here). An original vector illustration sidesteps
 * both problems entirely, costs nothing to license, and — practically —
 * scales losslessly and stays on-brand automatically, since it's built
 * from this app's own design tokens rather than a fixed raster image.
 *
 * Extends the same globe/earth motif `GuideCharacter` already
 * established rather than introducing a new visual language just for
 * this page.
 */
export function AuthIllustration({ className }: AuthIllustrationProps) {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background:
          "linear-gradient(180deg, var(--wv-color-accent-50) 0%, var(--wv-color-accent-100) 100%)",
      }}
    >
      <svg
        viewBox="0 0 480 640"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMax slice"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Distant hills — rolling, layered, quiet composition rather
            than a busy scene, matching the calm-motion/calm-visual
            principle already established for Orbi. */}
        <path
          d="M0 420 Q 120 360 240 410 T 480 400 V 640 H 0 Z"
          fill="var(--wv-color-accent-200)"
          opacity="0.6"
        />
        <path
          d="M0 470 Q 140 430 260 465 T 480 455 V 640 H 0 Z"
          fill="var(--wv-color-accent-300)"
          opacity="0.7"
        />
        <path
          d="M0 520 Q 160 480 280 515 T 480 505 V 640 H 0 Z"
          fill="var(--wv-color-accent-400)"
        />

        {/* Sun/moon — a simple circle low on the horizon, echoing the
            globe motif without literally repeating GuideCharacter's
            head. */}
        <circle cx="360" cy="180" r="70" fill="var(--wv-color-accent-100)" opacity="0.8" />

        {/* Scattered dots — a light, abstract "data points across the
            world" motif, tying to what the product actually does
            (environmental data) without needing literal iconography. */}
        {[
          [80, 140],
          [140, 220],
          [220, 120],
          [300, 260],
          [380, 100],
          [60, 300],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="4" fill="var(--wv-color-accent-500)" opacity="0.5" />
        ))}
      </svg>

      {/* Orbi, placed within the illustration rather than only on the
          form card — reinforces "the guide lives in this world," a
          small but deliberate reason to have it as an absolutely-
          positioned overlay instead of inline SVG content. */}
      <div
        style={{ position: "absolute", bottom: "15%", left: "50%", transform: "translateX(-50%)" }}
      >
        <GuideCharacter size={120} mood="happy" />
      </div>
    </div>
  );
}
