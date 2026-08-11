import { test } from "node:test";
import assert from "node:assert/strict";
import { render, cleanup } from "@testing-library/react";
import { AuthIllustration } from "../AuthIllustration.js";

test.afterEach(() => {
  cleanup();
});

test("is purely decorative — aria-hidden, never a carrier of meaning", () => {
  const { container } = render(<AuthIllustration />);
  const svg = container.querySelector("svg");
  assert.equal(svg?.getAttribute("aria-hidden"), "true");
});

test("renders without crashing and produces visible shapes", () => {
  const { container } = render(<AuthIllustration />);
  assert.ok((container.querySelectorAll("svg path, svg circle, svg rect").length ?? 0) > 0);
});
