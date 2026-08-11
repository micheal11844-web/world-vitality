import { test } from "node:test";
import assert from "node:assert/strict";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { GuideTutorial, type GuideTutorialStep } from "../GuideTutorial.js";

test.afterEach(() => {
  cleanup();
});

const STEPS: GuideTutorialStep[] = [
  { title: "Welcome", body: "This is step one." },
  { title: "Workspaces", body: "This is step two." },
  { title: "You're set", body: "This is step three." },
];

test("renders nothing when closed", () => {
  const { container } = render(<GuideTutorial open={false} onDismiss={() => {}} steps={STEPS} />);
  assert.equal(container.querySelector("[role='dialog']"), null);
});

test("shows the first step's content and a 1-of-N indicator", () => {
  render(<GuideTutorial open={true} onDismiss={() => {}} steps={STEPS} />);
  assert.ok(screen.getByText("This is step one."));
  assert.ok(screen.getByText("Step 1 of 3"));
  assert.equal(screen.queryByRole("button", { name: "Back" }), null);
});

test("Next advances through steps, and the last step's button says Get started", () => {
  render(<GuideTutorial open={true} onDismiss={() => {}} steps={STEPS} />);
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  assert.ok(screen.getByText("This is step two."));
  assert.ok(screen.getByRole("button", { name: "Back" }));

  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  assert.ok(screen.getByText("This is step three."));
  assert.ok(screen.getByRole("button", { name: "Get started" }));
});

test("Back returns to the previous step", () => {
  render(<GuideTutorial open={true} onDismiss={() => {}} steps={STEPS} />);
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  fireEvent.click(screen.getByRole("button", { name: "Back" }));
  assert.ok(screen.getByText("This is step one."));
});

test("Skip calls onDismiss immediately, regardless of step", () => {
  let dismissed = false;
  render(<GuideTutorial open={true} onDismiss={() => (dismissed = true)} steps={STEPS} />);
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  fireEvent.click(screen.getByRole("button", { name: "Skip" }));
  assert.equal(dismissed, true);
});

test("Get started on the final step calls onDismiss", () => {
  let dismissed = false;
  render(<GuideTutorial open={true} onDismiss={() => (dismissed = true)} steps={STEPS} />);
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  fireEvent.click(screen.getByRole("button", { name: "Get started" }));
  assert.equal(dismissed, true);
});
