import { test } from "node:test";
import assert from "node:assert/strict";
import { render, screen, cleanup } from "@testing-library/react";
import { ConfidenceBadge } from "../ConfidenceBadge.js";

test.afterEach(() => {
  cleanup();
});

test("renders the plain-language label as real text, not color-only", () => {
  render(<ConfidenceBadge level="high" />);
  assert.ok(screen.getByText("High confidence"));
});

test("insufficient-data renders as a dashed outline, not a solid fill, for non-color distinction", () => {
  const { container } = render(<ConfidenceBadge level="insufficient-data" />);
  const dot = container.querySelector('[aria-hidden="true"]') as HTMLElement;
  assert.match(dot.style.border, /dashed/);
});

test("showDescription renders the one-sentence description text", () => {
  render(<ConfidenceBadge level="low" showDescription />);
  assert.ok(screen.getByText(/treat it as a starting point/));
});

test("without showDescription, the description text is not rendered", () => {
  render(<ConfidenceBadge level="low" />);
  assert.equal(screen.queryByText(/treat it as a starting point/), null);
});
