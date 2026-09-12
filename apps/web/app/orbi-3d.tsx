"use client";

import dynamic from "next/dynamic";
import type { GuideCharacterMood } from "@world-vitality/ui-components";

/**
 * Shared `next/dynamic(..., { ssr: false })` wrapper around
 * `GuideCharacter3D`, generalized (BUILD_PLAN "STAGE — GUIDE
 * CHARACTER 3D: BRAND COLORS + STANDING/TRACKING/CLICK/WALK-AWAY
 * BEHAVIOR") from a login-page-only component into a shared one used
 * by every auth-flow page that showed the flat-SVG `GuideCharacter`
 * before: `login`, `forgot-password`, `reset-password`, and
 * `AuthIllustration`'s own corner spot. Previously only
 * `AuthIllustration`'s instance was converted, which is exactly the
 * "you didn't change it everywhere" gap this fixes — the auth pages'
 * own inline guide (next to "Sign in" / "Reset your password" / etc.)
 * was still the old 2D version.
 *
 * `AppShell`'s docked corner (visible on every authenticated page) and
 * `GuideTutorial` deliberately still use the flat-SVG `GuideCharacter`
 * — a continuously-running WebGL canvas on every page load has a real
 * performance/battery cost this project isn't paying everywhere, only
 * for these auth-flow "flagship" moments. Worth revisiting if that
 * cost is ever measured and found acceptable, but not assumed here.
 *
 * Three.js touches browser globals during module import, which throws
 * during Next.js's SSR pass even for a `"use client"` component —
 * `ssr: false` is the only correct way to load it.
 */
const GuideCharacter3D = dynamic(
  () => import("@world-vitality/ui-components/GuideCharacter3D").then((m) => m.GuideCharacter3D),
  { ssr: false },
);

export interface Orbi3DProps {
  mood?: GuideCharacterMood;
  wave?: boolean;
  walkAway?: boolean;
  onWalkAwayComplete?: () => void;
  size?: number;
}

export function Orbi3D({ mood, wave, walkAway, onWalkAwayComplete, size = 88 }: Orbi3DProps) {
  return (
    <GuideCharacter3D
      size={size}
      mood={mood}
      wave={wave}
      walkAway={walkAway}
      onWalkAwayComplete={onWalkAwayComplete}
    />
  );
}
