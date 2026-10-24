import { test } from "node:test";
import assert from "node:assert/strict";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Input } from "../Input.js";
import { Select } from "../Select.js";

test.afterEach(() => {
  cleanup();
});

test("a Select is reachable by its label and reports changes", () => {
  let picked = "";
  render(
    <Select label="Role" defaultValue="a" onChange={(e) => (picked = e.target.value)}>
      <option value="a">Alpha</option>
      <option value="b">Beta</option>
    </Select>,
  );
  const select = screen.getByLabelText("Role");
  fireEvent.change(select, { target: { value: "b" } });
  assert.equal(picked, "b");
});

test("a Select is the same height and type as an Input, so they line up in one row", () => {
  render(
    <>
      <Input label="Email" />
      <Select label="Role">
        <option>One</option>
      </Select>
    </>,
  );
  const input = screen.getByLabelText("Email");
  const select = screen.getByLabelText("Role");
  for (const property of [
    "minHeight",
    "padding",
    "fontFamily",
    "fontSize",
    "borderRadius",
    "boxSizing",
  ] as const) {
    assert.equal(select.style[property], input.style[property], property);
  }
  assert.equal(input.style.minHeight, "2.75rem");
});
