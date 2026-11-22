//! Where the World Vitality desktop window may go.
//!
//! Pure functions, no Tauri, so the rules that keep the window locked to the
//! site are covered by ordinary tests (`cargo test -p world-vitality-policy`).
//! They are the same rules as the Electron app's `native/desktop/src/navigation.cjs`
//! and its tests, so Linux (Electron) and Windows and Mac (Tauri) behave alike.

use url::Url;

/// The live site.
pub const DEFAULT_APP_URL: &str = "https://world-vitality.vercel.app";

/// The word this app adds to the browser's user agent. The website looks for
/// `WorldVitalityDesktop/` (apps/web/lib/pwa/native-shell.ts) to hide
/// "Continue with Google" and to say the app is installed; the tests below
/// read that file, so the two cannot drift apart.
pub const USER_AGENT_WORD: &str = "WorldVitalityDesktop";

/// Where the site is. `raw` (from `WV_APP_URL`) exists so the app can be tried
/// against a test copy of the site; it only accepts https, or http on this
/// machine, so a typo can never point the window at an unencrypted address
/// elsewhere.
pub fn resolve_app_url(raw: Option<&str>) -> Url {
    let default = || Url::parse(DEFAULT_APP_URL).expect("the default address is valid");
    let value = raw.unwrap_or("").trim();
    if value.is_empty() {
        return default();
    }
    match Url::parse(value) {
        Ok(url) => {
            let local = matches!(url.host_str(), Some("localhost") | Some("127.0.0.1"));
            if url.scheme() == "https" || (url.scheme() == "http" && local) {
                url
            } else {
                default()
            }
        }
        Err(_) => default(),
    }
}

/// Addresses that start a Google sign-in, which an app window cannot complete.
pub fn is_google_sign_in(value: &str) -> bool {
    let Ok(url) = Url::parse(value) else {
        return false;
    };
    let Some(host) = url.host_str() else {
        return false;
    };
    if host == "accounts.google.com" {
        return true;
    }
    // The site's own sign-in provider (Supabase) starts the Google flow here.
    host.ends_with(".supabase.co") && url.path().starts_with("/auth/v1/authorize")
}

/// Only web and email links are ever handed to the computer.
pub fn is_safe_external(value: &str) -> bool {
    match Url::parse(value) {
        Ok(url) => matches!(url.scheme(), "https" | "mailto"),
        Err(_) => false,
    }
}

/// Where an address goes.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Route {
    /// The World Vitality site itself: stays in this window.
    Inside,
    /// A Google sign-in: explained instead of attempted.
    Google,
    /// Any other web or email link: opened in the person's browser.
    Browser,
    /// Everything else (file:, javascript:, custom schemes, junk).
    Blocked,
}

/// Decides, for the site at `app_url`, where each address goes.
#[derive(Debug, Clone)]
pub struct Router {
    origin: String,
}

impl Router {
    pub fn new(app_url: &Url) -> Self {
        Self {
            origin: app_url.origin().ascii_serialization(),
        }
    }

    /// True for the site's own origin, including `blob:` addresses it makes
    /// itself (the browser reports their origin as the page that created them).
    pub fn is_app_url(&self, value: &str) -> bool {
        match Url::parse(value) {
            // An opaque origin (file:, data:, junk) serialises as "null", which
            // can never equal a real origin.
            Ok(url) => url.origin().ascii_serialization() == self.origin,
            Err(_) => false,
        }
    }

    pub fn route(&self, value: &str) -> Route {
        if self.is_app_url(value) {
            Route::Inside
        } else if is_google_sign_in(value) {
            Route::Google
        } else if is_safe_external(value) {
            Route::Browser
        } else {
            Route::Blocked
        }
    }
}

/// The app's own start page (and the empty page a script may open first), which
/// the window is allowed to show before it goes to the site. Tauri serves its
/// own pages from `tauri://localhost` (macOS) and `http://tauri.localhost`
/// (Windows).
pub fn is_local_page(value: &str) -> bool {
    let Ok(url) = Url::parse(value) else {
        return false;
    };
    match url.scheme() {
        "tauri" => url.host_str() == Some("localhost"),
        "http" | "https" => url.host_str() == Some("tauri.localhost"),
        "about" => matches!(url.as_str(), "about:blank" | "about:srcdoc"),
        _ => false,
    }
}

