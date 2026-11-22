# World Vitality desktop and phone apps

Thin, locked-down windows around the live website, kept outside the pnpm
workspace so the website's install, build and deploy never touch them.

- `tauri/` — Tauri: Windows and Mac (small installers; uses the web view the
  computer already has).
- `desktop/` — Electron: Linux (it bundles its own browser engine, so its
  installers are much larger).
- `mobile/` — Capacitor: Android.

Everything about them — where the downloads are, how to make a release, what
the warnings mean, what is and is not tested, how to sign them — is in
[`docs/runbooks/native-apps.md`](../docs/runbooks/native-apps.md). The reasons
are in Decision #023 of [`docs/Decision-Log.md`](../docs/Decision-Log.md).

Quick start for the Linux (Electron) desktop app on your own computer:

```
cd native/desktop
npm install
npm start
```

For the Windows and Mac (Tauri) app, see [`tauri/README.md`](tauri/README.md).
