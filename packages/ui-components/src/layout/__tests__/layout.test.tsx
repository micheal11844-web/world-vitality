import { test } from "node:test";
import assert from "node:assert/strict";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Header } from "../Header.js";
import { Sidebar } from "../Sidebar.js";
import { AIPanel } from "../AIPanel.js";
import { AppShell } from "../AppShell.js";

test.afterEach(() => {
  cleanup();
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
      items={[
        { key: "dash", label: "Dashboard", href: "/dashboard", active: true },
        { key: "map", label: "Map", href: "/map" },
      ]}
    />,
  );
  const active = screen.getByRole("link", { name: "Dashboard" });
  const inactive = screen.getByRole("link", { name: "Map" });
  assert.equal(active.getAttribute("aria-current"), "page");
  assert.equal(inactive.getAttribute("aria-current"), null);
});

test("Sidebar collapsed mode hides labels but keeps links accessible by href", () => {
  render(<Sidebar collapsed items={[{ key: "dash", label: "Dashboard", href: "/dashboard" }]} />);
  const link = screen.getByRole("navigation").querySelector("a");
  assert.equal(link?.getAttribute("href"), "/dashboard");
  assert.equal(link?.textContent, "");
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

test("AppShell composes header, nav, main content, and AI panel together", () => {
  render(
    <AppShell
      brand={<span>World Vitality</span>}
      sidebarItems={[{ key: "dash", label: "Dashboard", href: "/dashboard", active: true }]}
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
      sidebarItems={[{ key: "dash", label: "Dashboard", href: "/dashboard", active: true }]}
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
      sidebarItems={[{ key: "dash", label: "Dashboard", href: "/dashboard", active: true }]}
      aiPanelOpen={false}
      onToggleAiPanel={() => {}}
      showGuide={false}
    >
      <p>Page content</p>
    </AppShell>,
  );
  assert.equal(container.querySelector("[title='Orbi']"), null);
});
