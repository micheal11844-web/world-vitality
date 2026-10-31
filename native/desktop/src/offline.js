"use strict";

// "Try again" goes back to the address the app passed in, but only if it is
// an https address or one on this machine; anything else leaves the button
// pointing nowhere rather than somewhere unexpected.
(function () {
  var retry = document.getElementById("retry");
  var target = new URLSearchParams(window.location.search).get("retry") || "";
  var ok = /^https:\/\//.test(target) || /^http:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(target);
  if (ok) {
    retry.setAttribute("href", target);
  } else {
    retry.setAttribute("aria-disabled", "true");
  }
})();
