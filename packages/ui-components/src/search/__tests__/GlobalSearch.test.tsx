import { test } from "node:test";
import assert from "node:assert/strict";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { GlobalSearch } from "../GlobalSearch.js";

const realFetch = globalThis.fetch;

test.afterEach(() => {
  cleanup();
  globalThis.fetch = realFetch;
});

function stubFetch(handlers: Record<string, unknown>) {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    const key = Object.keys(handlers).find((k) => url.startsWith(k));
    const body = key ? handlers[key] : { suggestions: [] };
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;
}

test("renders a real GET search form with an accessible combobox", () => {
  stubFetch({});
  render(<GlobalSearch />);
  const form = screen.getByRole("search");
  assert.equal(form.getAttribute("action"), "/search");
  assert.equal(form.getAttribute("method"), "get");
  const input = screen.getByRole("combobox", { name: "Search World Vitality" });
  assert.equal(input.getAttribute("name"), "q");
  assert.equal(input.getAttribute("aria-expanded"), "false");
});

test("shows topic and place suggestions and supports arrow-key selection", async () => {
  stubFetch({
    "/api/search/suggest": {
      suggestions: [
        {
          id: "disaster",
          kind: "workspace",
          label: "Disaster Monitoring",
          href: "/workspaces/disaster-monitoring",
        },
      ],
    },
    "/api/search/places": {
      suggestions: [
        { id: "p1", kind: "place", label: "Lagos, Nigeria", href: "/explore?lat=6.5&lon=3.4" },
      ],
    },
  });
  render(<GlobalSearch />);
  const input = screen.getByRole("combobox");
  fireEvent.change(input, { target: { value: "lagos" } });

  await waitFor(() => assert.ok(screen.getByText("Disaster Monitoring")));
  await waitFor(() => assert.ok(screen.getByText("Lagos, Nigeria")));
  assert.equal(input.getAttribute("aria-expanded"), "true");
  const options = screen.getAllByRole("option");
  assert.equal(options.length, 2);

  fireEvent.keyDown(input, { key: "ArrowDown" });
  assert.equal(input.getAttribute("aria-activedescendant"), options[0]?.id);
  assert.equal(options[0]?.getAttribute("aria-selected"), "true");
  fireEvent.keyDown(input, { key: "ArrowDown" });
  assert.equal(input.getAttribute("aria-activedescendant"), options[1]?.id);
  fireEvent.keyDown(input, { key: "ArrowDown" });
  assert.equal(input.getAttribute("aria-activedescendant"), options[0]?.id); // wraps
  fireEvent.keyDown(input, { key: "ArrowUp" });
  assert.equal(input.getAttribute("aria-activedescendant"), options[1]?.id);

  fireEvent.keyDown(input, { key: "Escape" });
  assert.equal(input.getAttribute("aria-expanded"), "false");
});

test("ignores suggestions with off-site or protocol-relative links", async () => {
  stubFetch({
    "/api/search/suggest": {
      suggestions: [
        { id: "bad1", kind: "page", label: "Evil one", href: "https://evil.example/x" },
        { id: "bad2", kind: "page", label: "Evil two", href: "//evil.example/x" },
        { id: "ok", kind: "page", label: "Fine", href: "/settings" },
      ],
    },
  });
  render(<GlobalSearch />);
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "x" } });
  await waitFor(() => assert.ok(screen.getByText("Fine")));
  assert.equal(screen.queryByText("Evil one"), null);
  assert.equal(screen.queryByText("Evil two"), null);
});

test("survives failing endpoints: no suggestions, Enter-to-search hint remains", async () => {
  globalThis.fetch = (async () => {
    throw new Error("offline");
  }) as typeof fetch;
  render(<GlobalSearch />);
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "flood" } });
  assert.ok(await screen.findByText(/No quick matches/));
  assert.equal(screen.queryAllByRole("option").length, 0);
});

test("an empty query does not submit the form", () => {
  stubFetch({});
  render(<GlobalSearch />);
  const form = screen.getByRole("search");
  const notPrevented = fireEvent.submit(form);
  assert.equal(notPrevented, false); // preventDefault was called
});

test("'/' focuses the search from anywhere but not from another input", () => {
  stubFetch({});
  render(
    <div>
      <input aria-label="other" />
      <GlobalSearch />
    </div>,
  );
  const input = screen.getByRole("combobox");
  fireEvent.keyDown(window, { key: "/" });
  assert.equal(document.activeElement, input);

  const other = screen.getByLabelText("other");
  other.focus();
  fireEvent.keyDown(other, { key: "/" });
  assert.equal(document.activeElement, other);
});
