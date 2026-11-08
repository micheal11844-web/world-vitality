import { test } from "node:test";
import assert from "node:assert/strict";
import { render, cleanup, act } from "@testing-library/react";
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

test("only the thinking mood sets the ring's dashes travelling", async () => {
  const march = async (mood: "idle" | "thinking") => {
    const { container } = render(<GuideCharacter mood={mood} />);
    // The dashes wait for the reduced-motion check, which runs after mount.
    await act(async () => {});
    const ring = container.querySelector("[data-part='ring-front'] path:last-child");
    const result = {
      dashed: ring?.getAttribute("stroke-dasharray") ?? null,
      animated: ring?.getAttribute("style")?.includes("wv-guide-march") ?? false,
    };
    cleanup();
    return result;
  };
  assert.deepEqual(await march("idle"), { dashed: null, animated: false });
  const thinking = await march("thinking");
  assert.ok(thinking.dashed && thinking.animated);
});

test("the artwork has the globe, the leaf, the ring in two halves and two hands", () => {
  const { container } = render(<GuideCharacter />);
  for (const part of ["body", "sprout", "ring-back", "ring-front", "hand-left", "hand-right"]) {
    assert.equal(container.querySelectorAll(`[data-part='${part}']`).length, 1, part);
  }
  assert.equal(container.querySelectorAll("[data-part='eye']").length, 2);
});

test("two Orbis on one page do not share a clip path", () => {
  const { container } = render(
    <>
      <GuideCharacter />
      <GuideCharacter />
    </>,
  );
  const ids = Array.from(container.querySelectorAll("clipPath")).map((c) => c.id);
  assert.equal(ids.length, 2);
  assert.notEqual(ids[0], ids[1]);
  assert.ok(ids.every((id) => /^[A-Za-z][A-Za-z0-9_-]*$/.test(id)));
});

test("every mood renders a distinct mouth path", () => {
  const moods = ["idle", "thinking", "happy", "concerned"] as const;
  const paths = moods.map((mood) => {
    const { container } = render(<GuideCharacter mood={mood} />);
    return container.querySelector("[data-part='mouth']")?.getAttribute("d");
  });
  assert.equal(new Set(paths).size, moods.length);
});

test("wave gesture only animates when explicitly requested", () => {
  const { container: still } = render(<GuideCharacter wave={false} />);
  assert.equal(still.querySelector("[data-part='hand-left']")?.hasAttribute("style"), false);

  const { container: waving } = render(<GuideCharacter wave={true} />);
  const hand = waving.querySelector("[data-part='hand-left']");
  assert.ok(hand?.getAttribute("style")?.includes("wv-guide-wave"));
  // Only the left hand waves.
  assert.equal(waving.querySelector("[data-part='hand-right']")?.hasAttribute("style"), false);
});

test("walkAway calls onWalkAwayComplete (immediately when animations are unavailable)", () => {
  let completed = 0;
  render(<GuideCharacter walkAway onWalkAwayComplete={() => (completed += 1)} />);
  assert.equal(completed, 1);
});

test("walkAway does nothing until requested", () => {
  let completed = 0;
  render(<GuideCharacter onWalkAwayComplete={() => (completed += 1)} />);
  assert.equal(completed, 0);
});

test("eyes follow the pointer unless `still`", () => {
  const { container } = render(<GuideCharacter />);
  const eye = container.querySelector("[data-part='eye']") as SVGCircleElement;
  assert.ok(eye);
  // jsdom has no layout (zero-size rect) — the component must not
  // throw or write NaN transforms when it can't measure itself.
  window.dispatchEvent(new window.Event("pointermove"));
  assert.ok(!eye.style.transform.includes("NaN"));

  cleanup();
  const { container: stillContainer } = render(<GuideCharacter still />);
  const stillEye = stillContainer.querySelector("[data-part='eye']") as SVGCircleElement;
  window.dispatchEvent(new window.Event("pointermove"));
  assert.equal(stillEye.style.transform, "");
});
