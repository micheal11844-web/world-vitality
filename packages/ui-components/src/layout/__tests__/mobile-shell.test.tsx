import { test } from "node:test";
import { useState } from "react";
import assert from "node:assert/strict";
import { render, screen, fireEvent, cleanup, waitFor, within } from "@testing-library/react";
import { AppShell } from "../AppShell.js";
import { findMapHref, DEFAULT_MAP_HREF } from "../BottomNav.js";
import { COMPACT_MAX_WIDTH, MEDIUM_MAX_WIDTH, SHELL_CSS } from "../shell-styles.js";
import type { SidebarSection } from "../Sidebar.js";
import { DEFAULT_UI_STRINGS, UiStringsProvider } from "../../i18n/ui-strings.js";

/**
 * jsdom doesn't evaluate media queries, so by default these tests render
 * the *wide* layout: every compact-only control is `display: none`, which
 * also gives it an empty accessible name, so those are found by their DOM
 * hooks. For the phone layout, `phone()` does what a phone's browser
 * does — `matchMedia` says the compact query matches, and the real
 * `@media` rules from `shell-styles.ts` are applied (unwrapped) to the
 * document — so role/name queries then see exactly what a phone user
 * would, including the header's desktop-only links disappearing and the
 * closed drawer being unreachable.
 */

/** The rules inside one `@media (max-width: <width>) { … }` block, braces matched. */
function mediaRules(width: string): string {
  const marker = `@media (max-width: ${width}) {`;
  const at = SHELL_CSS.indexOf(marker);
  assert.ok(at >= 0, `no @media block for ${width}`);
  let depth = 0;
  for (let i = at + marker.length - 1; i < SHELL_CSS.length; i++) {
    if (SHELL_CSS[i] === "{") depth += 1;
    if (SHELL_CSS[i] === "}") {
      depth -= 1;
      if (depth === 0) return SHELL_CSS.slice(at + marker.length, i);
    }
  }
  throw new Error(`unterminated @media block for ${width}`);
}

const realFetch = globalThis.fetch;
type MatchMedia = typeof window.matchMedia | undefined;
const realMatchMedia: MatchMedia = window.matchMedia;

test.afterEach(() => {
  phoneActive = false;
  document.querySelectorAll("style[data-test-phone]").forEach((el) => el.remove());
  cleanup();
  window.localStorage.clear();
  globalThis.fetch = realFetch;
  (window as { matchMedia?: MatchMedia }).matchMedia = realMatchMedia;
});

let phoneActive = false;

/** Make this document behave like a phone-width browser (see the note above). */
function phone() {
  stubCompact(true);
  phoneActive = true;
}

/**
 * `render`, then — on a phone — append the media rules *after* the
 * shell's own stylesheet. In a real stylesheet the `@media` block comes
 * after the base rules it overrides; here it is a separate `<style>`, so
 * it must come later in the document to win the cascade the same way.
 */
function mount(ui: React.ReactElement) {
  const result = render(ui);
  if (phoneActive) {
    const style = document.createElement("style");
    style.setAttribute("data-test-phone", "");
    style.textContent = mediaRules(MEDIUM_MAX_WIDTH) + mediaRules(COMPACT_MAX_WIDTH);
    document.body.appendChild(style);
  }
  return result;
}

function stubCompact(matches: boolean) {
  if (!matches) {
    phoneActive = false;
    document.querySelectorAll("style[data-test-phone]").forEach((el) => el.remove());
  }
  (window as { matchMedia?: unknown }).matchMedia = (query: string) => ({
    matches,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  });
}

