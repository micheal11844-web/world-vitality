# Desktop and Phone Apps Runbook

World Vitality has real installable apps for **Windows, Mac, Linux and
Android** (BUILD_PLAN v99; Decision #023). They are thin, locked-down windows
around the live website: the website still does all the work, so a change to
the site reaches the apps the moment it is deployed, with no new download.
The code is in `native/` (`native/desktop` is Electron, `native/mobile` is
Capacitor for Android). It sits **outside** the pnpm workspace, so installing,
building and deploying the website never touches it.

There is no iPhone or iPad app. See "iPhone and iPad" below.

Where people download them: the **downloads website** (`sites/download`,
Decision #024), a separate site that reads the newest release from GitHub and
offers the right file for each person's system. See "The downloads website"
below.

## Getting the installers

They are built on GitHub's own machines (Windows, Mac, Linux and Android
builders) by `.github/workflows/native-apps.yml` and published on the
repository's **Releases** page:
<https://github.com/micheal11844-web/world-vitality/releases>

| Computer or phone             | File                                 |
| ----------------------------- | ------------------------------------ |
| Windows                       | `World-Vitality-Setup-<version>.exe` |
| Mac, Apple chip (M1 or newer) | `World-Vitality-<version>-arm64.dmg` |
| Mac, Intel chip               | `World-Vitality-<version>-x64.dmg`   |
| Linux                         | `World-Vitality-<version>.AppImage`  |
| Android phone                 | `World-Vitality-<version>.apk`       |

Each release also has `SHA256SUMS.txt` so a download can be checked.

**Making a release** (a few minutes, nothing to install). First, both
`version` fields (`native/desktop/package.json` and `native/mobile/package.json`)
must be the same; when moving to a new version change both, the
`WorldVitalityApp/<version>` word in `native/mobile/capacitor.config.json`, and
the default in `native/mobile/android/app/build.gradle` (a test in
`native/mobile/test` fails if these drift). Then either:

- **The button (no terminal):** on GitHub open **Actions**, choose **Native
  apps**, **Run workflow**, tick **Publish the files as a release**, and run it.
  It builds all four, then creates the tag `native-v<version>` and the release.
- **Or push a tag:** `git tag native-v0.1.0 && git push origin native-v0.1.0`.
  (The assistant's session was refused permission to push tags, so the first
  release is done with the button.)

Watch the run on the Actions tab. When all four builds finish, the release
appears on the Releases page with the files. If any one build fails,
**nothing is published** (a half release is worse than none). Versions starting
`0.` are marked **pre-release** on GitHub.

**Rehearsal without publishing:** push a branch named `native-build/<anything>`,
or use Actions, "Native apps", "Run workflow". Everything is built and the files
are kept on the run's page (GitHub's default is 90 days). That is not a release
and nothing links to it, but because the repository is public, anyone signed
in to GitHub who finds the run can download them.

## The downloads website

Customers should not have to read GitHub's Releases page. `sites/download` is a
small static website (**https://world-vitality-downloads.vercel.app**, its own
Vercel project, `world-vitality-downloads`) with
sections for Windows, Mac, Linux and Android, install steps for the warnings
below, and how to check a download. Its README has the details.

- **It needs nothing from you after a release.** It asks GitHub for the newest
  `native-v*` release each time it is opened, so publishing a release (the
  button above) is the whole job. Do not rename the files or the tag format
  without changing `FILE_KINDS` and `TAG` in `sites/download/public/releases.js`;
  a test in that folder checks the page and the workflow still agree on the tag.
- **The main website links to it** from Settings, in the "Install on this
  device" card (`DOWNLOADS_URL` in `apps/web/app/settings/install-card.tsx`);
  the card hides the link once the app is installed. Nothing else links to it
  yet (not the landing page or the login page).
- **Until the first release is published** the page says "The first version of
  the app is being prepared" and shows no download buttons.
- **A draft release, or one whose tag is not `native-vX.Y.Z`, is never shown.**
  The newest published one wins.
- **It offers only files under this repository's release address.**

## What people see when they install

