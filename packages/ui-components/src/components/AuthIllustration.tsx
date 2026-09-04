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
 * Shows the real World Vitality logo (BUILD_PLAN Stage 14 follow-up
 * #3) — the owner's own provided asset
 * (`public/brand/world-vitality-logo.png`, the full lockup with
 * wordmark and tagline).
 *
 * **Sunset-horizon background scene, added after real use showed the
 * flat neutral panel read as bland** — plain surface color let both
 * the logo's own tagline text and the guide character wash out with
 * little to anchor them, especially in dark mode (the panel and the
 * page background were nearly indistinguishable). Rather than reaching
 * for a stock photo (licensing/consistency risk, and a photo would
 * compete with rather than support the logo's own colors) or an
 * arbitrary decorative gradient, the scene is built from colors this
 * app already owns: `--wv-color-critical-500`'s burnt-orange for the
 * sunset glow and `--wv-color-accent-900`'s deep forest green for the
 * hill silhouettes — the same two accent families used everywhere else
 * in this app for warmth and for the brand's "vitality" green,
 * reapplied here as a literal earth/horizon scene rather than
 * introduced as new, unrelated hex values. The logo's own colors (blue
 * globe, green leaf, orange-gold ribbon) sit comfortably against this
 * palette rather than clashing with it — the horizon's orange and the
 * ribbon's gold read as the same warm family; the hills' green matches
 * the leaf.
 *
 * Pure SVG/CSS, no external image request: a gradient sky, two
 * overlapping hill silhouettes for depth, a glowing low sun straddling
 * the horizon, and a handful of static stars in the upper sky — one
 * deliberate focal point (the sun's glow) with everything else quiet,
 * not a scene trying to do many things at once. `aria-hidden` — purely
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
 * "the guide lives in this world" remains true; it now sits just above
 * the hill silhouettes, as if standing on the horizon rather than
 * floating on a flat background.
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
          <linearGradient id="wv-auth-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--wv-color-neutral-900)" }} />
            <stop offset="55%" style={{ stopColor: "var(--wv-color-accent-800)" }} />
            <stop offset="80%" style={{ stopColor: "var(--wv-color-critical-600)" }} />
            <stop offset="100%" style={{ stopColor: "var(--wv-color-critical-400)" }} />
          </linearGradient>
          <radialGradient id="wv-auth-sun-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style={{ stopColor: "var(--wv-color-critical-200)", stopOpacity: 0.95 }} />
            <stop offset="45%" style={{ stopColor: "var(--wv-color-critical-300)", stopOpacity: 0.55 }} />
            <stop offset="100%" style={{ stopColor: "var(--wv-color-critical-400)", stopOpacity: 0 }} />
          </radialGradient>
          <linearGradient id="wv-auth-hill-far" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--wv-color-accent-700)" }} />
            <stop offset="100%" style={{ stopColor: "var(--wv-color-accent-800)" }} />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="100" height="100" fill="url(#wv-auth-sky)" />

        {/* Static stars, upper sky only — a quiet detail, not a pattern
            repeated across the whole scene. */}
        {[
          [8, 10], [22, 6], [35, 14], [50, 5], [64, 11], [78, 7], [90, 15], [14, 22], [58, 20],
        ].map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={i % 3 === 0 ? 0.5 : 0.3}
            style={{ fill: "var(--wv-color-neutral-100)" }}
            opacity={0.6}
          />
        ))}

        {/* Low sun, straddling the horizon line. */}
        <circle cx="50" cy="62" r="16" fill="url(#wv-auth-sun-glow)" />
        <circle cx="50" cy="62" r="7" style={{ fill: "var(--wv-color-critical-200)" }} />

        {/* Far hill, softer/darker for depth. */}
        <path
          d="M0,72 C15,66 30,70 42,64 C58,56 70,68 85,62 C92,59 97,63 100,61 L100,100 L0,100 Z"
          fill="url(#wv-auth-hill-far)"
        />

        {/* Near hill — deepest green, mirrors the logo's leaf color. */}
        <path
          d="M0,80 C18,72 32,78 48,73 C64,68 76,78 100,72 L100,100 L0,100 Z"
          style={{ fill: "var(--wv-color-accent-900)" }}
        />
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
            filter: "drop-shadow(0 4px 24px rgba(0, 0, 0, 0.35))",
          }}
        />
      </div>
      <div style={{ position: "absolute", bottom: "8%", zIndex: 1 }}>
        <GuideCharacter size={88} mood="happy" />
      </div>
    </div>
  );
}
