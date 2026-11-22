"use strict";

// A stand-in for the live site, for smoke-test.sh. It does two jobs:
//
//   1. Writes the address and browser identity (user agent) of every request to
//      a file, so the test can see that the app opened, reached the site and
//      said who it is.
//   2. Serves a small page that tries a few things inside the app's window and
//      posts what happened back to /report (appended to a second file, one JSON
//      object per line): is WebGL there, is a `file:` address refused, can the
//      site make a download, does a link to the site's own address open here.
//
// Usage: node pretend-site.cjs <port> <requests file> <report file>
const http = require("node:http");
const fs = require("node:fs");

const [port, requestsFile, reportFile] = [
  Number(process.argv[2]),
  process.argv[3],
  process.argv[4],
];
if (!port || !requestsFile || !reportFile) {
  console.error("usage: node pretend-site.cjs <port> <requests file> <report file>");
  process.exit(2);
}

const FIRST_PAGE = `<!doctype html>
<meta charset="utf-8">
<title>pretend site</title>
<p>ok</p>
<script>
(async function () {
  var wait = function (ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); };
  var report = function (data) {
    return fetch("/report", { method: "POST", body: JSON.stringify(data) }).catch(function () {});
  };
  var canvas = function () { return document.createElement("canvas"); };
  var result = {
    stage: "first",
    userAgent: navigator.userAgent,
    webgl: !!canvas().getContext("webgl"),
    webgl2: !!canvas().getContext("webgl2"),
    serviceWorker: "serviceWorker" in navigator,
    localStorage: (function () {
      try { localStorage.setItem("t", "1"); return localStorage.getItem("t") === "1"; } catch (e) { return false; }
    })(),
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight
  };

  // An address the app must refuse: the page has to still be here afterwards.
  var before = location.href;
  location.href = "file:///etc/passwd";
  await wait(1500);
  result.fileAddressRefused = location.href === before;

  // A download the site makes itself (the CSV and lesson-plan exports work this way).
  result.downloadName = "wv-smoke-" + Date.now() + ".csv";
  var link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob(["a,b\\n1,2\\n"], { type: "text/csv" }));
  link.download = result.downloadName;
  document.body.appendChild(link);
  link.click();
  await wait(1000);

  await report(result);
  location.href = "/opener";
})();
</script>`;

// Opens a window onto the site's own address while the page is loading (the one
// moment a page may open a window without a click).
const OPENER_PAGE = `<!doctype html>
<meta charset="utf-8">
<title>opener</title>
<script>
  window.open("/second", "_blank");
</script>`;

const SECOND_PAGE = `<!doctype html>
<meta charset="utf-8">
<title>second</title>
<script>
  fetch("/report", { method: "POST", body: JSON.stringify({ stage: "second", openedHere: true }) });
</script>`;

http
  .createServer((req, res) => {
    if (req.method === "POST" && req.url === "/report") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        fs.appendFileSync(reportFile, `${body}\n`);
        res.writeHead(204);
        res.end();
      });
      return;
    }
    fs.appendFileSync(requestsFile, `${req.url} ${req.headers["user-agent"] || ""}\n`);
    const pages = { "/": FIRST_PAGE, "/opener": OPENER_PAGE, "/second": SECOND_PAGE };
    const page = pages[req.url.split("?")[0]];
    if (!page) {
      res.writeHead(204);
      return res.end();
    }
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(page);
  })
  .listen(port, "127.0.0.1");