None of the installers is signed with a certificate the operating system
knows yet, so each shows a warning. It is the standard "this publisher is
unknown" screen, not a sign something is wrong. Say this on whatever page
links to the downloads.

- **Windows:** "Windows protected your PC". Choose **More info**, then **Run
  anyway**. The installer asks where to put the app (not for everyone on the
  PC; no administrator rights needed).
- **Mac:** "cannot be opened because Apple cannot check it". Open **System
  Settings, Privacy & Security**, scroll to the message about World Vitality
  and choose **Open Anyway**. (On older macOS, right-click the app and choose
  Open.) The Mac app is signed "ad hoc" only so that it can start on Apple
  Silicon; it is not notarised.
- **Linux:** make the file runnable (`chmod +x World-Vitality-<version>.AppImage`),
  then run it. Some distributions also need the FUSE library installed.
- **Android:** open the file from the browser or Files app; Android asks to
  allow installing from that source. Play Protect may say the app is not
  commonly downloaded; choose **Install anyway**.

## What the apps do, and the honest limits

- **They open the site and only the site.** A link to anywhere else opens in
  the person's normal browser. `file:`, `javascript:` and unknown-scheme
  addresses go nowhere. Nothing from the page can reach the computer: the
  desktop window has no Node access, context isolation and the sandbox on;
  the phone app asks Android for the internet and nothing else, allows no
  backups, no plain `http`, no web debugging.
