import { test } from "node:test";
import assert from "node:assert/strict";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Header } from "../Header.js";
import { Sidebar } from "../Sidebar.js";
import { AIPanel } from "../AIPanel.js";
import { AppShell } from "../AppShell.js";

test.afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

test("Header renders brand and actions in a banner landmark", () => {
  render(<Header brand={<span>World Vitality</span>} actions={<button>Profile</button>} />);
  assert.ok(screen.getByRole("banner"));
  assert.ok(screen.getByText("World Vitality"));
  assert.ok(screen.getByRole("button", { name: "Profile" }));
});

test("Sidebar marks the active item with aria-current=page", () => {
  render(
    <Sidebar
      sections={[
        {
          key: "primary",
          items: [
            { key: "dash", label: "Dashboard", href: "/dashboard", active: true },
            { key: "map", label: "Map", href: "/map" },
          ],
        },
      ]}
    />,
  );
  const active = screen.getByRole("link", { name: "Dashboard" });
  const inactive = screen.getByRole("link", { name: "Map" });
  assert.equal(active.getAttribute("aria-current"), "page");
  assert.equal(inactive.getAttribute("aria-current"), null);
});

test("Sidebar renders section labels as group headings when expanded", () => {
  render(
    <Sidebar
      sections={[
        {
          key: "workspaces",
          label: "Workspaces",
          items: [{ key: "ag", label: "Agriculture", href: "/workspaces/agriculture" }],
        },
        {
          key: "this-workspace",
          label: "This Workspace",
          items: [{ key: "map", label: "Map", href: "/workspaces/agriculture/map" }],
        },
      ]}
    />,
  );
  assert.ok(screen.getByText("Workspaces"));
  assert.ok(screen.getByText("This Workspace"));
});

test("Sidebar collapsed mode hides text labels but shows a fallback initial and keeps links accessible by href", () => {
  render(
    <Sidebar
      collapsed
      sections={[
        { key: "primary", items: [{ key: "dash", label: "Dashboard", href: "/dashboard" }] },
      ]}
    />,
  );
  const link = screen.getByRole("navigation").querySelector("a");
  assert.equal(link?.getAttribute("href"), "/dashboard");
  // No icon was supplied, so the collapsed rail falls back to the
  // item's first letter rather than an empty row.
  assert.equal(link?.textContent, "D");
  assert.equal(link?.getAttribute("title"), "Dashboard");
});

test("Sidebar renders a collapse toggle button when onToggleCollapse is provided, and it fires on click", () => {
  let toggled = false;
  render(
    <Sidebar
      sections={[
        { key: "primary", items: [{ key: "dash", label: "Dashboard", href: "/dashboard" }] },
      ]}
      onToggleCollapse={() => (toggled = true)}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: /Collapse sidebar/i }));
  assert.equal(toggled, true);
});

test("AIPanel renders a collapsed rail with an open toggle when closed", () => {
  render(<AIPanel open={false} onToggle={() => {}} />);
  assert.equal(screen.queryByRole("complementary"), null);
  assert.ok(screen.getByRole("button", { name: "Open AI panel" }));
});

test("AIPanel renders the full panel with content when open, and toggle closes it", () => {
  let open = true;
  render(
    <AIPanel open={open} onToggle={() => (open = false)}>
      <p>Ask me anything</p>
    </AIPanel>,
  );
  assert.ok(screen.getByRole("complementary", { name: "AI assistant" }));
  assert.ok(screen.getByText("Ask me anything"));
  fireEvent.click(screen.getByRole("button", { name: "Collapse AI panel" }));
  assert.equal(open, false);
});

const SINGLE_SECTION = [
  {
    key: "primary",
    items: [{ key: "dash", label: "Dashboard", href: "/dashboard", active: true }],
  },
];

test("AppShell composes header, nav, main content, and AI panel together", () => {
  render(
    <AppShell
      brand={<span>World Vitality</span>}
      sidebarSections={SINGLE_SECTION}
      aiPanelOpen={false}
      onToggleAiPanel={() => {}}
    >
      <p>Page content</p>
    </AppShell>,
  );
  assert.ok(screen.getByRole("banner"));
  assert.ok(screen.getByRole("navigation", { name: "Primary" }));
  assert.ok(screen.getByRole("main"));
  assert.ok(screen.getByRole("button", { name: "Open AI panel" }));
});

test("AppShell renders the Guide Character by default (ticket 9.5)", () => {
  const { container } = render(
    <AppShell
      brand={<span>World Vitality</span>}
      sidebarSections={SINGLE_SECTION}
      aiPanelOpen={false}
      onToggleAiPanel={() => {}}
    >
      <p>Page content</p>
    </AppShell>,
  );
  assert.ok(container.querySelector("[title='Orbi']"));
});

test("AppShell hides the Guide Character when showGuide is false", () => {
  const { container } = render(
    <AppShell
      brand={<span>World Vitality</span>}
      sidebarSections={SINGLE_SECTION}
      aiPanelOpen={false}
      onToggleAiPanel={() => {}}
      showGuide={false}
    >
      <p>Page content</p>
    </AppShell>,
  );
  assert.equal(container.querySelector("[title='Orbi']"), null);
});

test("AppShell starts with the sidebar expanded by default", () => {
  render(
    <AppShell
      brand={<span>World Vitality</span>}
      sidebarSections={SINGLE_SECTION}
      aiPanelOpen={false}
      onToggleAiPanel={() => {}}
    >
      <p>Page content</p>
    </AppShell>,
  );
  assert.ok(screen.getByText("Dashboard"));
  assert.ok(screen.getByRole("button", { name: /Collapse sidebar/i }));
});

test("AppShell toggles the sidebar collapsed state via Ctrl+B and persists it to localStorage", () => {
  render(
    <AppShell
      brand={<span>World Vitality</span>}
      sidebarSections={SINGLE_SECTION}
      aiPanelOpen={false}
      onToggleAiPanel={() => {}}
    >
      <p>Page content</p>
    </AppShell>,
  );
  assert.ok(screen.getByText("Dashboard"));
  fireEvent.keyDown(window, { key: "b", ctrlKey: true });
  assert.equal(screen.queryByText("Dashboard"), null);
  assert.equal(window.localStorage.getItem("wv-sidebar-collapsed"), "true");
  fireEvent.keyDown(window, { key: "b", ctrlKey: true });
  assert.ok(screen.getByText("Dashboard"));
  assert.equal(window.localStorage.getItem("wv-sidebar-collapsed"), "false");
});

test("AppShell reads a previously persisted collapsed state from localStorage on mount", () => {
  window.localStorage.setItem("wv-sidebar-collapsed", "true");
  render(
    <AppShell
      brand={<span>World Vitality</span>}
      sidebarSections={SINGLE_SECTION}
      aiPanelOpen={false}
      onToggleAiPanel={() => {}}
    >
      <p>Page content</p>
    </AppShell>,
  );
  assert.equal(screen.queryByText("Dashboard"), null);
});
