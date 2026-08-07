import { test } from "node:test";
import assert from "node:assert/strict";
import { useState } from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Modal } from "../Modal.js";

test.afterEach(() => {
  cleanup();
});

test("renders nothing when closed", () => {
  render(
    <Modal open={false} onClose={() => {}} title="Confirm">
      <p>Body</p>
    </Modal>,
  );
  assert.equal(screen.queryByRole("dialog"), null);
});

test("renders with correct dialog ARIA semantics when open", () => {
  render(
    <Modal open onClose={() => {}} title="Confirm delete">
      <p>Are you sure?</p>
    </Modal>,
  );
  const dialog = screen.getByRole("dialog");
  assert.equal(dialog.getAttribute("aria-modal"), "true");
  const labelledBy = dialog.getAttribute("aria-labelledby");
  assert.ok(labelledBy);
  assert.equal(document.getElementById(labelledBy!)?.textContent, "Confirm delete");
});

test("moves focus into the dialog on open", () => {
  render(
    <Modal open onClose={() => {}} title="Confirm">
      <button>Confirm</button>
      <button>Cancel</button>
    </Modal>,
  );
  const buttons = screen.getAllByRole("button");
  assert.equal(document.activeElement, buttons[0]);
});

test("Escape key calls onClose", () => {
  let closed = false;
  render(
    <Modal open onClose={() => (closed = true)} title="Confirm">
      <button>OK</button>
    </Modal>,
  );
  fireEvent.keyDown(document, { key: "Escape" });
  assert.equal(closed, true);
});

test("clicking the backdrop calls onClose, clicking dialog content does not", () => {
  let closed = false;
  render(
    <Modal open onClose={() => (closed = true)} title="Confirm">
      <button>Stay</button>
    </Modal>,
  );
  fireEvent.mouseDown(screen.getByRole("button", { name: "Stay" }));
  assert.equal(closed, false);

  fireEvent.mouseDown(screen.getByRole("dialog").parentElement!);
  assert.equal(closed, true);
});

test("Tab wraps focus from the last focusable element back to the first", () => {
  render(
    <Modal open onClose={() => {}} title="Confirm">
      <button>First</button>
      <button>Last</button>
    </Modal>,
  );
  const [first, last] = screen.getAllByRole("button");
  last!.focus();
  fireEvent.keyDown(document, { key: "Tab" });
  assert.equal(document.activeElement, first);
});

test("Shift+Tab wraps focus from the first focusable element to the last", () => {
  render(
    <Modal open onClose={() => {}} title="Confirm">
      <button>First</button>
      <button>Last</button>
    </Modal>,
  );
  const [first, last] = screen.getAllByRole("button");
  first!.focus();
  fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
  assert.equal(document.activeElement, last);
});

test("returns focus to the previously focused element on close", () => {
  function Harness() {
    const [open, setOpen] = useState(false);
    return (
      <div>
        <button onClick={() => setOpen(true)}>Open</button>
        <Modal open={open} onClose={() => setOpen(false)} title="Confirm">
          <button>Inside</button>
        </Modal>
      </div>
    );
  }
  render(<Harness />);
  const opener = screen.getByRole("button", { name: "Open" });
  opener.focus();
  fireEvent.click(opener);
  assert.ok(screen.queryByRole("dialog"));
  fireEvent.keyDown(document, { key: "Escape" });
  assert.equal(document.activeElement, opener);
});
