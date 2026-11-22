"use strict";

// The first page the app shows. It checks that the site can be reached and then
// goes there; if it cannot be reached it says so, with a Try again button,
// instead of the browser engine's own error page.
//
// The address arrives as ?app=<address> from the app. It is only used if it is
// an https address or one on this machine; anything else goes to the live site.
(function () {
  var LIVE_SITE = "https://world-vitality.vercel.app/";
  var CHECK_TIMEOUT_MS = 10000;

  var opening = document.getElementById("opening");
  var offline = document.getElementById("offline");
  var retry = document.getElementById("retry");

  var requested = new URLSearchParams(window.location.search).get("app") || "";
  var allowed =
    /^https:\/\//.test(requested) || /^http:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(requested);
  var target = allowed ? requested : LIVE_SITE;

  function showOffline(isOffline) {
    opening.hidden = isOffline;
    offline.hidden = !isOffline;
    if (isOffline) retry.focus();
  }

  function check() {
    showOffline(false);
    var controller = new AbortController();
    var timer = setTimeout(function () {
      controller.abort();
    }, CHECK_TIMEOUT_MS);
    // "no-cors": we only need to know whether the site answered, not what it said.
    fetch(target, { mode: "no-cors", cache: "no-store", signal: controller.signal })
      .then(function () {
        clearTimeout(timer);
        window.location.replace(target);
      })
      .catch(function () {
        clearTimeout(timer);
        showOffline(true);
      });
  }

  retry.addEventListener("click", check);
  check();
})();
