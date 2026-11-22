// World Vitality desktop app for Windows and Mac: a small, locked-down window
// around the live site, using the web view the computer already has (WebView2 on
// Windows, WebKit on Mac) instead of shipping a browser of its own. The rules for
// where the window may go are in `policy/` and are tested there.
//
// No Tauri commands are registered and no permissions are granted to the site, so
// the page being shown has no way to call into the app.

// Keeps Windows from opening a console window behind the app.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};

use tauri::webview::{DownloadEvent, NewWindowResponse};
use tauri::{AppHandle, Manager, Url, WebviewUrl, WebviewWindow, WebviewWindowBuilder};
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};
use tauri_plugin_window_state::StateFlags;
use world_vitality_policy::{self as policy, Os, Route, Router};

const WINDOW: &str = "main";
const APP_NAME: &str = "World Vitality";

/// One explanation at a time: a Google sign-in can start several navigations.
static EXPLAINING: AtomicBool = AtomicBool::new(false);

fn open_in_browser(target: &str) {
    // Only addresses the policy has already accepted (https or mailto) get here.
    let _ = open::that(target);
}

fn main_window(app: &AppHandle) -> Option<WebviewWindow> {
    app.get_webview_window(WINDOW)
}

/// Google refuses sign-in inside an app window, so say so instead of showing its error.
fn explain_google_sign_in(app: &AppHandle, site: String) {
    if EXPLAINING.swap(true, Ordering::SeqCst) {
        return;
    }
    let mut dialog = app
        .dialog()
        .message(
            "Google doesn’t allow sign-in inside an app window like this one. Sign in here with your email and password, or sign in on the website.",
        )
        .title("Google sign-in isn’t available in the desktop app yet")
        .kind(MessageDialogKind::Info)
        .buttons(MessageDialogButtons::OkCancelCustom(
            "Open the website".into(),
            "OK".into(),
        ));
    if let Some(window) = main_window(app) {
        dialog = dialog.parent(&window);
    }
    dialog.show(move |open_site| {
        EXPLAINING.store(false, Ordering::SeqCst);
        if open_site {
            open_in_browser(&site);
        }
    });
}

/// Downloads go to the Downloads folder; say where, since nothing else tells the person.
fn tell_download_result(app: &AppHandle, saved: Option<PathBuf>, success: bool) {
    let (message, buttons, folder) = match (success, saved) {
        (true, Some(path)) => {
            let name = path
                .file_name()
                .map(|n| n.to_string_lossy().into_owned())
                .unwrap_or_else(|| "The file".into());
            (
                format!("{name} was saved to your Downloads folder."),
                MessageDialogButtons::OkCancelCustom("Show in folder".into(), "OK".into()),
                path.parent().map(|p| p.to_path_buf()),
            )
        }
        _ => (
            "The download didn’t finish. Please try again.".to_string(),
            MessageDialogButtons::Ok,
            None,
        ),
    };
    let mut dialog = app
        .dialog()
        .message(message)
        .title(APP_NAME)
        .kind(MessageDialogKind::Info)
        .buttons(buttons);
    if let Some(window) = main_window(app) {
        dialog = dialog.parent(&window);
    }
    dialog.show(move |show_folder| {
        if show_folder {
            if let Some(folder) = folder {
                let _ = open::that(folder);
            }
        }
    });
}

fn build_window(app: &AppHandle) -> tauri::Result<WebviewWindow> {
    let app_url = policy::resolve_app_url(std::env::var("WV_APP_URL").ok().as_deref());
    let router = Router::new(&app_url);
    let version = app.package_info().version.to_string();
    let site = app_url.as_str().to_owned();

    let navigation_router = router.clone();
    let navigation_app = app.clone();
    let navigation_site = site.clone();

    let new_window_router = router.clone();
    let new_window_app = app.clone();
    let new_window_site = site.clone();

    let download_router = router;
    let download_app = app.clone();
    let last_download: Arc<Mutex<Option<PathBuf>>> = Arc::new(Mutex::new(None));

    let start = WebviewUrl::App(policy::start_page(&app_url).into());

    WebviewWindowBuilder::new(app, WINDOW, start)
        .title(APP_NAME)
        .inner_size(1280.0, 860.0)
        .min_inner_size(800.0, 600.0)
        .center()
        .user_agent(&policy::user_agent(Os::current(), &version))
        // Windows: let the page use HTML5 drag and drop, and Ctrl +/- to zoom.
        .disable_drag_drop_handler()
        .zoom_hotkeys_enabled(cfg!(target_os = "windows"))
        // Whole-window navigation: the app's own pages and the site stay; Google
        // sign-in is explained; other web and email links open in the person's
        // browser; everything else (file:, javascript:, custom schemes) is refused.
        .on_navigation(move |url: &Url| {
            let target = url.as_str();
            if policy::is_local_page(target) {
                return true;
            }
            match navigation_router.route(target) {
                Route::Inside => true,
                Route::Google => {
                    explain_google_sign_in(&navigation_app, navigation_site.clone());
                    false
                }
                Route::Browser => {
                    open_in_browser(target);
                    false
                }
                Route::Blocked => false,
            }
        })
        // window.open and target="_blank": never a second app window. A link to the
        // site opens here; the rest is handled as above.
        .on_new_window(move |url, _features| {
            match new_window_router.route(url.as_str()) {
                Route::Inside => {
                    if let Some(window) = main_window(&new_window_app) {
                        let _ = window.navigate(url);
                    }
                }
                Route::Google => explain_google_sign_in(&new_window_app, new_window_site.clone()),
                Route::Browser => open_in_browser(url.as_str()),
                Route::Blocked => {}
            }
            NewWindowResponse::Deny
        })
        // Only files the site itself makes (its own downloads and `blob:` exports).
        .on_download(move |_webview, event| match event {
            DownloadEvent::Requested { url, destination } => {
                if !download_router.is_app_url(url.as_str()) {
                    return false;
                }
                if let Ok(mut last) = last_download.lock() {
                    *last = Some(destination.clone());
                }
                true
            }
            DownloadEvent::Finished { success, .. } => {
                let saved = last_download.lock().ok().and_then(|mut last| last.take());
                tell_download_result(&download_app, saved, success);
                true
            }
            _ => true,
        })
        .build()
}

fn main() {
    tauri::Builder::default()
        // Must be first: a second launch brings the first window forward and quits.
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = main_window(app) {
                let _ = window.unminimize();
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        // Remembers the window's size, position and maximised state.
        .plugin(
            tauri_plugin_window_state::Builder::default()
                .with_state_flags(StateFlags::SIZE | StateFlags::POSITION | StateFlags::MAXIMIZED)
                .build(),
        )
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            build_window(app.handle())?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("World Vitality could not start");
}
