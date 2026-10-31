"use strict";

/**
 * World Vitality desktop app.
 *
 * A thin, locked-down window around the live site: nothing in here knows
 * about weather, accounts or plans, so every fix and feature reaches the app
 * the moment the website is updated. What this file does own is the part a
 * website cannot: which addresses the window may open, what it may ask the
 * computer for, and what to show when there is no network.
 *
 * Deliberately NOT done (see docs/runbooks/native-apps.md):
 *  - no code from the page can reach Node or the computer (context isolation
 *    and the sandbox are on, there is no preload script);
 *  - no Google sign-in. Google refuses sign-in inside an embedded app
 *    window, and getting around that (hiding what the window is) is exactly
 *    what Google's rules forbid, so the window says so and points at the two
 *    ways that work.
 */

const { app, BrowserWindow, Menu, dialog, nativeTheme, session, shell } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const { resolveAppUrl, createRouter } = require("./navigation.cjs");

const APP_NAME = "World Vitality";
const LIGHT_BACKGROUND = "#fbfaf7"; // --wv-bg, light
const DARK_BACKGROUND = "#14171a"; // --wv-bg, dark

const APP_URL = resolveAppUrl(process.env.WV_APP_URL);
const router = createRouter(APP_URL);
const isAppUrl = router.isAppUrl;

/* ------------------------------------------------------------------ */
/* Window size and position, remembered between launches               */
/* ------------------------------------------------------------------ */

const DEFAULT_BOUNDS = { width: 1280, height: 860 };
const stateFile = () => path.join(app.getPath("userData"), "window-state.json");

function readWindowState() {
  try {
    const raw = JSON.parse(fs.readFileSync(stateFile(), "utf8"));
    const number = (v) => (Number.isFinite(v) ? Math.round(v) : undefined);
    const width = number(raw.width);
    const height = number(raw.height);
    if (!width || !height || width < 400 || height < 300) return { ...DEFAULT_BOUNDS };
    return { width, height, x: number(raw.x), y: number(raw.y), maximized: raw.maximized === true };
  } catch {
    return { ...DEFAULT_BOUNDS };
  }
}

function saveWindowState(win) {
  try {
    const maximized = win.isMaximized();
    const bounds = maximized ? win.getNormalBounds() : win.getBounds();
    fs.writeFileSync(stateFile(), JSON.stringify({ ...bounds, maximized }));
  } catch {
    // Not being able to remember the size is never worth an error.
  }
}

/* ------------------------------------------------------------------ */
/* The window                                                          */
/* ------------------------------------------------------------------ */

let mainWindow = null;

function showOfflinePage(win) {
  win.loadFile(path.join(__dirname, "offline.html"), { query: { retry: APP_URL.href } });
}

function explainGoogleSignIn(win) {
  dialog
    .showMessageBox(win, {
      type: "info",
      title: APP_NAME,
      message: "Google sign-in isn’t available in the desktop app yet",
      detail:
        "Google doesn’t allow sign-in inside an app window like this one. Sign in here with your email and password, or sign in on the website.",
      buttons: ["OK", "Open the website"],
      defaultId: 0,
      cancelId: 0,
    })
    .then(({ response }) => {
      if (response === 1) shell.openExternal(APP_URL.href);
    })
    .catch(() => {});
}

