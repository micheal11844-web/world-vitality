import { test } from "node:test";
import assert from "node:assert/strict";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import { AppShell } from "../../layout/AppShell.js";
import { AIPanel } from "../../layout/AIPanel.js";
import { Sidebar } from "../../layout/Sidebar.js";
import { NotificationBell } from "../../notifications/NotificationBell.js";
import { GuideTutorial } from "../../components/GuideTutorial.js";
import { DEFAULT_UI_STRINGS, UiStringsProvider, type UiStrings } from "../ui-strings.js";

const realFetch = globalThis.fetch;

test.afterEach(() => {
  cleanup();
  window.localStorage.clear();
  globalThis.fetch = realFetch;
});

function stubSummary(body: unknown) {
  globalThis.fetch = (async () =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    })) as typeof fetch;
}

/** A recognisable fake language, so a test can tell "translated" from "English default". */
const FAKE: UiStrings = {
  dir: "ltr",
  locale: "xx",
  listSeparator: " / ",
  formatNumber: (n) => `#${n}`,
  formatRelativeTime: (iso) => `HACE(${iso})`,
  viewGlobe: "VER-GLOBO",
  settings: "AJUSTES",
  signOut: "SALIR",
  sidebar: {
    primary: "PRINCIPAL",
    expand: "EXPANDIR-BARRA",
    collapse: "CONTRAER-BARRA",
    expandItem: (item) => `EXPANDIR ${item}`,
    collapseItem: (item) => `CONTRAER ${item}`,
  },
  aiPanel: { open: "ABRIR-IA", collapse: "CERRAR-IA", region: "ASISTENTE-IA", title: "ASISTENTE" },
  search: {
    label: "BUSCAR-WV",
    placeholder: "BUSCA-AQUI",
    hint: "BUSCAR-HINT",
    suggestions: "SUGERENCIAS",
    noQuickMatches: (q) => `NADA ${q}`,
    pressEnter: (q) => `ENTER ${q}`,
    kind: {
      workspace: "ESPACIO",
      page: "PAGINA",
      setting: "AJUSTE",
      tool: "HERRAMIENTA",
      place: "LUGAR",
    },
  },
  bell: {
    label: "NOTIFS",
    unread: (n) => `${n} SIN-LEER`,
    critical: (n) => `${n} CRITICAS`,
  },
  tutorial: {
    step: (current, total) => `PASO ${current}/${total}`,
    skip: "OMITIR",
    back: "ATRAS",
    next: "SIGUIENTE",
    getStarted: "EMPEZAR",
  },
  nav: {
    menu: "MENU-X",
    closeMenu: "CERRAR-MENU-X",
    quickNav: "NAV-RAPIDA-X",
    home: "INICIO-X",
    map: "MAPA-X",
    alerts: "ALERTAS-X",
    search: "BUSCAR-X",
    ai: "IA-X",
  },
  offline: {
    offline: "SIN-RED-X",
    savedCopy: (ago) => `COPIA-GUARDADA-X ${ago}`,
    reload: "RECARGAR-X",
  },
};

test("without a provider the chrome is English (the default every other test relies on)", () => {
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
  assert.ok(screen.getByRole("link", { name: /View the Globe/ }));
  assert.ok(screen.getByRole("link", { name: "Settings" }));
  assert.ok(screen.getByRole("button", { name: "Sign out" }));
  assert.ok(screen.getByRole("combobox", { name: "Search World Vitality" }));
});

test("a provider translates every shared piece of chrome", () => {
  stubSummary({ signedIn: true, unread: 0, criticalUnread: 0 });
  render(
    <UiStringsProvider value={FAKE}>
      <AppShell
        brand={<span>brand</span>}
        sidebarSections={[{ key: "s", items: [{ key: "a", label: "Home", href: "/h" }] }]}
        aiPanelOpen={true}
        onToggleAiPanel={() => {}}
        showGuide={false}
      >
        <p>content</p>
      </AppShell>
    </UiStringsProvider>,
  );
  assert.ok(screen.getByRole("link", { name: /VER-GLOBO/ }));
  assert.ok(screen.getByRole("link", { name: "AJUSTES" }));
  assert.ok(screen.getByRole("button", { name: "SALIR" }));
  assert.ok(screen.getByRole("combobox", { name: "BUSCAR-WV" }));
  assert.equal(screen.getByRole("combobox").getAttribute("placeholder"), "BUSCA-AQUI");
  assert.ok(screen.getByRole("navigation", { name: "PRINCIPAL" }));
  assert.ok(screen.getByRole("complementary", { name: "ASISTENTE-IA" }));
  assert.ok(screen.getByText("ASISTENTE"));
  assert.ok(screen.getByRole("button", { name: "CERRAR-IA" }));
  assert.ok(screen.getByRole("button", { name: "CONTRAER-BARRA" }));
});