- **Sign in with email and password only.** Google refuses to sign anyone in
  from inside an app window, so the site hides "Continue with Google" when it
  sees the apps (`apps/web/lib/pwa/native-shell.ts`) and says so. Someone who
  signed up with Google can use **Forgot password?** once to choose a
  password (standard Supabase behaviour; **not tried against the real project**).
  Emails the site sends (reset a password, confirm an address) open in the
  person's browser, not the app; they finish there, then sign in in the app.
  Making Google sign-in work in the apps needs a short-lived one-time hand-off
  code between the browser and the app: a database change and a security
  review. Proposed, **not built** (Decision #023).
- **Notifications:** the in-app bell and unread counts work. The desktop app
  lets the site ask to show system notifications (granting works; one has not
  been seen on a real screen). The Android WebView cannot, so the phone app has
  **no push notifications**. Real push on Android needs Firebase
  and a server sender; not built.
- **Camera, microphone and location are refused** in the desktop app (the site
  uses none of them).
- **No automatic updates.** A new site needs nothing. A new app version means
  a new release and people downloading it. Automatic updates need signed
  installers first.
- **Offline:** when the site cannot be reached both apps show a plain page
  ("You're offline… Nothing you saved has been lost") with a **Try again**
  button. Whether the site's own saved last-known pages (v86) appear first
  inside the apps' windows was **not tested**.
- **Desktop remembers** its window size and position, and stays signed in
  (the session is stored in the app's own folder, not the browser's).

## Making the apps signed (the warnings go away)

None of this is wired until you own the accounts; every number below is from
memory, not checked today, so confirm the current price on the vendor's site.

- **Android, permanent key (free, do this first).** Without it every build is
  signed with a throwaway key, so a phone must **uninstall** the old app before
  a newer one will install, and Google Play would refuse updates. Make one key
  and keep it safe (lose it and nobody can update in place):

  ```
  keytool -genkeypair -v -keystore world-vitality.jks -alias worldvitality \
    -keyalg RSA -keysize 2048 -validity 10000
  base64 -w0 world-vitality.jks     # on a Mac: base64 -i world-vitality.jks
  ```

  In GitHub, **Settings, Secrets and variables, Actions**, add four secrets:
  `ANDROID_KEYSTORE_BASE64` (that long text), `ANDROID_KEYSTORE_PASSWORD`,
  `ANDROID_KEY_ALIAS` (`worldvitality`), `ANDROID_KEY_PASSWORD`. The release
  notes stop warning about a temporary key once they exist. **Never commit the
  `.jks` file.** The build reads the key from the build machine only.

- **Google Play (Android store).** One-time registration fee (about US$25) and
  a review. Play wants an `.aab` bundle rather than an `.apk`
  (`./gradlew bundleRelease`) and a permanent key; the workflow would need a
  small addition. A site-in-a-frame app may be judged by Play's
  minimum-functionality policy.
- **Windows.** A code-signing certificate from a certificate authority
  (yearly cost; extended validation removes the warning fastest). Add the
  certificate as `CSC_LINK` (base64 of the `.pfx`) and `CSC_KEY_PASSWORD`
  secrets; the build picks them up. Not tried.
- **Mac.** Apple Developer Program (about US$99 a year), a Developer ID
  certificate (`CSC_LINK`, `CSC_KEY_PASSWORD`) and notarisation (extra Apple
  ID secrets and a workflow step that is **not written**).
- **Linux** needs nothing.

## iPhone and iPad

**Not built, and not buildable here.** An iPhone app needs the Apple Developer
Program, a Mac build machine, Apple signing, and Apple's review. Apple has a
history of turning down apps that are only a website in a frame. What works
today with no review and no cost: open the site in Safari, **Share, Add to Home
Screen** (the installable app from v86). If a native iPhone app is wanted
later, the Capacitor project can add an iOS target, but only once an Apple
Developer account exists.

## Changing things

- **Site address** (a custom domain later): change `DEFAULT_APP_URL` in
  `native/desktop/src/navigation.cjs`; `server.url` and `allowNavigation` in
  `native/mobile/capacitor.config.json`; the **Try again** link in
  `native/mobile/www/offline.html` and `index.html`. The phone test fails if
  these disagree. Apps already installed keep the address they shipped with,
  so keep the old address redirecting to the new one.
- **Icon:** replace `apps/web/public/icons/icon-512.png`, copy it to
  `native/desktop/assets/icon.png`, and run
  `native/mobile/scripts/generate-assets.sh` (needs ImageMagick) for the
  phone's launcher icons and splash.
- **Run the desktop app on your own computer:**
  `cd native/desktop && npm install && npm start`. Point it at another copy of
  the site with `WV_APP_URL=http://localhost:3000 npm start`.
- **Run the checks:** `node --test native/desktop/test/navigation.test.cjs`
  and `node --test native/mobile/test/config.test.cjs` (they also run in the
  workflow on every change to `native/`).
- **How the site knows it is in an app:** each app adds one word to the
  browser's user agent, `WorldVitalityDesktop/<version>` or
  `WorldVitalityApp/<version>`. The site uses it only to hide the Google button
  and to say "installed" in Settings, never for access. The tests in both
  projects check the website's pattern still matches.
- **Why the desktop app is built from a copy:** it is its own npm project but
  sits inside the website's pnpm workspace, and left there the installer
  builder tries to run pnpm and fails. The workflow copies it next to the
  repository first. If you build it by hand inside the repository and see
  `spawn pnpm ENOENT`, do the same or install pnpm.
- **Action versions:** the workflow uses GitHub's own actions at `@v4`
  (`setup-java` at `@v5`). GitHub prints deprecation warnings about the Node
  version they run on; they are warnings, and updating the version numbers
  silences them.

## What has and has not been tested

| Part                                   | Status                                                                                                                                                                                     |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Desktop app on Linux                   | Run for real in a virtual display: 23 window checks (opens the site, links, Google explanation, permissions, size memory, offline page) and 6 on the packaged AppImage, plus 7 unit tests. |
| Windows and Mac installers             | **Built successfully on GitHub's machines. Never started by me.** Whether the window opens on a real Windows or Mac is untried.                                                            |
| Android app                            | **Built and signed successfully on GitHub's builder. Never installed or started** (no phone or emulator here). The offline page, splash and icons in a real phone are unseen.              |
| Phone app settings                     | 7 checks of the project files (https only, one permission, no backup, no keys in the repository, icons at every size, address in one place).                                               |
| Login page and Settings in the apps    | Tested in a real browser and a real desktop window pretending to be the apps: Google hidden, note shown, "installed" shown.                                                                |
| "Forgot password?" for Google accounts | Not tried against the real Supabase project.                                                                                                                                               |

The first install on a real phone and a real Windows PC is the real test.
Report what breaks and it will be fixed in the next version.