function stubSummary(body: unknown, counter?: { calls: number }) {
  globalThis.fetch = (async () => {
    if (counter) counter.calls += 1;
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;
}

const SECTIONS: SidebarSection[] = [
  {
    key: "primary",
    items: [
      { key: "home", label: "Home", href: "/dashboard" },
      {
        key: "weather",
        label: "Weather & Climate",
        href: "/workspaces/weather",
        active: true,
        children: [
          { key: "weather-home", label: "Current Conditions", href: "/workspaces/weather" },
          { key: "weather-map", label: "Map", href: "/workspaces/weather/map" },
        ],
      },
    ],
  },
];

function shell(props: Partial<React.ComponentProps<typeof AppShell>> = {}) {
  const onToggleAiPanel = props.onToggleAiPanel ?? (() => {});
  return mount(
    <AppShell
      brand={<span>World Vitality</span>}
      sidebarSections={SECTIONS}
      aiPanelOpen={false}
      showGuide={false}
      {...props}
      onToggleAiPanel={onToggleAiPanel}
    >
      <p>Page content</p>
    </AppShell>,
  );
}

const drawerOf = (container: HTMLElement) =>
  container.querySelector<HTMLElement>(".wv-shell-drawer")!;

// ---- the stylesheet's contract ----

test("the responsive stylesheet never uses the `screen` media type, so tests render the wide layout", () => {
  assert.doesNotMatch(SHELL_CSS, /@media[^{]*\bscreen\b/i);
});

test("compact-only controls are hidden by default and only a media query reveals them", () => {
  const baseRule = SHELL_CSS.split("@media")[0]!;
  for (const cls of [".wv-shell-menu-btn", ".wv-shell-bottomnav", ".wv-shell-scrim"]) {
    assert.ok(baseRule.includes(cls), `${cls} should be listed in the always-hidden base rule`);
  }
  assert.match(baseRule, /display:\s*none/);
  assert.match(mediaRules(COMPACT_MAX_WIDTH), /\.wv-shell-bottomnav\s*\{[^}]*display:\s*flex/);
});

test("on a wide screen none of the phone-only controls are reachable", () => {
  shell();
  for (const selector of [".wv-shell-menu-btn", ".wv-shell-search-btn", ".wv-shell-bottomnav"]) {
    const el = document.querySelector<HTMLElement>(selector)!;
    assert.equal(window.getComputedStyle(el).display, "none", `${selector} must be display:none`);
  }
});

// ---- the bottom bar ----

test("findMapHref picks the open workspace's map, else the public Explorer", () => {
  assert.equal(findMapHref(SECTIONS), "/workspaces/weather/map");
  const noneOpen: SidebarSection[] = [
    {
      key: "p",
      items: [
        {
          key: "weather",
          label: "Weather",
          href: "/workspaces/weather",
          children: [{ key: "weather-map", label: "Map", href: "/workspaces/weather/map" }],
        },
      ],
    },
  ];
  assert.equal(findMapHref(noneOpen), DEFAULT_MAP_HREF);
  assert.equal(findMapHref([]), "/explore");
});

test("the bottom bar offers Home, Map, Alerts and AI, in a named navigation", () => {
  stubSummary({ signedIn: true, unread: 0, criticalUnread: 0 });
  phone();
  shell();
  const bar = screen.getByRole("navigation", { name: "Quick navigation" });
  const hrefs = Array.from(bar.querySelectorAll("a")).map((a) => a.getAttribute("href"));
  assert.deepEqual(hrefs, ["/dashboard", "/workspaces/weather/map", "/notifications"]);
  assert.ok(bar.querySelector("button"));
  assert.equal(bar.textContent?.replace(/\s+/g, ""), "HomeMapAlertsAI");
});

test("an anonymous page (the public Explorer) gets Home → '/', no Alerts tab, and no account links in the drawer", () => {
  shell({ showAccountMenu: false });
  const bar = document.querySelector(".wv-shell-bottomnav")!;
  const links = Array.from(bar.querySelectorAll("a")).map((a) => a.getAttribute("href"));
  assert.deepEqual(links, ["/", "/workspaces/weather/map"]);
  const foot = document.querySelector(".wv-shell-drawer-foot")!;
  assert.ok(foot.querySelector("form") === null);
  assert.ok(foot.querySelector("a[href='/settings']") === null);
  assert.ok(foot.querySelector("a[href='/globe']"));
});

test("the Alerts tab shows the unread count from the one shared fetch", async () => {
  const counter = { calls: 0 };
  stubSummary({ signedIn: true, unread: 3, criticalUnread: 0 }, counter);
  phone();
  shell();
  const tab = await screen.findByRole("link", { name: "Alerts, 3 unread" });
  assert.equal(tab.getAttribute("href"), "/notifications");
  assert.equal(screen.getByTestId("bottomnav-badge").textContent, "3");
  // The header bell carries the same count from the same request — it is
  // simply not shown at phone width (the tab replaces it).
  // (jsdom can't weigh `!important` against an inline style, so check the
  // class that the compact rules hide, and that those rules do hide it.)
  const bell = document.querySelector("header a[aria-label='Notifications, 3 unread']")!;
  assert.ok(bell.classList.contains("wv-desktop-only"));
  assert.match(
    mediaRules(COMPACT_MAX_WIDTH),
    /\.wv-desktop-only\s*\{\s*display:\s*none\s*!important/,
  );
  assert.equal(counter.calls, 1, "bell and Alerts tab must share one request");
});

test("on a wide screen the header bell shows and the Alerts tab is out of reach", async () => {
  stubSummary({ signedIn: true, unread: 3, criticalUnread: 0 });
  shell();
  assert.ok(await screen.findByRole("link", { name: "Notifications, 3 unread" }));
  const bar = document.querySelector<HTMLElement>(".wv-shell-bottomnav")!;
  assert.equal(window.getComputedStyle(bar).display, "none");
});

test("an unread critical alert gets the reserved look on the tab and is spelled out", async () => {
  stubSummary({ signedIn: true, unread: 4, criticalUnread: 2 });
  phone();
  shell();
  const tab = await screen.findByRole("link", { name: "Alerts, 4 unread, 2 critical" });
  assert.equal(tab.getAttribute("data-critical"), "true");
  assert.match(screen.getByTestId("bottomnav-badge").textContent ?? "", /^!4$/);
});

test("a signed-out visitor never sees an Alerts tab", async () => {
  stubSummary({ signedIn: false });
  shell();
  await waitFor(() =>
    assert.ok(
      document.querySelector(".wv-shell-bottomnav a[href='/notifications']") === null,
      "Alerts tab should disappear once the server says there is no session",
    ),
  );
});

test("the AI tab toggles the panel and reports whether it is open", () => {
  let toggles = 0;
  phone();
  const props = {
    brand: <span>World Vitality</span>,
    sidebarSections: SECTIONS,
    showGuide: false,
  };
  const { rerender } = mount(
    <AppShell {...props} aiPanelOpen={false} onToggleAiPanel={() => (toggles += 1)}>
      <p>Page content</p>
    </AppShell>,
  );
  const tab = screen.getByRole("button", { name: "AI" });
  assert.equal(tab.getAttribute("aria-pressed"), "false");
  fireEvent.click(tab);
  assert.equal(toggles, 1);
  rerender(
    <AppShell {...props} aiPanelOpen={true} onToggleAiPanel={() => (toggles += 1)}>
      <p>Page content</p>
    </AppShell>,
  );
  assert.equal(screen.getByRole("button", { name: "AI" }).getAttribute("aria-pressed"), "true");
});

// ---- the drawer ----

test("the closed drawer is out of the keyboard and screen-reader order on a phone; open, it is back", () => {
  phone();
  const { container } = shell();
  const drawer = drawerOf(container);
  // `visibility: hidden` removes the whole subtree from tab order and the
  // accessibility tree (jsdom can't inherit it down to the links, so the
  // drawer's own computed value is what is checked).
  assert.equal(window.getComputedStyle(drawer).visibility, "hidden");
  fireEvent.click(screen.getByRole("button", { name: "Menu" }));
  assert.equal(drawer.getAttribute("data-open"), "true");
  assert.equal(window.getComputedStyle(drawer).visibility, "visible");
  assert.ok(within(drawer).getByRole("navigation", { name: "Primary" }));
  assert.ok(within(drawer).getByRole("link", { name: "Home" }));
});

test("the menu button opens the drawer, moves focus into it, and closing returns focus", () => {
  phone();
  const { container } = shell();
  const drawer = drawerOf(container);
  const menu = screen.getByRole("button", { name: "Menu" });
  assert.equal(drawer.getAttribute("data-open"), "false");
  assert.equal(menu.getAttribute("aria-expanded"), "false");

  fireEvent.click(menu);
  assert.equal(drawer.getAttribute("data-open"), "true");
  assert.equal(menu.getAttribute("aria-expanded"), "true");
  assert.equal(menu.getAttribute("aria-controls"), drawer.id);
  const close = screen.getByRole("button", { name: "Close menu" });
  assert.ok(document.activeElement === close, "focus should move to the close button");

  fireEvent.click(close);
  assert.equal(drawer.getAttribute("data-open"), "false");
  assert.ok(document.activeElement === menu, "focus should return to the menu button");
});

test("tapping the dimmed page, or a link in the drawer, closes it", () => {
  phone();
  const { container } = shell();
  const drawer = drawerOf(container);
  fireEvent.click(screen.getByRole("button", { name: "Menu" }));
  assert.equal(drawer.getAttribute("data-open"), "true");

  fireEvent.click(container.querySelector(".wv-shell-scrim--drawer")!);
  assert.equal(drawer.getAttribute("data-open"), "false");
  assert.ok(container.querySelector(".wv-shell-scrim--drawer") === null);

  fireEvent.click(screen.getByRole("button", { name: "Menu" }));
  const link = drawer.querySelector("nav a")!;
  link.addEventListener("click", (e) => e.preventDefault()); // don't navigate jsdom
  fireEvent.click(link);
  assert.equal(drawer.getAttribute("data-open"), "false");
});

test("while the drawer is open the page behind it is inert", () => {
  phone();
  const { container } = shell();
  const main = container.querySelector("main")!;
  assert.equal(main.hasAttribute("inert"), false);
  fireEvent.click(screen.getByRole("button", { name: "Menu" }));
  assert.equal(main.hasAttribute("inert"), true);
  assert.equal(container.querySelector("header")!.parentElement!.hasAttribute("inert"), true);
  assert.equal(
    container.querySelector(".wv-shell-bottomnav")!.parentElement!.hasAttribute("inert"),
    true,
  );
  fireEvent.click(screen.getByRole("button", { name: "Close menu" }));
  assert.equal(main.hasAttribute("inert"), false);
});

test("Escape closes the drawer on a phone, then the search row, then the AI sheet — one layer per press", () => {
  phone();
  let aiToggles = 0;
  const props = {
    brand: <span>World Vitality</span>,
    sidebarSections: SECTIONS,
    onToggleAiPanel: () => (aiToggles += 1),
    showGuide: false,
  };
  const { container, rerender } = mount(
    <AppShell {...props} aiPanelOpen={false}>
      <p>Page content</p>
    </AppShell>,
  );
  // The page opens the AI sheet after load (it stays open until closed).
  rerender(
    <AppShell {...props} aiPanelOpen={true}>
      <p>Page content</p>
    </AppShell>,
  );
  const drawer = drawerOf(container);
  const search = container.querySelector<HTMLElement>(".wv-shell-search")!;

  fireEvent.click(screen.getByRole("button", { name: "Search" }));
  assert.equal(search.getAttribute("data-open"), "true");
  fireEvent.click(screen.getByRole("button", { name: "Menu" }));
  assert.equal(drawer.getAttribute("data-open"), "true");

  fireEvent.keyDown(window, { key: "Escape" });
  assert.equal(drawer.getAttribute("data-open"), "false");
  assert.equal(search.getAttribute("data-open"), "true");
  assert.equal(aiToggles, 0);

  fireEvent.keyDown(window, { key: "Escape" });
  assert.equal(search.getAttribute("data-open"), "false");
  assert.equal(aiToggles, 0);

  fireEvent.keyDown(window, { key: "Escape" });
  assert.equal(aiToggles, 1);
});

test("an Escape a widget already used (the search box closing its list) is left alone", () => {
  phone();
  const { container } = shell();
  const drawer = drawerOf(container);
  fireEvent.click(screen.getByRole("button", { name: "Menu" }));
  const swallow = (e: Event) => e.preventDefault();
  document.addEventListener("keydown", swallow);
  fireEvent.keyDown(document.body, { key: "Escape" });
  document.removeEventListener("keydown", swallow);
  assert.equal(drawer.getAttribute("data-open"), "true");
});

test("on a wide screen Escape does nothing to the AI panel", () => {
  stubCompact(false);
  let aiToggles = 0;
  shell({ aiPanelOpen: true, onToggleAiPanel: () => (aiToggles += 1) });
  fireEvent.keyDown(window, { key: "Escape" });
  assert.equal(aiToggles, 0);
});

test("Ctrl+B opens the drawer on a phone but collapses the icon rail on a wide screen", () => {
  phone();
  const narrow = shell();
  fireEvent.keyDown(window, { key: "b", ctrlKey: true });
  assert.equal(drawerOf(narrow.container).getAttribute("data-open"), "true");
  assert.equal(
    window.localStorage.getItem("wv-sidebar-collapsed"),
    null,
    "must not persist a rail collapse",
  );
  cleanup();

  stubCompact(false);
  shell();
  fireEvent.keyDown(window, { key: "b", ctrlKey: true });
  assert.equal(window.localStorage.getItem("wv-sidebar-collapsed"), "true");
});

test("a saved 'collapsed' rail never leaves the phone drawer showing icons only", async () => {
  window.localStorage.setItem("wv-sidebar-collapsed", "true");
  stubCompact(true);
  const { container } = shell();
  await waitFor(() =>
    assert.ok(drawerOf(container).querySelector("nav a")?.textContent?.includes("Home")),
  );

  cleanup();
  stubCompact(false);
  const wide = shell();
  await waitFor(() =>
    assert.ok(!wide.container.querySelector("nav a")?.textContent?.includes("Home")),
  );
});

test("growing past the phone width drops an open drawer and search row", async () => {
  let compactNow = true;
  const listeners = new Set<() => void>();
  (window as { matchMedia?: unknown }).matchMedia = (query: string) => ({
    get matches() {
      return compactNow;
    },
    media: query,
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  });
  const { container } = shell();
  const search = container.querySelector<HTMLElement>(".wv-shell-search")!;
  fireEvent.click(container.querySelector(".wv-shell-menu-btn")!);
  fireEvent.click(container.querySelector(".wv-shell-search-btn")!);
  assert.equal(drawerOf(container).getAttribute("data-open"), "true");
  assert.equal(search.getAttribute("data-open"), "true");
  compactNow = false;
  listeners.forEach((fn) => fn());
  await waitFor(() => assert.equal(drawerOf(container).getAttribute("data-open"), "false"));
  assert.equal(search.getAttribute("data-open"), "false");
});

test("the AI sheet takes focus when it opens on a phone and gives it back to the AI tab", () => {
  phone();
  const props = {
    brand: <span>World Vitality</span>,
    sidebarSections: SECTIONS,
    onToggleAiPanel: () => {},
    showGuide: false,
  };
  const { rerender } = mount(
    <AppShell {...props} aiPanelOpen={false}>
      <p>Page content</p>
    </AppShell>,
  );
  screen.getByRole("button", { name: "AI" }).focus();
  rerender(
    <AppShell {...props} aiPanelOpen={true}>
      <p>Page content</p>
    </AppShell>,
  );
  const sheet = screen.getByRole("complementary", { name: "AI assistant" });
  assert.ok(document.activeElement === sheet, "focus moves into the sheet");
  assert.equal(
    document.querySelector("main")!.hasAttribute("inert"),
    true,
    "page behind the sheet is inert",
  );
  rerender(
    <AppShell {...props} aiPanelOpen={false}>
      <p>Page content</p>
    </AppShell>,
  );
  assert.ok(
    document.activeElement === screen.getByRole("button", { name: "AI" }),
    "focus returns to the AI tab",
  );
  assert.equal(document.querySelector("main")!.hasAttribute("inert"), false);
});

test("the search row opens from the magnifier and puts the cursor in the box", () => {
  phone();
  const { container } = shell();
  const toggle = screen.getByRole("button", { name: "Search" });
  assert.equal(toggle.getAttribute("aria-expanded"), "false");
  fireEvent.click(toggle);
  assert.equal(toggle.getAttribute("aria-expanded"), "true");
  assert.equal(
    container.querySelector(".wv-shell-search")!.id,
    toggle.getAttribute("aria-controls"),
  );
  assert.ok(document.activeElement === screen.getByRole("combobox"));
});

// ---- language and direction ----

test("the new controls speak the host's language, and the drawer slides toward the reading-start edge", () => {
  phone();
  const RTL = {
    ...DEFAULT_UI_STRINGS,
    dir: "rtl" as const,
    nav: {
      menu: "القائمة",
      closeMenu: "إغلاق القائمة",
      quickNav: "تنقّل سريع",
      home: "الرئيسية",
      map: "الخريطة",
      alerts: "التنبيهات",
      search: "بحث",
      ai: "المساعد",
    },
  };
  const { container } = mount(
    <UiStringsProvider value={RTL}>
      <AppShell
        brand={<span>wv</span>}
        sidebarSections={SECTIONS}
        aiPanelOpen={false}
        onToggleAiPanel={() => {}}
        showGuide={false}
      >
        <p>x</p>
      </AppShell>
    </UiStringsProvider>,
  );
  assert.ok(screen.getByRole("button", { name: "القائمة" }));
  assert.ok(screen.getByRole("navigation", { name: "تنقّل سريع" }));
  assert.ok(screen.getByRole("button", { name: "المساعد" }));
  assert.ok(screen.getByRole("button", { name: "بحث" }));
  const root = container.querySelector<HTMLElement>(".wv-shell-root")!;
  assert.equal(root.style.getPropertyValue("--wv-shell-off"), "1");
});

test("in left-to-right the drawer slides off to the left", () => {
  const { container } = shell();
  assert.equal(
    container
      .querySelector<HTMLElement>(".wv-shell-root")!
      .style.getPropertyValue("--wv-shell-off"),
    "-1",
  );
});

// ---- a panel the page opens by default ----

test("a panel the page docks open on a desktop is closed when the page loads at phone width", () => {
  phone();
  let toggles = 0;
  const { container } = shell({ aiPanelOpen: true, onToggleAiPanel: () => (toggles += 1) });
  assert.equal(toggles, 1, "it asks the page to close the panel exactly once");
  assert.equal(
    container.querySelector(".wv-shell-root")!.getAttribute("data-mounted"),
    "true",
    "the stylesheet hides the floating panel until this has run",
  );
});

/** A page that owns its panel's open/closed state, as the workspace pages do. */
function Page({ initiallyOpen }: { initiallyOpen: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <AppShell
      brand={<span>World Vitality</span>}
      sidebarSections={SECTIONS}
      aiPanelOpen={open}
      onToggleAiPanel={() => setOpen((o) => !o)}
      showGuide={false}
    >
      <p>Page content</p>
    </AppShell>
  );
}

test("closing a docked-open panel for the phone layout does not move focus (a page never grabs it by loading)", () => {
  phone();
  mount(<Page initiallyOpen={true} />);
  assert.ok(
    screen.queryByRole("complementary", { name: "AI assistant" }) === null,
    "the panel is closed",
  );
  assert.ok(
    document.activeElement === document.body,
    "focus is where it was — nowhere, not the AI tab",
  );
});

test("a close the person makes still returns focus to the AI tab, after the shell's own close", () => {
  phone();
  mount(<Page initiallyOpen={true} />);
  fireEvent.click(screen.getByRole("button", { name: "AI" })); // open it
  assert.ok(document.activeElement === screen.getByRole("complementary", { name: "AI assistant" }));
  fireEvent.keyDown(window, { key: "Escape" }); // and close it
  assert.ok(
    document.activeElement === screen.getByRole("button", { name: "AI" }),
    "the shell's earlier automatic close doesn't excuse this one",
  );
});

test("it does the same at tablet width, where the panel also floats over the page", () => {
  // Only the wider (64rem) query matches: a tablet, not a phone.
  (window as { matchMedia?: unknown }).matchMedia = (query: string) => ({
    matches: query.includes("64rem"),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  });
  let toggles = 0;
  shell({ aiPanelOpen: true, onToggleAiPanel: () => (toggles += 1) });
  assert.equal(toggles, 1);
});

test("on a wide screen a panel the page opens is left docked open", () => {
  stubCompact(false);
  let toggles = 0;
  shell({ aiPanelOpen: true, onToggleAiPanel: () => (toggles += 1) });
  assert.equal(toggles, 0);
});

test("until the script has run, the floating panel and its backdrop are hidden by the stylesheet", () => {
  const rules = mediaRules(MEDIUM_MAX_WIDTH);
  assert.match(
    rules,
    /\[data-mounted="false"\][^{]*\.wv-shell-ai aside[^{]*\{[^}]*display:\s*none\s*!important/,
  );
  assert.match(rules, /\[data-mounted="false"\][^{]*\.wv-shell-scrim--ai/);
});