function guardNavigation(win) {
  const contents = win.webContents;

  contents.on("will-navigate", (event, url) => {
    // The offline page lives on disk; only the app itself may be left for it.
    if (url.startsWith("file:") && contents.getURL().startsWith("file:")) return;
    const route = router.route(url);
    if (route === "inside") return;
    event.preventDefault();
    if (route === "google") explainGoogleSignIn(win);
    else if (route === "browser") shell.openExternal(url);
  });

  contents.on("will-redirect", (event, url) => {
    const route = router.route(url);
    if (route === "inside") return;
    event.preventDefault();
    if (route === "google") explainGoogleSignIn(win);
    else if (route === "browser") shell.openExternal(url);
  });

  // Links that ask for a new window: the app's own pages stay in this window
  // (there is one window, with its own history), everything else opens in
  // the browser. Never a second app window.
  contents.setWindowOpenHandler(({ url }) => {
    const route = router.route(url);
    if (route === "inside") {
      setImmediate(() => win.loadURL(url));
    } else if (route === "google") {
      explainGoogleSignIn(win);
    } else if (route === "browser") {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  contents.on("did-fail-load", (_event, errorCode, _description, _url, isMainFrame) => {
    // -3 is "cancelled": a navigation replaced by another one, not a failure.
    if (!isMainFrame || errorCode === -3) return;
    showOfflinePage(win);
  });
}

function createWindow() {
  const state = readWindowState();
  const win = new BrowserWindow({
    width: state.width,
    height: state.height,
    x: state.x,
    y: state.y,
    minWidth: 800,
    minHeight: 600,
    show: false,
    title: APP_NAME,
    backgroundColor: nativeTheme.shouldUseDarkColors ? DARK_BACKGROUND : LIGHT_BACKGROUND,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      spellcheck: true,
    },
  });
  if (state.maximized) win.maximize();

  guardNavigation(win);
  win.once("ready-to-show", () => win.show());
  win.on("close", () => saveWindowState(win));
  win.on("closed", () => {
    if (mainWindow === win) mainWindow = null;
  });
  // The page sets its own title; keep the app name when it has none.
  win.on("page-title-updated", (event, title) => {
    if (!title) event.preventDefault();
  });

  win.loadURL(APP_URL.href);
  return win;
}

/* ------------------------------------------------------------------ */
/* What the window may ask the computer for                            */
/* ------------------------------------------------------------------ */

// Only what the site can use. It never asks for location (its own security
// policy disables it), so the app does not grant it either.
const ALLOWED_PERMISSIONS = new Set(["notifications"]);

function configureSession() {
  const ses = session.defaultSession;
  // Say what this is, honestly, so the site can tell the installed app from a
  // browser (and does: the Settings "install" card).
  ses.setUserAgent(`${ses.getUserAgent()} WorldVitalityDesktop/${app.getVersion()}`);

  ses.setPermissionRequestHandler((contents, permission, callback, details) => {
    const from = details && details.requestingUrl ? details.requestingUrl : contents.getURL();
    callback(ALLOWED_PERMISSIONS.has(permission) && isAppUrl(from));
  });
  ses.setPermissionCheckHandler((_contents, permission, requestingOrigin) => {
    // Electron may hand over the origin with or without a trailing slash.
    return ALLOWED_PERMISSIONS.has(permission) && isAppUrl(requestingOrigin);
  });
}

/* ------------------------------------------------------------------ */
/* Menu                                                                */
/* ------------------------------------------------------------------ */

function buildMenu() {
  const mac = process.platform === "darwin";
  const template = [
    ...(mac ? [{ role: "appMenu" }] : []),
    {
      label: "File",
      submenu: [mac ? { role: "close" } : { role: "quit" }],
    },
    { role: "editMenu" },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
        // Developer tools only in a development run, never in the installed app.
        ...(app.isPackaged ? [] : [{ role: "toggleDevTools" }]),
      ],
    },
    { role: "windowMenu" },
    {
      role: "help",
      submenu: [
        {
          label: "World Vitality website",
          click: () => shell.openExternal(APP_URL.href),
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

/* ------------------------------------------------------------------ */
/* Start up                                                            */
/* ------------------------------------------------------------------ */

app.setAppUserModelId("app.worldvitality.desktop");

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  // Nothing may ever attach an embedded web view to this window.
  app.on("web-contents-created", (_event, contents) => {
    contents.on("will-attach-webview", (event) => event.preventDefault());
  });

  app.whenReady().then(() => {
    configureSession();
    buildMenu();
    mainWindow = createWindow();
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) mainWindow = createWindow();
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
