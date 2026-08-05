import { test } from "node:test";
import assert from "node:assert/strict";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Button } from "../Button.js";

test.afterEach(() => {
  cleanup();
});

test("renders children and responds to click", () => {
  let clicked = false;
  render(<Button onClick={() => (clicked = true)}>Save</Button>);
  const button = screen.getByRole("button", { name: "Save" });
  fireEvent.click(button);
  assert.equal(clicked, true);
});

test("loading state disables the button and sets aria-busy", () => {
  render(<Button loading>Save</Button>);
  const button = screen.getByRole("button", { name: "Save" });
  assert.equal(button.hasAttribute("disabled"), true);
  assert.equal(button.getAttribute("aria-busy"), "true");
});

test("disabled button does not fire onClick", () => {
  let clicked = false;
  render(
    <Button disabled onClick={() => (clicked = true)}>
      Save
    </Button>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  assert.equal(clicked, false);
});
