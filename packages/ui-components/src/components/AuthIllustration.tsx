import type { ReactNode } from "react";
import { GuideCharacter } from "./GuideCharacter.js";

export interface AuthIllustrationProps {
  className?: string;
  /**
   * Optional replacement for the default flat-SVG `GuideCharacter` in
   * the corner spot below the logo (BUILD_PLAN "STAGE — GUIDE
   * CHARACTER 3D: REAL FIX + REALISM PASS"). Lets `apps/web` inject
   * the WebGL `GuideCharacter3D` here via its own `next/dynamic(...,
   * { ssr: false })` wrapper, without this framework-light package
   * needing to know about Next.js dynamic-import mechanics itself —
   * same reasoning as this file's own doc comment on why it doesn't
   * use `next/image` directly. Defaults to the existing flat-SVG
   * character when omitted, so every other caller of
   * `AuthIllustration` is unaffected.
   */
  guideCharacter?: ReactNode;
}

/**
 * A full-bleed illustration for the auth pages' split-screen layout
 * (professional-auth-page research: a visual side panel is the current
 * SaaS convention, paired with a plain, unadorned form on the other
 * side rather than decorating the form itself).
 *
 * Shows the real World Vitality logo (BUILD_PLAN Stage 14 follow-up
 * #3) — the owner's own provided asset
 * (`public/brand/world-vitality-logo.png`, the full lockup with
 * wordmark and tagline).
 *
 * **Rebuilt this stage (BUILD_PLAN "STAGE — GUIDE CHARACTER 3D: BRAND
 * COLORS + STANDING/TRACKING/CLICK/WALK-AWAY BEHAVIOR"), replacing the
 * previous sunset-over-hills scene after real feedback that it "still
 * looks generic" and doesn't actually read as connected to the logo —
 * true even though that version deliberately reused this app's own
 * accent/critical color tokens, because color reuse alone doesn't make
 * an unrelated scene (a landscape horizon) look like it belongs to a
 * wave/globe/leaf mark.** This version instead extends the logo's own
 * motif outward into the panel: two soft flowing ribbon bands (echoing
 * the logo's own wave shape, not a new unrelated shape), a large soft
 * radial glow blending the logo's three real colors behind it (as if
 * the logo's own light is spilling into the scene), and a thin orbital
 * arc (a satellite-orbit ellipse, tying to this app's actual
 * NASA-data/monitoring subject matter, not decoration for its own
 * sake) — plus a light scatter of small dots suggesting data points
 * across the globe, kept from the previous version since that detail
 * worked.
 *
 * **New fixed "ocean blue" colors, not this app's design tokens —
 * documented deliberately, same reasoning as `GuideCharacter3D`'s own
 * fixed identity colors.** This app's token system has a green
 * (`accent`) and orange (`critical`) family but no blue family at all
 * (nothing in `packages/design-tokens` produces one) — yet the real
 * logo's globe is unmistakably blue, and a "complements the logo"
 * background needs that blue to actually read as the same object. Two
 * new fixed hex values (`OCEAN_COLORS` below) exist for this reason;
 * everything else in the scene still uses this app's real green/orange
 * tokens (`--wv-color-accent-*`, `--wv-color-critical-*`).
 *
 * Pure SVG/CSS, no external image request. `aria-hidden` — purely
 * decorative, the logo's own `alt` text remains the panel's real
 * content for assistive tech.
 *
 * **Plain `<img>`/inline SVG, not `next/image`, deliberately.** This
 * component lives in `packages/ui-components`, a framework-adjacent
 * shared package, not inside the Next.js app itself — `next/image`
 * would work in practice (webpack traces through the compiled output
 * into `apps/web`'s bundle regardless of which package it's physically
 * written in), but coupling a shared UI package's source to a specific
 * consuming framework's component is the wrong direction of dependency
 * for a package meant to be framework-light. `AppBrand`
 * (`apps/web/app/app-brand.tsx`), which lives directly inside the
 * Next.js app, uses `next/image` for the same logo mark — that's the
 * correct place for that optimization, not here.
 *
 * Guide Character still appears here (smaller, lower on the panel) —
 * "the guide lives in this world" remains true.
 */

/** Fixed, non-token blue — see the doc comment above for why this
 *  isn't a design-system color. Two shades: a pale sky/ocean tint for
 *  the gradient glow, and a deeper marine blue for the orbital arc and
 *  ribbon band so it reads as the same "water" family, not two
 *  unrelated blues. */
