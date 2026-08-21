import { test } from "node:test";
import assert from "node:assert/strict";
import { render, cleanup } from "@testing-library/react";
import { AuthIllustration } from "../AuthIllustration.js";

test.afterEach(() => {
  cleanup();
});

test("renders the real logo with meaningful alt text, not aria-hidden", () => {
  // Unlike the earlier abstract SVG scene (purely decorative, rightly
  // aria-hidden), the real logo carries real brand meaning (the "See.
  // Understand. Act." tagline is part of the asset itself), so it
  // should be announced, not hidden, from assistive technology.
  const { container } = render(<AuthIllustration />);
  const img = container.querySelector("img");
  assert.ok(img);
  assert.equal(img?.getAttribute("src"), "/brand/world-vitality-logo.png");
  assert.ok(img?.getAttribute("alt"));
  assert.notEqual(img?.getAttribute("aria-hidden"), "true");
});

test("still shows the Guide Character alongside the logo", () => {
  const { container } = render(<AuthIllustration />);
  assert.ok(container.querySelector("[title='Orbi']"));
});
