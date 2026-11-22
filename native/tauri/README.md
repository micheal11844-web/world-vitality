# World Vitality desktop app for Windows and Mac (Tauri)

The same thin, locked-down window around the live site as `native/desktop`
(Electron), but it uses the web view the computer already has — **WebView2** on
Windows, **WebKit** on Mac — instead of shipping a copy of Chromium. That is why
its installers are a fraction of the size. Linux stays on `native/desktop`
(Electron), because Linux has no single built-in web view to rely on.

Everything about releases, warnings, limits and testing is in
[`docs/runbooks/native-apps.md`](../../docs/runbooks/native-apps.md); the reasons
are in Decision #039 of [`docs/Decision-Log.md`](../../docs/Decision-Log.md).

```
native/tauri/
  package.json        only the Tauri command line tool (npm, pinned by package-lock.json)
  ui/                 the first page: checks the site can be reached, else "You're offline" + Try again
  src-tauri/
    tauri.conf.json   name, version, icons, installer settings, content security policy
    src/main.rs       the window and its rules (navigation, new windows, downloads, one instance)
    policy/           where the window may go: pure Rust, no Tauri, unit tests
    icons/            made from native/desktop/assets/icon.png (`npm run icons`)
```

## What it does (the same as the Electron app unless noted)

- Opens the site and only the site. A link to anywhere else opens in the
  person's normal browser (`https:` and `mailto:` only); `file:`, `javascript:`
  and other schemes go nowhere. The rules are in `policy/src/lib.rs`, which has
  the same tests as `native/desktop/test/navigation.test.cjs`.
- Google sign-in is explained instead of attempted (Google refuses it inside an
  app window); the site hides the button because the app adds
  `WorldVitalityDesktop/<version>` to its user agent.
- One window at a time (a second launch brings the first forward); it remembers
  its size, position and whether it was maximised.
- The site gets **no way to call into the app**: no commands are registered and
  no permissions are granted to it.
- **Different from the Electron app:**
  - Downloads (the CSV and lesson-plan exports) save to the Downloads folder
    without a Save As window, and a message says where.
  - No custom menu bar. Windows has none; the Mac has Tauri's standard one
    (Edit menu so copy and paste work). Ctrl +/- zooms on Windows.
  - When the site cannot be reached **at start**, a plain "You're offline" page
    with Try again is shown. If the connection drops **while the app is open**,
    the web view's own error page appears instead (Electron swaps in the same
    plain page there).
  - The whole browser identity is written out in `policy::user_agent` (Tauri
    replaces the user agent rather than adding to it), so the browser versions in
    it are labels that may need bumping now and then; the page really runs on the
    installed engine.
  - Windows needs Microsoft's WebView2 runtime. Windows 11 and current Windows 10
    have it; the installer downloads it if missing (needs internet).

## Try it on your own computer

You need Rust ([rustup.rs](https://rustup.rs)) and Node. On Windows also the
"Desktop development with C++" build tools; on Mac the Xcode command line tools.

```
cd native/tauri
npm install
npx tauri dev            # opens the app; WV_APP_URL=http://localhost:3000 to use a local copy of the site
npx tauri build          # installer under src-tauri/target/release/bundle/
```

The rules alone (any system, nothing else to install):

```
cd native/tauri/src-tauri
cargo test -p world-vitality-policy
```

## Changing the version

Change it in **four** places, all the same as `native/desktop/package.json` and
`native/mobile/package.json`: `package.json`, `src-tauri/tauri.conf.json`,
`src-tauri/Cargo.toml`, then `cargo update -w` in `src-tauri` so `Cargo.lock`
follows. The first job of `.github/workflows/native-apps.yml` checks they agree.

## Going back to Electron for Windows and Mac

Re-add the Windows and Mac entries to the `desktop` job's matrix in
`.github/workflows/native-apps.yml` and delete the `desktop-tauri` job. The file
names stay the same, so the downloads site needs no change.
