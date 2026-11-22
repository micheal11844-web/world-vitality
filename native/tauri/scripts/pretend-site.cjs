"use strict";

// A stand-in for the live site, for smoke-test.sh: answers every request with a
// tiny page and writes the browser identity (user agent) of each request to a
// file, so the test can see that the app opened, reached the site and said who
// it is. Usage: node pretend-site.cjs <port> <file>
const http = require("node:http");
const fs = require("node:fs");

const [port, file] = [Number(process.argv[2]), process.argv[3]];
if (!port || !file) {
  console.error("usage: node pretend-site.cjs <port> <file>");
  process.exit(2);
}

http
  .createServer((req, res) => {
    fs.appendFileSync(file, `${req.url} ${req.headers["user-agent"] || ""}\n`);
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end("<!doctype html><title>pretend site</title><p>ok</p>");
  })
  .listen(port, "127.0.0.1");
