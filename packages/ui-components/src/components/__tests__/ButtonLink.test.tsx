import { test } from "node:test";
import assert from "node:assert/strict";
import { render, screen, cleanup } from "@testing-library/react";
import { Button, buttonStyle } from "../Button.js";
import { ButtonLink } from "../ButtonLink.js";

test.afterEach(() => {
  cleanup();
});

test("a ButtonLink is a real link, not a button", () => {
  render(<ButtonLink href="/welcome?redo=1">Change</ButtonLink>);
  const link = screen.getByRole("link", { name: "Change" });
  assert.equal(link.getAttribute("href"), "/welcome?redo=1");
  assert.equal(screen.queryByRole("button"), null);
});

test("a ButtonLink is the same size and look as a Button of the same variant and size", () => {
  render(
    <>
      <ButtonLink href="/a" variant="secondary" size="sm">
        Link
      </ButtonLink>
      <Button variant="secondary" size="sm">
        Button
      </Button>
    </>,
  );
  const link = screen.getByRole("link", { name: "Link" });
  const button = screen.getByRole("button", { name: "Button" });
  // Whatever differs must be a deliberate link-only reset, not drift: compare the
  // properties that decide how big and how loud the control looks.
  for (const property of [
    "padding",
    "fontSize",
    "fontWeight",
    "fontFamily",
    "minHeight",
    "minWidth",
    "borderRadius",
    "border",
    "backgroundColor",
    "color",
  ] as const) {
    assert.equal(link.style[property], button.style[property], property);
  }
});

test("a ButtonLink keeps the 44px minimum target and never underlines", () => {
  render(<ButtonLink href="/a">Go</ButtonLink>);
  const link = screen.getByRole("link", { name: "Go" });
  assert.equal(link.style.minHeight, "2.75rem");
  assert.equal(link.style.textDecoration, "none");
});

test("buttonStyle dims and de-pointers an inactive control", () => {
  assert.equal(buttonStyle("primary", "md", true).cursor, "not-allowed");
  assert.equal(buttonStyle("primary", "md", true).opacity, 0.6);
  assert.equal(buttonStyle("primary", "md").cursor, "pointer");
  assert.equal(buttonStyle("primary", "md").opacity, 1);
});
