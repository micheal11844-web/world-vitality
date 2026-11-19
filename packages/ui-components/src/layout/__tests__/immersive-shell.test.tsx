import { test } from "node:test";
import assert from "node:assert/strict";
import { render, screen, cleanup } from "@testing-library/react";
import { AppShell } from "../AppShell.js";
import { SHELL_CSS } from "../shell-styles.js";
import type { SidebarSection } from "../Sidebar.js";

/**
 * `immersive` gives a page the whole screen (the Globe, once its 3D view has
 * drawn). The chrome around the page is taken out with `display: none`, not
 * covered, so it also leaves the keyboard and screen-reader order. jsdom does
 * apply the shell's own stylesheet, so role queries see what a person would.
 */

test.afterEach(() => cleanup());

const SECTIONS: SidebarSection[] = [
  { key: "primary", items: [{ key: "home", label: "Home", href: "/dashboard" }] },
];

function shell(immersive?: boolean) {
  return render(
    <AppShell
      brand={<span>World Vitality</span>}
      sidebarSections={SECTIONS}
      aiPanelOpen={false}
      onToggleAiPanel={() => {}}
      showAccountMenu={false}
      immersive={immersive}
    >
      <p>Page content</p>
    </AppShell>,
  );
}

test("by default the shell is not immersive and keeps its header and menu", () => {
  const { container } = shell();
  const root = container.querySelector<HTMLElement>(".wv-shell-root")!;
  assert.equal(root.getAttribute("data-immersive"), "false");
  assert.ok(screen.queryByRole("banner"), "the header is there");
  assert.ok(screen.queryByRole("link", { name: "Home" }), "the menu is there");
  assert.ok(screen.getByText("Page content"));
});

test("immersive takes the header and the bottom bar out of the page, and keeps the content", () => {
  const { container } = shell(true);
  const root = container.querySelector<HTMLElement>(".wv-shell-root")!;
  assert.equal(root.getAttribute("data-immersive"), "true");
  // Gone from the accessibility tree and the tab order, not just painted over.
  // (`=== null` rather than `assert.equal(el, null)`: a failed comparison of a DOM node
  // makes node print the whole jsdom graph, which can exhaust memory.)
  assert.ok(screen.queryByRole("banner") === null, "the header is gone");
  assert.ok(screen.getByText("Page content"), "the page itself stays");
  const chrome = [...container.querySelectorAll<HTMLElement>("[data-app-shell-chrome]")];
  assert.ok(chrome.length >= 3, "header, drawer and AI wrapper carry the chrome marker");
  const header = chrome.find((el) => el.querySelector("header"));
  const bottom = chrome.find((el) => el.classList.contains("wv-shell-bottomnav"));
  assert.ok(header && bottom, "the header wrapper and the bottom bar are marked as chrome");
  assert.equal(window.getComputedStyle(header).display, "none");
  assert.equal(window.getComputedStyle(bottom).display, "none");
  // The drawer and AI wrappers also carry the marker. Their own inline `display: flex` is
  // beaten by the stylesheet's `!important` in a real browser (jsdom ignores that precedence,
  // so it can't show it here); the browser check of the Globe page confirms it.
  assert.ok(chrome.some((el) => el.classList.contains("wv-shell-drawer")));
  assert.ok(chrome.some((el) => el.classList.contains("wv-shell-ai")));
});

test("the stylesheet's immersive rules take away the page padding and the guide, and beat the phone rules", () => {
  assert.match(
    SHELL_CSS,
    /\.wv-shell-root\[data-immersive="true"\] \[data-app-shell-chrome\],\s*\.wv-shell-root\[data-immersive="true"\] \.wv-shell-guide \{ display: none !important; \}/,
  );
  const rule = SHELL_CSS.match(
    /\.wv-shell-root\[data-immersive="true"\] \.wv-shell-main \{([^}]*)\}/,
  );
  assert.ok(rule, "an immersive rule for the page area exists");
  assert.match(rule[1]!, /padding:\s*0/);
  // More specific than `.wv-shell-main { padding }` inside the phone media block, so it wins there too.
  assert.ok(
    SHELL_CSS.indexOf('.wv-shell-root[data-immersive="true"] .wv-shell-main') <
      SHELL_CSS.indexOf("@media (max-width"),
  );
});
