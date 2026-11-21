import { test } from "node:test";
import assert from "node:assert/strict";
import { useRef } from "react";
import { render, cleanup, waitFor, act } from "@testing-library/react";
import { AppShell } from "../AppShell.js";
import { needsKeyboardStop, useKeyboardScrollable } from "../useKeyboardScrollable.js";

/**
 * A scrolling region that holds nothing the keyboard can focus is one Tab stop; every other
 * region is left alone. jsdom lays nothing out, so how tall the region is, and how tall its
 * contents are, is stubbed on the element prototype.
 */

function stubScroll(scrollHeight: number, clientHeight: number) {
  Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
    configurable: true,
    get: () => scrollHeight,
  });
  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    configurable: true,
    get: () => clientHeight,
  });
}

test.afterEach(() => {
  delete (HTMLElement.prototype as { scrollHeight?: number }).scrollHeight;
  delete (HTMLElement.prototype as { clientHeight?: number }).clientHeight;
  cleanup();
});

function region(html: string): HTMLElement {
  const el = document.createElement("div");
  el.innerHTML = html;
  document.body.appendChild(el);
  return el;
}

test("a scrolling region with only text needs a Tab stop", () => {
  stubScroll(2000, 600);
  const el = region("<p>Nothing here to click.</p>");
  assert.equal(needsKeyboardStop(el), true);
  el.remove();
});

test("a region that does not scroll never needs one", () => {
  stubScroll(500, 600);
  const el = region("<p>Short page.</p>");
  assert.equal(needsKeyboardStop(el), false);
  el.remove();
});

test("a link, button, field or summary inside already gives the keyboard a way in", () => {
  stubScroll(2000, 600);
  for (const inner of [
    '<a href="/x">x</a>',
    "<button>go</button>",
    '<input type="text">',
    "<select><option>a</option></select>",
    "<textarea></textarea>",
    "<details><summary>more</summary>text</details>",
    '<span tabindex="0">x</span>',
  ]) {
    const el = region(`<p>text</p>${inner}`);
    assert.equal(needsKeyboardStop(el), false, inner);
    el.remove();
  }
});

test("things the keyboard cannot reach do not count", () => {
  stubScroll(2000, 600);
  for (const inner of [
    "<button disabled>off</button>",
    '<input type="hidden" value="x">',
    "<a>no href</a>",
    '<span tabindex="-1">only by script</span>',
    '<div hidden><a href="/x">hidden</a></div>',
    '<div inert><a href="/x">inert</a></div>',
  ]) {
    const el = region(`<p>text</p>${inner}`);
    assert.equal(needsKeyboardStop(el), true, inner);
    el.remove();
  }
});

function Harness({ html }: { html: string }) {
  const ref = useRef<HTMLElement>(null);
  const tabIndex = useKeyboardScrollable(ref);
  return (
    <section
      ref={ref}
      tabIndex={tabIndex}
      data-testid="r"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

test("the hook makes a text-only scroller one Tab stop", async () => {
  stubScroll(2000, 600);
  const { getByTestId } = render(<Harness html="<p>Only words.</p>" />);
  await waitFor(() => assert.equal(getByTestId("r").getAttribute("tabindex"), "0"));
});

test("the hook adds no Tab stop when there is something to focus, or nothing to scroll", async () => {
  stubScroll(2000, 600);
  const withLink = render(<Harness html='<a href="/x">x</a>' />);
  await new Promise((r) => setTimeout(r, 120));
  assert.equal(withLink.getByTestId("r").getAttribute("tabindex"), null);
  cleanup();
  stubScroll(300, 600);
  const short = render(<Harness html="<p>Short.</p>" />);
  await new Promise((r) => setTimeout(r, 120));
  assert.equal(short.getByTestId("r").getAttribute("tabindex"), null);
});

test("the hook follows the page: a link arriving removes the stop, and losing it brings it back", async () => {
  stubScroll(2000, 600);
  const { getByTestId } = render(<Harness html="<p>Words.</p>" />);
  const el = getByTestId("r");
  await waitFor(() => assert.equal(el.getAttribute("tabindex"), "0"));
  const link = document.createElement("a");
  link.href = "/later";
  link.textContent = "later";
  await act(async () => {
    el.appendChild(link);
    await new Promise((r) => setTimeout(r, 120));
  });
  await waitFor(() => assert.equal(el.getAttribute("tabindex"), null));
  await act(async () => {
    link.remove();
    await new Promise((r) => setTimeout(r, 120));
  });
  await waitFor(() => assert.equal(el.getAttribute("tabindex"), "0"));
});

function shell(children: React.ReactNode) {
  return render(
    <AppShell
      brand={<span>World Vitality</span>}
      sidebarSections={[]}
      aiPanelOpen={false}
      onToggleAiPanel={() => {}}
    >
      {children}
    </AppShell>,
  );
}

test("the app shell's main is a Tab stop on a text-only page, and not on a page with a link", async () => {
  stubScroll(2000, 600);
  const textOnly = shell(<p>Only words.</p>);
  await waitFor(() =>
    assert.equal(textOnly.container.querySelector("main")!.getAttribute("tabindex"), "0"),
  );
  cleanup();
  const withLink = shell(<a href="/x">x</a>);
  await new Promise((r) => setTimeout(r, 120));
  assert.equal(withLink.container.querySelector("main")!.getAttribute("tabindex"), null);
});
