# World Vitality downloads website

A small, separate website where people download the World Vitality desktop
apps (Windows, Mac, Linux) and the Android app, the way they would from any
other app's own site. Decision #024. The apps themselves are in `native/` and
described in `docs/runbooks/native-apps.md`.

It is **plain files**: no framework, no build step, no dependencies. Vercel
serves the `public/` folder as it is.

## How it finds the downloads

Nothing about a version is written into the page. When someone opens it, a
small script (`public/app.js`) asks GitHub for the repository's releases,
picks the newest published one whose tag looks like `native-vX.Y.Z`, sorts its
files into Windows, Mac (Apple chip and Intel), Linux and Android by file name,
and points each button at the real file with its size. It also puts the
visitor's own kind of computer first.

So **publishing a new release on GitHub is the whole job**: the site shows it
within minutes, with no change to this folder and no redeploy.

What the page shows:

| State  | When                                       | What people see                                                       |
| ------ | ------------------------------------------ | --------------------------------------------------------------------- |
| found  | a release with files exists                | real download buttons, version, date, sizes                           |
| none   | no published release yet (the case today)  | "The first version of the app is being prepared", no download buttons |
| error  | GitHub unreachable, slow (8 s) or limiting | says so, **Check again** button, buttons lead to the list of versions |
| static | JavaScript off or the script did not load  | the plain page: every button leads to the Releases page on GitHub     |

The answer is kept in the tab for 10 minutes (one minute when there is no
release) so reloading does not ask GitHub again. GitHub allows 60 anonymous
requests an hour per visitor address, which is far more than a visitor needs.

## Files

| File                     | What it is                                                                                    |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| `public/index.html`      | The page. Works on its own; the script improves it.                                           |
| `public/styles.css`      | Styling, light and dark, phone to desktop.                                                    |
| `public/releases.js`     | The logic: pick the release, sort the files, detect the system, format sizes. Tested in Node. |
| `public/app.js`          | Connects the logic to the page (states, buttons, highlighting).                               |
| `public/fonts/`          | Bricolage Grotesque (SIL Open Font License, `OFL.txt`), served from here, not from Google.    |
| `public/img/`            | The World Vitality mark and icons.                                                            |
| `vercel.json`            | Output folder and the security headers.                                                       |
| `package.json`           | Only marks the folder as CommonJS so the tests can load `releases.js`. No dependencies.       |
| `test/releases.test.cjs` | 25 checks, run by `.github/workflows/downloads-site.yml` and by hand (below).                 |

## Safety rules the page keeps

- **Downloads only from this repository.** A file is offered only if its
  address is `https://github.com/micheal11844-web/world-vitality/releases/download/...`.
  Anything else in GitHub's answer is ignored (tested, including in a browser).
- **Strict Content-Security-Policy** (`vercel.json`): scripts and styles only
  from the site itself, and the only outside address the page may contact is
  `api.github.com`. No inline scripts and no inline styles, so the test
  rejects them.
- No cookies, no analytics, no third-party fonts or scripts, nothing stored but
  the 10-minute answer in the tab's session storage (and the page works if
  that is blocked).

## Run the checks

```
node --test sites/download/test/releases.test.cjs
```

To look at it, serve the folder with any static server, for example
`npx serve sites/download/public`. With no release published you will see the
"being prepared" state. The browser-level checks used when this was built
(pretend GitHub answers: found, none, error, rate limit, timeout; light and
dark; phone widths from 320 px; no script) are not in the repository.

## Deploying (Vercel)

Live at **https://world-vitality-downloads.vercel.app**. A separate Vercel
project, **world-vitality-downloads**, from the same
repository (`micheal11844-web/world-vitality`, branch `main`) with:

- Root Directory: `sites/download`
- Framework Preset: Other (`vercel.json` sets it to none)
- Install Command and Build Command: none (set in `vercel.json`)
- Output Directory: `public` (set in `vercel.json`)

Keep Vercel's **Deployment Protection** (Vercel Authentication) **off** for
this project: it is a public page, and with it on every visitor is asked to
sign in to Vercel. (It is on by default for a new project and was switched off
when this one was created.)

It is separate from the main website's project on purpose: the website's
install, build and environment variables are untouched, and a problem here
cannot take the website down (or the other way round). It needs no
environment variables.

## Changing things

- **Another repository or tag format:** `REPO` and `TAG` at the top of
  `public/releases.js`, the `vercel.json` policy if the address changes, and the
  links in `index.html` (a test checks that every external link is the website
  or this repository).
- **Website address** (a custom domain later): the links to
  `https://world-vitality.vercel.app` in `index.html` and `app.js`. And the
  other way round: the main website links here from Settings
  (`DOWNLOADS_URL` in `apps/web/app/settings/install-card.tsx`).
- **A new kind of file** (say a `.deb`): add its pattern to `FILE_KINDS` in
  `public/releases.js`, a row and button in `index.html` with `data-file` and
  `data-meta`, and the name to `KINDS` in `public/app.js`.
- **Signed installers later:** update the "Before you open it" section and the
  install steps in `index.html`; they currently explain the unknown-publisher
  warnings.
