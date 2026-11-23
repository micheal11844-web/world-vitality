# Desktop and Phone Apps Runbook

World Vitality has real installable apps for **Windows, Mac, Linux and
Android** (BUILD_PLAN v99; Decision #023). They are thin, locked-down windows
around the live website: the website still does all the work, so a change to
the site reaches the apps the moment it is deployed, with no new download.
The code is in `native/`: `native/tauri` is **Tauri** (Windows and Mac, v137,
Decision #039), `native/desktop` is **Electron** (Linux), `native/mobile` is
Capacitor (Android). It sits **outside** the pnpm workspace, so installing,
building and deploying the website never touches it.

Why two desktop projects: Electron ships its own copy of Chromium, so its
installers are about 116 MB. Tauri uses the web view already on the computer
(WebView2 on Windows, WebKit on Mac), so the Windows and Mac installers are much
smaller (current sizes in the table at the end). Linux has no single built-in web
view to rely on, so it stays on Electron.

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

Sizes, measured on the GitHub builders for v137: Windows about **1.2 MB**, Mac
about **3.9 MB** (Apple chip) and **4.1 MB** (Intel), Android about 3.2 MB, Linux
about 120 MB (the Electron app, which carries its own browser engine). Before
v137 the Windows installer was about 116 MB.

Each release also has `SHA256SUMS.txt` so a download can be checked.

**Making a release** (a few minutes, nothing to install). First, the versions
must all be the same: `native/desktop/package.json`,
`native/mobile/package.json`, and the three in `native/tauri` (`package.json`,
`src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, then `cargo update -w` in
`src-tauri` so `Cargo.lock` follows; the first job of the workflow checks all of
them). When moving to a new version change all of those, the
`WorldVitalityApp/<version>` word in `native/mobile/capacitor.config.json`, and
the default in `native/mobile/android/app/build.gradle` (a test in
`native/mobile/test` fails if these drift). Then either:

- **The button (no terminal):** on GitHub open **Actions**, choose **Native
  apps**, **Run workflow**, tick **Publish the files as a release**, and run it.
  It builds all four, then creates the tag `native-v<version>` and the release.
- **Or push a tag:** `git tag native-v<version> && git push origin native-v<version>`.
  (The assistant's session was refused permission to push tags, so the first
  release is done with the button.)

**Always move to a new version for a new release.** If a release for that
version already exists (for example `native-v0.1.0`), the workflow does not make
a new one: it replaces the files inside the old release with the new ones (and
leaves its notes as they were). The downloads website picks the newest release by
publish date, so a new version also becomes the one people are offered.
Version history: 0.1.0 (first, Electron everywhere, about 116 MB Windows
installer), 0.2.0 (Windows and Mac on Tauri).

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
  anyway**. The app installs for the signed-in person only (no administrator
  rights needed). If the PC lacks Microsoft's WebView2 (Windows 11 and current
  Windows 10 have it), the installer downloads it, which needs internet.
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
  Linux window has no Node access, context isolation and the sandbox on; the
  Windows and Mac app registers no commands and grants the site no permissions,
  so the page has no way to call into it; the phone app asks Android for the
  internet and nothing else, allows no backups, no plain `http`, no web
  debugging.
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
- **Notifications:** the in-app bell and unread counts work. The Linux app
  lets the site ask to show system notifications (granting works; one has not
  been seen on a real screen). In the Windows and Mac app the web view decides
  whether the site may ask; the Mac's web view may not offer system
  notifications at all (**not tested**). The Android WebView cannot, so the
  phone app has **no push notifications**. Real push on Android needs Firebase
  and a server sender; not built.
- **Camera, microphone and location:** the Linux app refuses them. The site
  uses none of them and its own `Permissions-Policy` header switches all three
  off on every page, which also covers the Windows and Mac app.
- **No automatic updates.** A new site needs nothing. A new app version means
  a new release and people downloading it. Automatic updates need signed
  installers first.
- **Offline:** when the site cannot be reached the apps show a plain page
  ("You're offline… Nothing you saved has been lost") with a **Try again**
  button. The Linux and Android apps also show it if the connection drops while
  the app is open; the Windows and Mac app shows it only when the site cannot be
  reached **at start** (mid-session it shows the web view's own error page).
  Whether the site's own saved last-known pages (v86) appear first inside the
  apps' windows was **not tested**.
- **Downloads (CSV and lesson-plan exports):** the Linux app asks where to save;
  the Windows and Mac app saves to the Downloads folder and then says where, with
  a **Show in folder** button.
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
  (yearly cost; extended validation removes the warning fastest). The Windows
  and Mac installers are now built by Tauri, which takes its certificate
  settings from its own configuration and environment (see Tauri's "Windows
  code signing" guide); the workflow's Tauri job passes none yet, so wiring it is
  a short change once a certificate exists. Not tried.
- **Mac.** Apple Developer Program (about US$99 a year), a Developer ID
  certificate and notarisation. Tauri reads the Apple certificate and ID from
  environment variables (see Tauri's "macOS code signing" guide); the workflow's
  Tauri job passes none yet. Until then the Mac app stays signed "ad hoc"
  (`signingIdentity "-"` in `tauri.conf.json`). **Not written.**
- **Linux** needs nothing. (The `CSC_LINK` and `CSC_KEY_PASSWORD` secrets the
  Electron job reads no longer matter for Windows and Mac.)

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
  `native/desktop/src/navigation.cjs` and in
  `native/tauri/src-tauri/policy/src/lib.rs` (and the matching default in
  `native/tauri/ui/boot.js`); `server.url` and `allowNavigation` in
  `native/mobile/capacitor.config.json`; the **Try again** link in
  `native/mobile/www/offline.html` and `index.html`. The phone test fails if
  these disagree. Apps already installed keep the address they shipped with,
  so keep the old address redirecting to the new one.
- **Icon:** replace `apps/web/public/icons/icon-512.png`, copy it to
  `native/desktop/assets/icon.png`, run `npm run icons` in `native/tauri` (then
  delete the Android, iOS and Store icon files it also makes; only the six in
  `src-tauri/icons` are used), and run
  `native/mobile/scripts/generate-assets.sh` (needs ImageMagick) for the
  phone's launcher icons and splash.
- **Run the Linux (Electron) app on your own computer:**
  `cd native/desktop && npm install && npm start`. Point it at another copy of
  the site with `WV_APP_URL=http://localhost:3000 npm start`.
- **Run the Windows and Mac (Tauri) app on your own computer:** see
  `native/tauri/README.md` (needs Rust; `npx tauri dev`, same `WV_APP_URL`).
- **Run the checks:** `node --test native/desktop/test/navigation.test.cjs`,
  `node --test native/mobile/test/config.test.cjs` and
  `cargo test -p world-vitality-policy` in `native/tauri/src-tauri` (they also
  run in the workflow on every change to `native/`, plus a Linux job that checks
  the Tauri app compiles).
- **How the site knows it is in an app:** each app adds one word to the
  browser's user agent, `WorldVitalityDesktop/<version>` or
  `WorldVitalityApp/<version>`. The site uses it only to hide the Google button
  and to say "installed" in Settings, never for access. The tests in all three
  projects check the website's pattern still matches. Tauri replaces the whole
  user agent rather than adding to it, so `policy::user_agent` writes out a full
  browser identity per system; its browser version numbers are labels and can be
  bumped when convenient.
- **Why the Linux (Electron) app is built from a copy:** it is its own npm project but
  sits inside the website's pnpm workspace, and left there the installer
  builder tries to run pnpm and fails. The workflow copies it next to the
  repository first. If you build it by hand inside the repository and see
  `spawn pnpm ENOENT`, do the same or install pnpm.
- **Action versions:** the workflow uses GitHub's own actions at `@v4`
  (`setup-java` at `@v5`). GitHub prints deprecation warnings about the Node
  version they run on; they are warnings, and updating the version numbers
  silences them.

## What has and has not been tested

| Part                                   | Status                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Desktop app on Linux                   | Run for real in a virtual display: 23 window checks (opens the site, links, Google explanation, permissions, size memory, offline page) and 6 on the packaged AppImage, plus 7 unit tests.                                                                                                                                                                                                                                                                                                                                                             |
| Windows and Mac app: the rules         | 10 unit tests in `native/tauri/src-tauri/policy` (same cases as the Electron navigation tests, plus the check that the site still recognises the app's user agent). They run on every change.                                                                                                                                                                                                                                                                                                                                                          |
| Windows and Mac app: compiles          | A Linux job compiles the whole app on every change; the Windows and Mac builds on GitHub's machines succeeded in the v137 rehearsal.                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Windows and Mac app: starts            | **Started for real on GitHub's Windows machine (WebView2) and Mac (WebKit, Apple chip)**, pointed at a pretend site: it opens, reaches the site, sends `WorldVitalityDesktop/<version>`, refuses a `file:` address, WebGL and WebGL2 are available, a download the site makes lands in the Downloads folder, and a link to the site's own address opens in the same window. These run in the workflow on every build and block a release if they fail. Those machines are virtual: they say nothing about speed, how the Globe looks, or an Intel Mac. |
| Windows and Mac app: not tried         | Opening the real site and signing in from the app, the Globe and maps on a real graphics card, printing a report, the Google explanation window, the "You're offline" page, a window dragged between screens, the installer's own screens, WebView2 being installed by the installer on a PC without it, an Intel Mac, and any real user on a real Windows PC or Mac. Use the checklist below.                                                                                                                                                         |
| Android app                            | **Built and signed successfully on GitHub's builder. Never installed or started** (no phone or emulator here). The offline page, splash and icons in a real phone are unseen.                                                                                                                                                                                                                                                                                                                                                                          |
| Phone app settings                     | 7 checks of the project files (https only, one permission, no backup, no keys in the repository, icons at every size, address in one place).                                                                                                                                                                                                                                                                                                                                                                                                           |
| Login page and Settings in the apps    | Tested in a real browser and a real desktop window pretending to be the apps: Google hidden, note shown, "installed" shown.                                                                                                                                                                                                                                                                                                                                                                                                                            |
| "Forgot password?" for Google accounts | Not tried against the real Supabase project.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

The first install on a real phone and a real Windows PC is the real test.
Report what breaks and it will be fixed in the next version.

## Checklist for the first install on a real Windows PC and Mac (Tauri app)

Do this with the files from the first release (or a rehearsal build's artifacts).
Anything that fails: write down what you did and what you saw.

1. **Install.** Windows: run the installer, accept the "Windows protected your PC"
   warning (More info, Run anyway). Mac: open the dmg, drag the app to
   Applications, then right-click it, Open (Apple Silicon may also need System
   Settings, Privacy and Security, Open Anyway). The installers are not signed or
   notarised, so the warnings are expected.
2. **Start.** The window opens at a normal size and shows World Vitality within a
   few seconds. Close it, open again: it should come back at the same size and
   place.
3. **Sign in** with email and password. "Continue with Google" must not be there.
   Open a workspace and Settings; Settings should say the app is installed.
4. **The Globe** (`/globe`): it loads, turns and you can zoom. Open the **Explore** page too.
5. **Links:** click "Data sources and credits", then a credit that goes to another
   website. The other website should open in your normal browser, not in the app.
6. **Download:** in the Insurance workspace, open a report and export it as CSV. A message should say it was
   saved to Downloads, with Show in folder. Open the file.
7. **Printing** (Government and NGOs report, Save as PDF): note whether it works on the Mac.
8. **Offline:** turn the internet off, start the app. It should say "You're
   offline" with Try again; turn the internet on, press Try again.
9. **Second launch:** start the app twice. The first window comes forward; no
   second window opens.
10. **Windows only:** press Ctrl and + (and −) to zoom.
