import { test } from "node:test";
import assert from "node:assert/strict";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Checkbox } from "../Checkbox.js";

test.afterEach(() => {
  cleanup();
});

test("renders a real, labeled, keyboard-accessible checkbox input", () => {
  render(<Checkbox label="Remember me" checked={false} onChange={() => {}} />);
  const input = screen.getByLabelText("Remember me");
  assert.equal(input.tagName, "INPUT");
  assert.equal((input as HTMLInputElement).type, "checkbox");
});

test("toggles via a real onChange handler, same as a native checkbox", () => {
  let checked = false;
  render(<Checkbox label="Remember me" checked={checked} onChange={() => (checked = true)} />);
  fireEvent.click(screen.getByLabelText("Remember me"));
  assert.equal(checked, true);
});

test("shows a checkmark only when checked", () => {
  const { container: unchecked } = render(
    <Checkbox label="Remember me" checked={false} onChange={() => {}} />,
  );
  assert.equal(unchecked.querySelector("svg"), null);

  const { container: checked } = render(
    <Checkbox label="Remember me" checked={true} onChange={() => {}} />,
  );
  assert.ok(checked.querySelector("svg"));
});
