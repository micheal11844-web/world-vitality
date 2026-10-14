import { test } from "node:test";
import assert from "node:assert/strict";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import { NotificationBell } from "../NotificationBell.js";

const realFetch = globalThis.fetch;

test.afterEach(() => {
  cleanup();
  globalThis.fetch = realFetch;
});

function stubSummary(body: unknown, status = 200) {
  globalThis.fetch = (async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    })) as typeof fetch;
}

test("renders nothing for an anonymous visitor", async () => {
  stubSummary({ signedIn: false });
  const { container } = render(<NotificationBell />);
  // `assert.ok(x === null)`, not `assert.equal(node, null)`: a failed
  // equality builds a diff of the whole React-fiber-laden DOM node, which
  // blocks the event loop long enough to starve `waitFor`'s own timers.
  await waitFor(() => assert.ok(container.querySelector("a") === null));
});

test("links to the Notification Center with an accessible unread count", async () => {
  stubSummary({ signedIn: true, unread: 3, criticalUnread: 0 });
  render(<NotificationBell />);
  const link = await screen.findByRole("link", { name: "Notifications, 3 unread" });
  assert.equal(link.getAttribute("href"), "/notifications");
  assert.equal(link.getAttribute("data-critical"), null);
  assert.equal(screen.getByTestId("notification-badge").textContent, "3");
});

test("shows no badge when nothing is unread", async () => {
  stubSummary({ signedIn: true, unread: 0, criticalUnread: 0 });
  render(<NotificationBell />);
  const link = await screen.findByRole("link", { name: "Notifications" });
  await waitFor(() => assert.equal(link.getAttribute("href"), "/notifications"));
  assert.equal(screen.queryByTestId("notification-badge"), null);
});

test("an unread critical notification gets the reserved look and is spelled out for screen readers", async () => {
  stubSummary({ signedIn: true, unread: 4, criticalUnread: 2 });
  render(<NotificationBell />);
  const link = await screen.findByRole("link", { name: "Notifications, 4 unread, 2 critical" });
  assert.equal(link.getAttribute("data-critical"), "true");
  assert.match(screen.getByTestId("notification-badge").textContent ?? "", /^! 4$/);
});

test("caps a large count at 99+", async () => {
  stubSummary({ signedIn: true, unread: 250, criticalUnread: 0 });
  render(<NotificationBell />);
  await screen.findByRole("link", { name: "Notifications, 250 unread" });
  assert.equal(screen.getByTestId("notification-badge").textContent, "99+");
});

test("a failed lookup shows a plain, still-working bell (never a false 'all clear' count)", async () => {
  stubSummary({}, 500);
  render(<NotificationBell />);
  const link = await screen.findByRole("link", { name: "Notifications" });
  assert.equal(link.getAttribute("href"), "/notifications");
  assert.equal(screen.queryByTestId("notification-badge"), null);
});

test("a network error also degrades to a plain bell", async () => {
  globalThis.fetch = (async () => {
    throw new TypeError("offline");
  }) as typeof fetch;
  render(<NotificationBell />);
  const link = await screen.findByRole("link", { name: "Notifications" });
  assert.equal(link.getAttribute("href"), "/notifications");
});

test("a degraded server response (database trouble) shows a plain bell", async () => {
  stubSummary({ signedIn: true, degraded: true });
  render(<NotificationBell />);
  await screen.findByRole("link", { name: "Notifications" });
  assert.equal(screen.queryByTestId("notification-badge"), null);
});