test("the bell's spoken label and badge use the host's wording and numerals", async () => {
  stubSummary({ signedIn: true, unread: 4, criticalUnread: 2 });
  render(
    <UiStringsProvider value={FAKE}>
      <NotificationBell />
    </UiStringsProvider>,
  );
  const link = await screen.findByRole("link", { name: "NOTIFS / 4 SIN-LEER / 2 CRITICAS" });
  assert.match(screen.getByTestId("notification-badge").textContent ?? "", /^! #4$/);
  assert.equal(link.getAttribute("data-critical"), "true");
});

test("sidebar item toggles are labelled by the host, with the item's own name", () => {
  render(
    <UiStringsProvider value={FAKE}>
      <Sidebar
        sections={[
          {
            key: "s",
            items: [
              {
                key: "ws",
                label: "Agricultura",
                href: "/a",
                children: [{ key: "c", label: "Mapa", href: "/a/map" }],
              },
            ],
          },
        ]}
      />
    </UiStringsProvider>,
  );
  assert.ok(screen.getByRole("button", { name: "EXPANDIR Agricultura" }));
});

test("right-to-left flips the glyphs that point somewhere", () => {
  const RTL: UiStrings = { ...DEFAULT_UI_STRINGS, dir: "rtl" };
  const { rerender } = render(
    <UiStringsProvider value={DEFAULT_UI_STRINGS}>
      <AIPanel open={false} onToggle={() => {}} />
    </UiStringsProvider>,
  );
  // Closed rail: the arrow points toward the content — left in LTR, right in RTL.
  assert.equal(screen.getByRole("button", { name: "Open AI panel" }).textContent, "◀");
  rerender(
    <UiStringsProvider value={RTL}>
      <AIPanel open={false} onToggle={() => {}} />
    </UiStringsProvider>,
  );
  assert.equal(screen.getByRole("button", { name: "Open AI panel" }).textContent, "▶");
  rerender(
    <UiStringsProvider value={RTL}>
      <AIPanel open={true} onToggle={() => {}} />
    </UiStringsProvider>,
  );
  // Open panel: the docked glyph (the phone sheet's ✕ is a separate, CSS-swapped span).
  const docked = screen
    .getByRole("button", { name: "Collapse AI panel" })
    .querySelector(".wv-ai-side-glyph");
  assert.equal(docked?.textContent, "◀");
});

test("the bell stays a plain 'Notifications' link when counts are unknown, in any language", async () => {
  globalThis.fetch = (async () => new Response("{}", { status: 500 })) as typeof fetch;
  render(
    <UiStringsProvider value={FAKE}>
      <NotificationBell />
    </UiStringsProvider>,
  );
  await waitFor(() => assert.ok(screen.getByRole("link", { name: "NOTIFS" })));
});

test("the first-use tutorial and its popup take the language and direction from the provider", () => {
  const rtl: UiStrings = { ...FAKE, dir: "rtl", locale: "ar" };
  render(
    <UiStringsProvider value={rtl}>
      <GuideTutorial
        open
        onDismiss={() => {}}
        steps={[
          { title: "uno", body: "primero" },
          { title: "dos", body: "segundo" },
        ]}
      />
    </UiStringsProvider>,
  );
  assert.ok(screen.getByText("PASO 1/2"));
  assert.ok(screen.getByRole("button", { name: "OMITIR" }));
  assert.ok(screen.getByRole("button", { name: "SIGUIENTE" }));
  // The popup renders in a portal outside the page wrapper, so it carries
  // the direction and language itself.
  const backdrop = screen.getByRole("dialog").parentElement;
  assert.equal(backdrop?.getAttribute("dir"), "rtl");
  assert.equal(backdrop?.getAttribute("lang"), "ar");
});

test("without a provider the tutorial reads in English, left-to-right", () => {
  render(<GuideTutorial open onDismiss={() => {}} steps={[{ title: "One", body: "first" }]} />);
  assert.ok(screen.getByText("Step 1 of 1"));
  assert.ok(screen.getByRole("button", { name: "Get started" }));
  assert.equal(screen.getByRole("dialog").parentElement?.getAttribute("dir"), "ltr");
});