/// The page the window shows first. It checks the site can be reached, then
/// goes there, or says "You're offline" with a Try again button.
pub fn start_page(app_url: &Url) -> String {
    let encoded: String =
        url::form_urlencoded::byte_serialize(app_url.as_str().as_bytes()).collect();
    format!("index.html?app={encoded}")
}

/// The computers this app's user agent is written for.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Os {
    Windows,
    Mac,
    Other,
}

impl Os {
    pub fn current() -> Self {
        if cfg!(target_os = "windows") {
            Os::Windows
        } else if cfg!(target_os = "macos") {
            Os::Mac
        } else {
            Os::Other
        }
    }
}

/// The browser identity the window reports, with `WorldVitalityDesktop/<version>`
/// added. Tauri replaces the whole user agent rather than adding to it, so the
/// full string is written here. The browser versions are only labels (the page
/// runs on the engine that is really installed); they are kept recent so sites
/// that check them do not treat the window as an old browser.
pub fn user_agent(os: Os, version: &str) -> String {
    let word = format!("{USER_AGENT_WORD}/{version}");
    match os {
        Os::Mac => format!(
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15 {word}"
        ),
        Os::Windows => format!(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36 Edg/156.0.0.0 {word}"
        ),
        Os::Other => format!(
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36 {word}"
        ),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn site() -> Router {
        Router::new(&Url::parse("https://world-vitality.vercel.app").unwrap())
    }

    #[test]
    fn the_site_address_defaults_to_the_live_site() {
        let live = format!("{DEFAULT_APP_URL}/");
        assert_eq!(resolve_app_url(None).as_str(), live);
        assert_eq!(resolve_app_url(Some("")).as_str(), live);
        assert_eq!(resolve_app_url(Some("   ")).as_str(), live);
    }

    #[test]
    fn a_test_address_is_accepted_only_over_https_or_http_on_this_machine() {
        let origin = |raw| resolve_app_url(Some(raw)).origin().ascii_serialization();
        assert_eq!(
            origin("https://staging.example.com"),
            "https://staging.example.com"
        );
        assert_eq!(origin("http://localhost:3107"), "http://localhost:3107");
        assert_eq!(origin("http://127.0.0.1:3000"), "http://127.0.0.1:3000");
        // Anything else falls back to the live site rather than an unencrypted or odd address.
        let live = format!("{DEFAULT_APP_URL}/");
        for raw in [
            "http://staging.example.com",
            "ftp://example.com",
            "file:///etc/passwd",
            "not a url",
        ] {
            assert_eq!(resolve_app_url(Some(raw)).as_str(), live, "{raw}");
        }
    }

    #[test]
    fn google_sign_in_addresses_are_recognised_including_the_sites_own_providers_start_page() {
        assert!(is_google_sign_in(
            "https://accounts.google.com/o/oauth2/v2/auth?x=1"
        ));
        assert!(is_google_sign_in(
            "https://abcdefgh.supabase.co/auth/v1/authorize?provider=google"
        ));
        assert!(!is_google_sign_in(
            "https://abcdefgh.supabase.co/rest/v1/profiles"
        ));
        assert!(!is_google_sign_in(
            "https://www.google.com/search?q=weather"
        ));
        assert!(!is_google_sign_in("not a url"));
    }

    #[test]
    fn only_web_and_email_links_may_be_handed_to_the_computer() {
        assert!(is_safe_external("https://example.com/a"));
        assert!(is_safe_external("mailto:someone@example.com"));
        for raw in [
            "http://example.com",
            "file:///etc/passwd",
            "javascript:alert(1)",
            "smb://server/share",
            "ms-msdt:/id PCWDiagnostic",
            "",
        ] {
            assert!(!is_safe_external(raw), "{raw}");
        }
    }

    #[test]
    fn addresses_are_routed_to_this_window_the_browser_an_explanation_or_nowhere() {
        let router = site();
        assert_eq!(
            router.route("https://world-vitality.vercel.app/settings?x=1"),
            Route::Inside
        );
        assert_eq!(
            router.route("https://world-vitality.vercel.app"),
            Route::Inside
        );
        assert_eq!(
            router.route(
                "blob:https://world-vitality.vercel.app/3c7e1f0a-0000-4000-8000-000000000000"
            ),
            Route::Inside
        );
        assert_eq!(
            router.route("https://accounts.google.com/signin"),
            Route::Google
        );
        assert_eq!(
            router.route("https://abcdefgh.supabase.co/auth/v1/authorize?provider=google"),
            Route::Google
        );
        assert_eq!(router.route("https://example.com"), Route::Browser);
        assert_eq!(router.route("mailto:help@example.com"), Route::Browser);
        for raw in [
            "file:///C:/Windows/System32/calc.exe",
            "javascript:alert(1)",
            "data:text/html,<script>1</script>",
            // A blob made by another site is not the site, and blob: is not a web link.
            "blob:https://evil.example.com/x",
            "whatever",
        ] {
            assert_eq!(router.route(raw), Route::Blocked, "{raw}");
        }
    }

    #[test]
    fn look_alike_hosts_are_not_the_site() {
        let router = site();
        assert_eq!(
            router.route("https://world-vitality.vercel.app.evil.com/"),
            Route::Browser
        );
        assert_eq!(
            router.route("https://evil.com/world-vitality.vercel.app"),
            Route::Browser
        );
        assert_eq!(
            router.route("http://world-vitality.vercel.app/"),
            Route::Blocked
        );
        assert_eq!(
            router.route("https://world-vitality.vercel.app:8443/"),
            Route::Browser
        );
        assert_eq!(
            router.route("https://user@evil.com@world-vitality.vercel.app/"),
            Route::Inside
        );
    }

    #[test]
    fn a_test_copy_of_the_site_is_its_own_origin() {
        let router = Router::new(&Url::parse("http://localhost:3107").unwrap());
        assert_eq!(
            router.route("http://localhost:3107/dashboard"),
            Route::Inside
        );
        assert_eq!(router.route("http://localhost:3108/"), Route::Blocked);
        assert_eq!(
            router.route("https://world-vitality.vercel.app/"),
            Route::Browser
        );
    }

    #[test]
    fn only_the_apps_own_pages_count_as_local() {
        assert!(is_local_page("tauri://localhost/index.html?app=x"));
        assert!(is_local_page("http://tauri.localhost/index.html"));
        assert!(is_local_page("https://tauri.localhost/index.html"));
        assert!(is_local_page("about:blank"));
        for raw in [
            "tauri://evil/index.html",
            "http://tauri.localhost.evil.com/",
            "https://localhost/",
            "about:config",
            "file:///index.html",
            "nonsense",
        ] {
            assert!(!is_local_page(raw), "{raw}");
        }
    }

    #[test]
    fn the_start_page_carries_the_site_address_safely_encoded() {
        let url = Url::parse("https://world-vitality.vercel.app/").unwrap();
        assert_eq!(
            start_page(&url),
            "index.html?app=https%3A%2F%2Fworld-vitality.vercel.app%2F"
        );
        let tricky = Url::parse("http://localhost:3107/a?b=1&c=2#d").unwrap();
        let page = start_page(&tricky);
        assert!(!page.contains('&') && !page.contains('#'), "{page}");
    }

    #[test]
    fn the_user_agent_carries_the_word_the_website_looks_for() {
        // Read the website's own pattern so the two cannot drift apart.
        let path = concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../../../apps/web/lib/pwa/native-shell.ts"
        );
        let web = std::fs::read_to_string(path).expect("native-shell.ts is in this repository");
        assert!(
            web.contains(r"/\bWorldVitality(?:Desktop|App)\//"),
            "native-shell.ts no longer matches the word this app sends"
        );
        for os in [Os::Windows, Os::Mac, Os::Other] {
            let agent = user_agent(os, "0.1.0");
            assert!(agent.starts_with("Mozilla/5.0 ("), "{agent}");
            assert!(agent.ends_with(" WorldVitalityDesktop/0.1.0"), "{agent}");
            // `\b` before the word: it must follow a space, not be glued to other text.
            assert!(agent.contains(" WorldVitalityDesktop/"), "{agent}");
        }
        assert!(user_agent(Os::Windows, "0.1.0").contains("Windows NT 10.0"));
        assert!(user_agent(Os::Mac, "0.1.0").contains("Macintosh"));
    }
}
