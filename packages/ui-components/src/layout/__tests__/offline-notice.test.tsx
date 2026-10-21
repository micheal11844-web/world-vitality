import { test } from "node:test";
import assert from "node:assert/strict";
import { render, screen, cleanup, act } from "@testing-library/react";
import { AppShell } from "../AppShell.js";
import { OfflineNotice, SAVED_COPY_META } from "../OfflineNotice.js";
import { DEFAULT_UI_STRINGS, UiStringsProvider, type UiStrings } from "../../i18n/ui-strings.js";

const realFetch = globalThis.fetch;

function setOnline(value: boolean) {
  Object.defineProperty(window.navigator, "onLine", { value, configurable: true });
}

function addSavedCopyTag(content: string) {
  const meta = document.createElement("meta");
  meta.setAttribute("name", SAVED_COPY_META);
  meta.setAttribute("content", content);
  document.head.appendChild(meta);
}

test.afterEach(() => {
  cleanup();
  document.head.querySelectorAll(`meta[name="${SAVED_COPY_META}"]`).forEach((m) => m.remove());
  setOnline(true);
  globalThis.fetch = realFetch;
});

const hoursAgo = (h: number) => new Date(Date.now() - h * 60 * 60 * 1000).toISOString();

test("a normal, connected page shows nothing", () => {
  render(<OfflineNotice />);
  assert.ok(screen.queryByTestId("offline-notice") === null);
});

test("a page served from a saved copy says so, and how old it is", () => {
  addSavedCopyTag(hoursAgo(2));
  render(<OfflineNotice />);
  const notice = screen.getByRole("status");
  assert.match(notice.textContent ?? "", /copy you last opened, saved 2 hours ago/);
});

test("once the connection is back, a saved copy offers Reload (it stays old until reloaded)", () => {
  addSavedCopyTag(hoursAgo(1));
  render(<OfflineNotice />);
  assert.ok(screen.getByRole("button", { name: "Reload" }));
});

test("with no connection there is nothing to reload yet", () => {
  setOnline(false);
  addSavedCopyTag(hoursAgo(1));
  render(<OfflineNotice />);
  assert.match(screen.getByRole("status").textContent ?? "", /saved 1 hour ago/);
  assert.ok(screen.queryByRole("button", { name: "Reload" }) === null);
});

test("a live page notices the connection dropping, and coming back", () => {
  render(<OfflineNotice />);
  assert.ok(screen.queryByRole("status") === null);

  act(() => {
    setOnline(false);
    window.dispatchEvent(new window.Event("offline"));
  });
  assert.match(screen.getByRole("status").textContent ?? "", /You’re offline/);

  act(() => {
    setOnline(true);
    window.dispatchEvent(new window.Event("online"));
  });
  assert.ok(screen.queryByRole("status") === null);
});

test("a page that loads while already offline says so right away", () => {
  setOnline(false);
  render(<OfflineNotice />);
  assert.match(screen.getByRole("status").textContent ?? "", /You’re offline/);
});

test("a saved-copy tag with an unreadable time never claims an age", () => {
  addSavedCopyTag("not a time");
  render(<OfflineNotice />);
  assert.ok(screen.queryByRole("status") === null, "connected: nothing to say");
  cleanup();
  setOnline(false);
  render(<OfflineNotice />);
  assert.match(screen.getByRole("status").textContent ?? "", /You’re offline/);
  assert.ok(!/saved/.test(screen.getByRole("status").textContent ?? ""));
});

test("it uses the reader's language and its own time formatting", () => {
  const strings: UiStrings = {
    ...DEFAULT_UI_STRINGS,
    formatRelativeTime: (iso) => `HACE(${iso.slice(0, 4)})`,
    offline: {
      offline: "SIN-RED",
      savedCopy: (ago) => `COPIA ${ago}`,
      reload: "RECARGAR",
    },
  };
  addSavedCopyTag("2026-10-18T08:00:00.000Z");
  render(
    <UiStringsProvider value={strings}>
      <OfflineNotice />
    </UiStringsProvider>,
  );
  assert.equal(screen.getByRole("status").textContent, "COPIA HACE(2026)RECARGAR");
});

test("it is not red: critical colours are reserved for life-safety alerts", () => {
  setOnline(false);
  render(<OfflineNotice />);
  const style = screen.getByRole("status").getAttribute("style") ?? "";
  assert.ok(!/critical/.test(style));
});

test("the app shell shows it above the page content", () => {
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ signedIn: false }), {
      status: 200,
      headers: { "content-type": "application/json" },
    })) as typeof fetch;
  addSavedCopyTag(hoursAgo(3));
  render(
    <AppShell
      brand={<span>brand</span>}
      sidebarSections={[]}
      aiPanelOpen={false}
      onToggleAiPanel={() => {}}
      showGuide={false}
    >
      <p>content</p>
    </AppShell>,
  );
  const main = screen.getByRole("main");
  const notice = screen.getByTestId("offline-notice");
  assert.ok(main.contains(notice));
  assert.ok(
    notice.compareDocumentPosition(screen.getByText("content")) & Node.DOCUMENT_POSITION_FOLLOWING,
    "notice comes before the content",
  );
});
