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
 * **Now shows the real World Vitality logo** (BUILD_PLAN Stage 14
 * follow-up #3) — the owner's own provided asset
 * (`public/brand/world-vitality-logo.png`, the full lockup with
 * wordmark and tagline). This replaces an earlier original SVG scene
 * (hills/sun/data-point motif) that this component used specifically
 * *because* no real logo asset existed yet at the time — see that
 * version's history in git for the original reasoning (why not a
 * stock photo, why not an AI-generated placeholder). That reasoning
 * doesn't apply anymore: a real, owned brand asset now exists, and
 * showing it is a straightforward improvement over an abstract
 * stand-in.
 *
 * **Plain `<img>`, not `next/image`, deliberately.** This component
 * lives in `packages/ui-components`, a framework-adjacent shared
 * package, not inside the Next.js app itself — `next/image` would
 * work in practice (webpack traces through the compiled output into
 * `apps/web`'s bundle regardless of which package it's physically
 * written in), but coupling a shared UI package's source to a specific
 * consuming framework's component is the wrong direction of
 * dependency for a package meant to be framework-light. `AppBrand`
 * (`apps/web/app/app-brand.tsx`), which lives directly inside the
 * Next.js app, uses `next/image` for the same logo mark — that's the
 * correct place for that optimization, not here.
 *
 * **Background changed from a green gradient to plain white/neutral**
 * — the real logo already carries this brand's full color story
 * (blue globe, green leaf, orange/gold ribbon) on its own; tinting the
 * backdrop green as the old SVG version did would compete with the
 * asset's own colors rather than let it read cleanly. A deliberate
 * change, not an oversight.
 *
 * Guide Character still appears here (smaller, lower on the panel) —
 * "the guide lives in this world" remains true even though the logo,
 * not Orbi, is now the panel's primary visual.
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
        backgroundColor: "var(--wv-surface)",
        padding: "var(--wv-space-xl, 3rem)",
      }}
    >
      <img
        src="/brand/world-vitality-logo.png"
        alt="World Vitality — See. Understand. Act."
        style={{
          width: "100%",
          maxWidth: "26rem",
          height: "auto",
        }}
      />
      <div style={{ position: "absolute", bottom: "8%" }}>
        <GuideCharacter size={88} mood="happy" />
      </div>
    </div>
  );
}
