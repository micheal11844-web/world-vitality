import { test } from "node:test";
import assert from "node:assert/strict";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { StateDisplay } from "../StateDisplay.js";

test.afterEach(() => {
  cleanup();
});

test("error state uses role=alert; other states use role=status", () => {
  const { unmount } = render(<StateDisplay status="error" title="Couldn't load this" />);
  assert.ok(screen.getByRole("alert"));
  unmount();

  render(<StateDisplay status="loading" title="Loading your data" />);
  assert.ok(screen.getByRole("status"));
});

test("empty state renders its action button and fires onClick", () => {
  let clicked = false;
  render(
    <StateDisplay
      status="empty"
      title="No reports yet"
      description="Create your first report to see it here."
      action={{ label: "Create report", onClick: () => (clicked = true) }}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Create report" }));
  assert.equal(clicked, true);
});

test("loading and success states do not render an action even if one is passed", () => {
  render(
    <StateDisplay
      status="loading"
      title="Loading"
      action={{ label: "Should not show", onClick: () => {} }}
    />,
  );
  assert.equal(screen.queryByRole("button"), null);
});

test("renders title and description text", () => {
  render(
    <StateDisplay
      status="success"
      title="Report saved"
      description="You can find it in Reports."
    />,
  );
  assert.ok(screen.getByText("Report saved"));
  assert.ok(screen.getByText("You can find it in Reports."));
});
