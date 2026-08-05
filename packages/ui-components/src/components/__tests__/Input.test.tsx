import { test } from "node:test";
import assert from "node:assert/strict";
import { render, screen, cleanup } from "@testing-library/react";
import { Input } from "../Input.js";

test.afterEach(() => {
  cleanup();
});

test("label is properly associated with the input via htmlFor/id", () => {
  render(<Input label="Email address" />);
  const input = screen.getByLabelText("Email address");
  assert.equal(input.tagName, "INPUT");
});

test("error text is linked via aria-describedby and marks aria-invalid", () => {
  render(<Input label="Email" error="Enter a valid email address" />);
  const input = screen.getByLabelText("Email");
  assert.equal(input.getAttribute("aria-invalid"), "true");
  const describedBy = input.getAttribute("aria-describedby");
  assert.ok(describedBy);
  assert.equal(document.getElementById(describedBy!)?.textContent, "Enter a valid email address");
});

test("helper text is used when there is no error", () => {
  render(<Input label="Email" helperText="We'll never share this" />);
  const input = screen.getByLabelText("Email");
  assert.equal(input.getAttribute("aria-invalid"), null);
  const describedBy = input.getAttribute("aria-describedby");
  assert.equal(document.getElementById(describedBy!)?.textContent, "We'll never share this");
});
