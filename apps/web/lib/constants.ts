export const SESSION_COOKIE = "wv_session";
/**
 * Only ever set when the user checked "Remember Me" — its mere presence
 * is what a session-refresh check treats as "try to refresh," so an
 * unwanted persistent login is opt-in, not a default. 30 days is this
 * project's own choice (no external requirement), matching common
 * "remember me" convention research turned up (a long but bounded
 * window, not indefinite).
 */
export const REFRESH_COOKIE = "wv_refresh";
export const REMEMBER_ME_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
