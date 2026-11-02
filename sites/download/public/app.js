"use strict";

/*
 * The downloads page, made live. The HTML on its own already works: every
 * button goes to the Releases page on GitHub. This script asks GitHub for the
 * newest app release, points each button at the right file, shows the size,
 * and puts the visitor's own kind of computer first.
 *
 * Shown to the visitor, in one of these states (document.body[data-state]):
 *   static   no script has run (the plain page)
 *   loading  asking GitHub
 *   found    a release exists: real download buttons
 *   none     nothing published yet: says so, no buttons
 *   error    GitHub could not be reached or asked us to wait: links to the list
 */
(function () {
  var D = window.WVDownloads;
  if (!D) return; // the logic file did not load: leave the plain page as it is

  var SITE = "https://world-vitality.vercel.app";
  var CACHE_KEY = "wv-downloads-latest";
  var CACHE_FOUND_MS = 10 * 60 * 1000;
  var CACHE_NONE_MS = 60 * 1000;
  var TIMEOUT_MS = 8000;

  var KINDS = ["windows", "macArm", "macIntel", "linux", "android"];
  var LABELS = {
    windows: "Download for Windows",
    macArm: "Download for Apple chip",
    macIntel: "Download for Intel",
    linux: "Download for Linux",
    android: "Download for Android",
  };
  var PLATFORM_FOR_OS = {
    windows: "windows",
    mac: "mac",
    linux: "linux",
    android: "android",
    ios: "ios",
  };

  function $(selector) {
    return document.querySelector(selector);
  }

  function $all(selector) {
    return Array.prototype.slice.call(document.querySelectorAll(selector));
  }

  function setState(name) {
    document.body.setAttribute("data-state", name);
  }

  // ---------- Small pieces of the page ----------

  function addButton(parent, text, href, quiet) {
    var link = document.createElement("a");
    link.className = "btn btn-large" + (quiet ? " btn-quiet" : "");
    link.href = href;
    if (href.charAt(0) !== "#") link.rel = "noopener";
    link.textContent = text;
    parent.appendChild(link);
    return link;
  }

  function setPrimary(build) {
    var box = $("#primary");
    box.textContent = "";
    build(box);
  }

  function setReleaseLine(text) {
    var line = $("#release-line");
    line.textContent = "";
    if (text) line.appendChild(document.createTextNode(text));
    return line;
  }

  function showStatus(text, retry, releases) {
    $("#status-text").textContent = text;
    $("#status-retry").hidden = !retry;
    $("#status-releases").hidden = !releases;
    $("#status").hidden = false;
  }

  function hideStatus() {
    $("#status").hidden = true;
  }

  function setMeta(kind, text) {
    var meta = $('[data-meta="' + kind + '"]');
    if (meta) meta.textContent = text;
  }

  function openGuides(platformId) {
    $all("#" + platformId + " details").forEach(function (details) {
      details.open = true;
    });
  }

  /** Back to the plain page, before a state is drawn (also used by "Check again"). */
  function reset() {
    hideStatus();
    setReleaseLine("");
    setPrimary(function (box) {
      addButton(box, "Choose your computer", "#downloads");
    });
    $all("[data-file]").forEach(function (link) {
      link.hidden = false;
      link.href = D.RELEASES_PAGE;
    });
    KINDS.forEach(function (kind) {
      setMeta(kind, "");
    });
    $("#checksums-link").href = D.RELEASES_PAGE;
    $("#notes-link").href = D.RELEASES_PAGE;
  }

  // ---------- The visitor's own platform ----------

  /** Highlights the visitor's kind of device and moves it to the top of the list. */
  function markPlatform(os) {
    var id = PLATFORM_FOR_OS[os];
    var row = id ? document.getElementById(id) : null;
    if (!row) return;
    row.classList.add("is-match");
    var label = row.querySelector(".match");
    if (label) label.hidden = false;
    var first = document.querySelector(".platform");
    if (first && first !== row) first.parentNode.insertBefore(row, first);
    // There is nothing to download on an iPhone, so its steps are the content.
    if (os === "ios") openGuides("ios");
  }

  // ---------- The states ----------

  function renderFound(info, os) {
    setState("found");
    hideStatus();

    KINDS.forEach(function (kind) {
      var link = $('[data-file="' + kind + '"]');
      var file = info.files[kind];
      if (!link) return;
      if (file) {
        link.href = file.url;
        link.hidden = false;
        var size = D.formatSize(file.size);
        setMeta(kind, size ? size + " · " + file.name : file.name);
      } else {
        link.hidden = true;
        setMeta(kind, "This file is not part of the newest version.");
      }
    });

    if (info.files.checksums) $("#checksums-link").href = info.files.checksums.url;
    if (info.notesUrl) $("#notes-link").href = info.notesUrl;

    var text = "Version " + info.version;
    var date = D.formatDate(info.publishedAt);
    if (date) text += ", published " + date;
    text += ".";
    if (info.firstVersion) text += " This is a first version, so expect some rough edges.";
    var line = setReleaseLine(text);

    var files = info.files;
    setPrimary(function (box) {
      if (os === "windows" && files.windows) {
        addButton(box, LABELS.windows, files.windows.url);
      } else if (os === "mac" && (files.macArm || files.macIntel)) {
        if (files.macArm) addButton(box, LABELS.macArm, files.macArm.url);
        if (files.macIntel) addButton(box, LABELS.macIntel, files.macIntel.url, !!files.macArm);
      } else if (os === "linux" && files.linux) {
        addButton(box, LABELS.linux, files.linux.url);
      } else if (os === "android" && files.android) {
        addButton(box, LABELS.android, files.android.url);
      } else if (os === "ios") {
        addButton(box, "Add it to your Home Screen", "#ios");
      } else if (os === "chromeos") {
        addButton(box, "Open the website", SITE);
      } else {
        addButton(box, "Choose your computer", "#downloads");
      }
    });

    if (os === "mac" && (files.macArm || files.macIntel)) {
      line.appendChild(document.createTextNode(" Not sure which Mac you have? "));
      var how = document.createElement("a");
      how.className = "text-link";
      how.href = "#mac";
      how.textContent = "See how to check.";
      how.addEventListener("click", function () {
        var details = document.querySelector("#mac details");
        if (details) details.open = true;
      });
      line.appendChild(how);
    }

    var id = PLATFORM_FOR_OS[os];
    if (id && id !== "ios") openGuides(id);
  }

  function renderNone() {
    setState("none");
    showStatus(
      "The first version of the app is being prepared. Until it is ready, World Vitality works in any browser.",
      false,
      false,
    );
    $all("[data-file]").forEach(function (link) {
      link.hidden = true;
    });
    KINDS.forEach(function (kind) {
      // The Mac row has two buttons but one place to say it, so say it once.
      setMeta(kind, kind === "macIntel" ? "" : "Not available yet.");
    });
    setPrimary(function (box) {
      addButton(box, "Open the website", SITE);
    });
  }

  function renderError(code) {
    setState("error");
    showStatus(
      code === "rate"
        ? "GitHub is asking visitors to wait a moment before checking again, so the newest version can’t be shown right now."
        : "We couldn’t check for the newest version just now. Check your connection and try again.",
      true,
      true,
    );
    KINDS.forEach(function (kind) {
      setMeta(kind, kind === "macIntel" ? "" : "Opens the list of versions on GitHub.");
    });
    setPrimary(function (box) {
      addButton(box, "Open the list of versions", D.RELEASES_PAGE);
    });
  }

  // ---------- Asking GitHub ----------

  function failure(code) {
    var error = new Error("downloads: " + code);
    error.code = code;
    return error;
  }

  function slim(release) {
    return {
      tag_name: release.tag_name,
      published_at: release.published_at,
      created_at: release.created_at,
      html_url: release.html_url,
      assets: (release.assets || []).map(function (asset) {
        return {
          name: asset.name,
          size: asset.size,
          browser_download_url: asset.browser_download_url,
        };
      }),
    };
  }

  function readCache() {
    try {
      var saved = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
      if (!saved || typeof saved.at !== "number") return null;
      if (saved.none) return Date.now() - saved.at < CACHE_NONE_MS ? { kind: "none" } : null;
      if (Date.now() - saved.at >= CACHE_FOUND_MS) return null;
      var info = D.describeRelease(saved.release);
      return info ? { kind: "found", info: info } : null;
    } catch {
      return null;
    }
  }

  function writeCache(result) {
    try {
      var saved = { at: Date.now() };
      if (result.kind === "none") saved.none = true;
      else saved.release = slim(result.release);
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(saved));
    } catch {
      /* storage can be blocked; the page works the same without it */
    }
  }

  function fetchLatest() {
    var controller = typeof AbortController === "function" ? new AbortController() : null;
    var timer = controller
      ? setTimeout(function () {
          controller.abort();
        }, TIMEOUT_MS)
      : 0;
    function stop() {
      if (timer) clearTimeout(timer);
    }

    return fetch(D.API_URL, {
      headers: { Accept: "application/vnd.github+json" },
      credentials: "omit",
      referrerPolicy: "no-referrer",
      signal: controller ? controller.signal : undefined,
    })
      .then(function (response) {
        if (response.status === 403 || response.status === 429) throw failure("rate");
        if (!response.ok) throw failure("network");
        return response.json();
      })
      .then(
        function (list) {
          stop();
          if (!Array.isArray(list)) throw failure("network");
          var found = D.latestUsable(list);
          return found
            ? { kind: "found", release: found.release, info: found.info }
            : { kind: "none" };
        },
        function (error) {
          stop();
          throw error && error.code ? error : failure("network");
        },
      );
  }

  // ---------- Start ----------

  var os = D.detectOs(navigator.userAgent, navigator.maxTouchPoints);

  function draw(result) {
    if (result.kind === "found") renderFound(result.info, os);
    else renderNone();
  }

  function load() {
    reset();
    setState("loading");
    setReleaseLine("Checking for the newest version…");
    fetchLatest().then(
      function (result) {
        writeCache(result);
        reset();
        draw(result);
      },
      function (error) {
        reset();
        renderError(error && error.code);
      },
    );
  }

  markPlatform(os);
  $("#status-retry").addEventListener("click", load);

  var cached = readCache();
  if (cached) {
    reset();
    draw(cached);
  } else {
    load();
  }
})();