const OCEAN_COLORS = { pale: "#cfe6f2", deep: "#2f6f94" };

export function AuthIllustration({ className, guideCharacter }: AuthIllustrationProps) {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--wv-space-lg)",
        padding: "var(--wv-space-xl, 3rem)",
      }}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0 }}
      >
        <defs>
          <linearGradient id="wv-auth-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--wv-color-neutral-50)" }} />
            <stop offset="100%" style={{ stopColor: "var(--wv-color-neutral-100)" }} />
          </linearGradient>
          {/* The logo's own three colors, blended into one soft glow —
              "the logo's own light spilling outward," not a separate
              unrelated color story. */}
          <radialGradient id="wv-auth-logo-glow" cx="50%" cy="42%" r="55%">
            <stop offset="0%" style={{ stopColor: OCEAN_COLORS.pale, stopOpacity: 0.55 }} />
            <stop
              offset="55%"
              style={{ stopColor: "var(--wv-color-accent-200)", stopOpacity: 0.32 }}
            />
            <stop
              offset="100%"
              style={{ stopColor: "var(--wv-color-critical-200)", stopOpacity: 0 }}
            />
          </radialGradient>
          <linearGradient id="wv-auth-ribbon-blue" x1="0" y1="0" x2="1" y2="0.4">
            <stop offset="0%" style={{ stopColor: OCEAN_COLORS.deep, stopOpacity: 0 }} />
            <stop offset="50%" style={{ stopColor: OCEAN_COLORS.deep, stopOpacity: 0.22 }} />
            <stop offset="100%" style={{ stopColor: OCEAN_COLORS.pale, stopOpacity: 0 }} />
          </linearGradient>
          <linearGradient id="wv-auth-ribbon-warm" x1="1" y1="0" x2="0" y2="0.6">
            <stop
              offset="0%"
              style={{ stopColor: "var(--wv-color-critical-400)", stopOpacity: 0 }}
            />
            <stop
              offset="50%"
              style={{ stopColor: "var(--wv-color-critical-300)", stopOpacity: 0.2 }}
            />
            <stop
              offset="100%"
              style={{ stopColor: "var(--wv-color-accent-300)", stopOpacity: 0 }}
            />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="100" height="100" fill="url(#wv-auth-bg)" />
        <rect x="0" y="0" width="100" height="100" fill="url(#wv-auth-logo-glow)" />

        {/* Two flowing ribbon bands — the logo's own wave shape,
            extended outward across the whole panel rather than
            confined to the small logo image. One cool (ocean/sky),
            one warm (the ribbon's gold-orange edge), crossing behind
            the logo the same way the logo's own ribbon wraps the
            globe. */}
        <path
          d="M-10,30 C20,15 45,45 70,25 C90,10 105,20 115,10 L115,55 C95,45 85,58 65,50 C40,40 20,60 -10,48 Z"
          fill="url(#wv-auth-ribbon-blue)"
        />
        <path
          d="M-10,68 C15,80 35,55 60,72 C82,87 100,72 115,80 L115,100 L-10,100 Z"
          fill="url(#wv-auth-ribbon-warm)"
        />

        {/* A thin satellite-orbit arc — ties to this app's real
            NASA-data/monitoring subject matter, not decoration picked
            for its own sake. */}
        <ellipse
          cx="50"
          cy="46"
          rx="42"
          ry="16"
          fill="none"
          stroke={OCEAN_COLORS.deep}
          strokeOpacity={0.18}
          strokeWidth={0.4}
          transform="rotate(-8 50 46)"
        />

        {/* Scattered data points — a quiet detail, not a pattern
            repeated across the whole scene. */}
        {[
          [8, 14], [22, 8], [35, 18], [64, 9], [78, 15], [90, 20], [14, 28], [86, 32],
        ].map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={i % 3 === 0 ? 0.5 : 0.3}
            style={{ fill: "var(--wv-color-accent-400)" }}
            opacity={0.4}
          />
        ))}
      </svg>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "var(--wv-space-lg)",
        }}
      >
        <img
          src="/brand/world-vitality-logo.png"
          alt="World Vitality — See. Understand. Act."
          style={{
            width: "100%",
            maxWidth: "26rem",
            height: "auto",
            filter: "drop-shadow(0 4px 24px rgba(0, 0, 0, 0.2))",
          }}
        />
      </div>
      <div style={{ position: "absolute", bottom: "8%", zIndex: 1 }}>
        {guideCharacter ?? <GuideCharacter size={88} mood="happy" />}
      </div>
    </div>
  );
}
