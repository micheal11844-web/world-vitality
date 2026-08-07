import { test } from "node:test";
import assert from "node:assert/strict";
import { getConfidenceDisplay, allConfidenceDisplays } from "../confidence.js";
import type { ConfidenceLevel } from "@world-vitality/interpretation-engine";

const ALL_LEVELS: ConfidenceLevel[] = ["high", "moderate", "low", "insufficient-data"];

test("every ConfidenceLevel has a display with a non-empty label and description", () => {
  for (const level of ALL_LEVELS) {
    const display = getConfidenceDisplay(level);
    assert.equal(display.level, level);
    assert.ok(display.label.length > 0);
    assert.ok(display.description.length > 0);
  }
});

test("insufficient-data does not use an error-style color token", () => {
  const display = getConfidenceDisplay("insufficient-data");
  assert.equal(display.colorToken, "confidence-unknown");
  assert.notEqual(display.colorToken as string, "error");
});

test("severity strictly increases as confidence decreases", () => {
  const high = getConfidenceDisplay("high");
  const moderate = getConfidenceDisplay("moderate");
  const low = getConfidenceDisplay("low");
  const unknown = getConfidenceDisplay("insufficient-data");
  assert.ok(high.severity < moderate.severity);
  assert.ok(moderate.severity < low.severity);
  assert.ok(low.severity < unknown.severity);
});

test("allConfidenceDisplays returns all 4 levels ordered from most to least certain", () => {
  const displays = allConfidenceDisplays();
  assert.equal(displays.length, 4);
  assert.deepEqual(
    displays.map((d) => d.level),
    ["high", "moderate", "low", "insufficient-data"],
  );
});
