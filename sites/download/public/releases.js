"use strict";

/*
 * What the downloads page knows how to do, kept apart from the page itself so
 * it can be tested without a browser (sites/download/test/releases.test.cjs):
 * find the newest app release, sort its files into Windows / Mac / Linux /
 * Android, work out which computer a visitor is on, and describe sizes and
 * dates. Loaded as a plain script in the page and with require() in tests.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.WVDownloads = factory();
  }
})(this, function () {
  var REPO = "micheal11844-web/world-vitality";
  var RELEASES_PAGE = "https://github.com/" + REPO + "/releases";
  var API_URL = "https://api.github.com/repos/" + REPO + "/releases?per_page=10";

  // Release tags look like native-v0.1.0 (docs/runbooks/native-apps.md).
  var TAG = /^native-v(\d+\.\d+\.\d+)$/;

  // The file names the build workflow produces (electron-builder.yml and
  // .github/workflows/native-apps.yml). One pattern per kind of file.
  var FILE_KINDS = [
    ["windows", /^World-Vitality-Setup-\d+\.\d+\.\d+\.exe$/],
    ["macArm", /^World-Vitality-\d+\.\d+\.\d+-arm64\.dmg$/],
    ["macIntel", /^World-Vitality-\d+\.\d+\.\d+-x64\.dmg$/],
    ["linux", /^World-Vitality-\d+\.\d+\.\d+\.AppImage$/],
    ["android", /^World-Vitality-\d+\.\d+\.\d+\.apk$/],
    ["checksums", /^SHA256SUMS\.txt$/],
  ];

  // Downloads are only ever offered from this repository's own release files.
  function isTrustedDownloadUrl(value) {
    var url;
    try {
      url = new URL(value);
    } catch {
      return false;
    }
    return (
      url.protocol === "https:" &&
      url.hostname === "github.com" &&
      url.pathname.indexOf("/" + REPO + "/releases/download/") === 0
    );
  }

  /** The newest published app release, or null when there is none yet. */
  function pickRelease(list) {
    if (!Array.isArray(list)) return null;
    var best = null;
    list.forEach(function (release) {
      if (!release || release.draft || typeof release.tag_name !== "string") return;
      if (!TAG.test(release.tag_name)) return;
      var when = Date.parse(release.published_at || release.created_at || "");
      if (isNaN(when)) return;
      if (!best || when > best.when) best = { release: release, when: when };
    });
    return best ? best.release : null;
  }

  /** Sorts a release's files into kinds; unknown or untrusted files are ignored. */
  function classifyAssets(assets) {
    var files = {};
    (Array.isArray(assets) ? assets : []).forEach(function (asset) {
      if (!asset || typeof asset.name !== "string") return;
      if (!isTrustedDownloadUrl(asset.browser_download_url)) return;
      FILE_KINDS.forEach(function (kind) {
        if (kind[1].test(asset.name) && !files[kind[0]]) {
          files[kind[0]] = {
            name: asset.name,
            url: asset.browser_download_url,
            size: typeof asset.size === "number" ? asset.size : null,
          };
        }
      });
    });
    return files;
  }

  /** Everything the page shows about a release, or null if it has no usable files. */
  function describeRelease(release) {
    if (!release) return null;
    var files = classifyAssets(release.assets);
    var kinds = Object.keys(files).filter(function (k) {
      return k !== "checksums";
    });
    if (kinds.length === 0) return null;
    var version = TAG.exec(release.tag_name)[1];
    return {
      version: version,
      // Versions starting 0. are first tries, however GitHub flags them.
      firstVersion: version.indexOf("0.") === 0,
      publishedAt: release.published_at || release.created_at || null,
      notesUrl: /^https:\/\/github\.com\//.test(release.html_url || "") ? release.html_url : null,
      files: files,
    };
  }

  /**
   * The newest release that has at least one usable file, with its description:
   * { release, info }, or null. A newer release with no usable files (say, one
   * somebody edited by hand) is skipped in favour of the one before it.
   */
  function latestUsable(list) {
    if (!Array.isArray(list)) return null;
    var rest = list.slice();
    while (rest.length > 0) {
      var release = pickRelease(rest);
      if (!release) return null;
      var info = describeRelease(release);
      if (info) return { release: release, info: info };
      rest.splice(rest.indexOf(release), 1);
    }
    return null;
  }

  /**
   * Which kind of computer or phone this is, from what the browser says about
   * itself: "windows", "mac", "linux", "android", "ios", "chromeos" or "unknown".
   */
  function detectOs(userAgent, maxTouchPoints) {
    var ua = String(userAgent || "");
    if (/Android/i.test(ua)) return "android";
    if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
    // iPadOS asks for the desktop site and calls itself a Mac; it has a touch screen.
    if (/Macintosh/i.test(ua) && maxTouchPoints > 1) return "ios";
    if (/CrOS/i.test(ua)) return "chromeos";
    if (/Windows/i.test(ua)) return "windows";
    if (/Macintosh|Mac OS X/i.test(ua)) return "mac";
    if (/Linux|X11/i.test(ua)) return "linux";
    return "unknown";
  }

  /** "121 MB": decimal megabytes, as download sites usually quote them. */
  function formatSize(bytes) {
    if (typeof bytes !== "number" || !isFinite(bytes) || bytes <= 0) return "";
    if (bytes < 1000000) return Math.max(1, Math.round(bytes / 1000)) + " KB";
    var mb = bytes / 1000000;
    return (mb < 10 ? Math.round(mb * 10) / 10 : Math.round(mb)) + " MB";
  }

  var MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  /** "1 November 2026", in UTC so every visitor sees the same date. */
  function formatDate(iso) {
    var when = new Date(iso);
    if (isNaN(when.getTime())) return "";
    return when.getUTCDate() + " " + MONTHS[when.getUTCMonth()] + " " + when.getUTCFullYear();
  }

  return {
    REPO: REPO,
    RELEASES_PAGE: RELEASES_PAGE,
    API_URL: API_URL,
    isTrustedDownloadUrl: isTrustedDownloadUrl,
    pickRelease: pickRelease,
    classifyAssets: classifyAssets,
    describeRelease: describeRelease,
    latestUsable: latestUsable,
    detectOs: detectOs,
    formatSize: formatSize,
    formatDate: formatDate,
  };
});
