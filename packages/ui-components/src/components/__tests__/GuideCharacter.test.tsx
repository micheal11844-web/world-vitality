import { test } from "node:test";
import assert from "node:assert/strict";
import { render, cleanup } from "@testing-library/react";
import { GuideCharacter } from "../GuideCharacter.js";

test.afterEach(() => {
  cleanup();
});

test("is decorative — aria-hidden, never the sole carrier of meaning", () => {
  const { container } = render(<GuideCharacter />);
  const root = container.firstElementChild;
  assert.equal(root?.getAttribute("aria-hidden"), "true");
  assert.equal(root?.getAttribute("role"), "presentation");
});

test("defaults to the provisional name Orbi, overridable via prop", () => {
  const { container, rerender } = render(<GuideCharacter />);
  assert.equal(container.firstElementChild?.getAttribute("title"), "Orbi");

  rerender(<GuideCharacter name="Terra" />);
  assert.equal(container.firstElementChild?.getAttribute("title"), "Terra");
});

test("only renders the orbiting satellite in thinking mood", () => {
  const { container: idle } = render(<GuideCharacter mood="idle" />);
  assert.equal(idle.querySelectorAll("svg > g").length, 0);

  const { container: thinking } = render(<GuideCharacter mood="thinking" />);
  assert.equal(thinking.querySelectorAll("svg > g").length, 1);
});

test("every mood renders a distinct mouth path", () => {
  const moods = ["idle", "thinking", "happy", "concerned"] as const;
  const paths = moods.map((mood) => {
    const { container } = render(<GuideCharacter mood={mood} />);
    // Mouth is always the last <path> in the SVG.
    const allPaths = container.querySelectorAll("svg path");
    return allPaths[allPaths.length - 1]?.getAttribute("d");
  });
  assert.equal(new Set(paths).size, moods.length);
});

test("wave gesture only animates when explicitly requested", () => {
  const { container: still } = render(<GuideCharacter wave={false} />);
  const stillArm = still.querySelector("line[x1='30']");
  assert.equal(stillArm?.hasAttribute("style"), false);

  const { container: waving } = render(<GuideCharacter wave={true} />);
  const wavingArm = waving.querySelector("line[x1='30']");
  assert.ok(wavingArm?.getAttribute("style")?.includes("wv-guide-wave"));
});
