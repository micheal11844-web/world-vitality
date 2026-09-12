import { AppShell as BaseAppShell, type AppShellProps } from "@world-vitality/ui-components";
import { Orbi3D } from "./orbi-3d";

/**
 * Wraps the real `AppShell`, injecting the 3D `Orbi3D` into its docked
 * corner spot by default (BUILD_PLAN "STAGE — GUIDE CHARACTER 3D:
 * EXTENDED TO APPSHELL + GUIDETUTORIAL") — every workspace shell in
 * this app renders `AppShell`, and importing this wrapper instead
 * (same name, same props, drop-in) is how all of them pick up the 3D
 * character with a one-line import change rather than 16 separate
 * call-site edits.
 *
 * **Real, accepted trade-off, not an oversight**: this puts a
 * continuously-running WebGL canvas on every authenticated page in
 * the app, not just the auth-flow "flagship" moments — previously a
 * deliberate boundary this project drew for exactly this reason (see
 * `GuideCharacter3D`'s own doc comment history). Revisited after
 * explicit owner request to make Orbi 3D everywhere, not left as a
 * silent scope-creep. If real device performance ever becomes a
 * problem, the fix is switching this one file back to the flat-SVG
 * `GuideCharacter` (or gating by a "reduced motion"/low-power
 * preference) — not something every workspace shell needs to know
 * about individually, which is exactly why this indirection exists.
 */
export function AppShell(props: AppShellProps) {
  return (
    <BaseAppShell
      {...props}
      guideCharacter={props.guideCharacter ?? <Orbi3D mood="idle" size={64} />}
    />
  );
}

export type { AppShellProps };
