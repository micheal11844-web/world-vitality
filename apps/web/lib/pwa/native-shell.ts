/**
 * The World Vitality desktop and phone apps (native/ in this repository) are
 * thin windows around this site. Each adds one short word to the browser's
 * user agent — `WorldVitalityDesktop/0.1.0` or `WorldVitalityApp/0.1.0` — so
 * the site can tell it is inside one and adjust the few things that cannot
 * work there (docs/runbooks/native-apps.md):
 *
 *  - "Continue with Google" is hidden: Google refuses sign-in inside an app
 *    window, so the button could only ever fail.
 *  - Settings says the app is installed, instead of offering to install it.
 *
 * Only what the app window itself says is trusted for these cosmetic
 * decisions; it unlocks nothing and is never used for access control.
 *
 * Keep the two words in step with native/desktop/src/main.cjs and
 * native/mobile/capacitor.config.json (their tests check this file).
 */
const NATIVE_SHELL = /\bWorldVitality(?:Desktop|App)\//;

export function isNativeShellUserAgent(userAgent: string | null | undefined): boolean {
  return typeof userAgent === "string" && NATIVE_SHELL.test(userAgent);
}
