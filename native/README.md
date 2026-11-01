# World Vitality desktop and phone apps

Thin, locked-down windows around the live website, kept outside the pnpm
workspace so the website's install, build and deploy never touch them.

- `desktop/` — Electron: Windows, Mac and Linux.
- `mobile/` — Capacitor: Android.

Everything about them — where the downloads are, how to make a release, what
the warnings mean, what is and is not tested, how to sign them — is in
[`docs/runbooks/native-apps.md`](../docs/runbooks/native-apps.md). The reasons
are in Decision #023 of [`docs/Decision-Log.md`](../docs/Decision-Log.md).

Quick start for the desktop app on your own computer:

```
cd native/desktop
npm install
npm start
```
