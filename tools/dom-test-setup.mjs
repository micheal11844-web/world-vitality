// Registers a jsdom global environment so React components can be
// rendered and tested with @testing-library/react under Node's built-in
// test runner (no browser, no Jest). Loaded via `node --test --import
// ./tools/dom-test-setup.mjs` — see the root package.json `test` script.
//
// Plain JS, not TS: this runs before any workspace package is built and
// isn't itself part of the workspace's type-checked build graph.

import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
});

global.window = dom.window;
global.document = dom.window.document;
Object.defineProperty(global, "navigator", {
  value: dom.window.navigator,
  writable: true,
  configurable: true,
});
global.HTMLElement = dom.window.HTMLElement;
global.Node = dom.window.Node;

// Required by React 18's test-utils act() environment detection.
global.IS_REACT_ACT_ENVIRONMENT = true;
