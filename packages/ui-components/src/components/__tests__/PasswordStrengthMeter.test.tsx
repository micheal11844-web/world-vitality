import { test } from "node:test";
import assert from "node:assert/strict";
import { render, cleanup, waitFor } from "@testing-library/react";
import { PasswordStrengthMeter } from "../PasswordStrengthMeter.js";

test.afterEach(() => {
  cleanup();
});

async function getScore(container: HTMLElement): Promise<number> {
  await waitFor(() => {
    assert.ok(container.querySelector("[role='meter']"));
  });
  const meter = container.querySelector("[role='meter']");
  return Number(meter?.getAttribute("aria-valuenow"));
}

test("renders nothing for an empty password", () => {
  const { container } = render(<PasswordStrengthMeter password="" />);
  assert.equal(container.querySelector("[role='meter']"), null);
});

test("scores a common weak password low, once the checker loads", async () => {
  const { container } = render(<PasswordStrengthMeter password="password1" />);
  const score = await getScore(container);
  assert.ok(score <= 1, `expected a weak score, got ${score}`);
});

test("scores a long, unusual passphrase higher than a short complex-looking one", async () => {
  const { container: weak } = render(<PasswordStrengthMeter password="P@ssw0rd1" />);
  const weakScore = await getScore(weak);

  const { container: strong } = render(
    <PasswordStrengthMeter password="correcthorsebatterystaple-glacier-42" />,
  );
  const strongScore = await getScore(strong);

  assert.ok(
    strongScore > weakScore,
    `expected passphrase (${strongScore}) to score higher than P@ssw0rd1 (${weakScore})`,
  );
});

test("penalizes a password that reuses a supplied user input (e.g. email)", async () => {
  const { container: withoutContext } = render(
    <PasswordStrengthMeter password="orbiworldvitality" />,
  );
  const scoreWithoutContext = await getScore(withoutContext);

  const { container: withContext } = render(
    <PasswordStrengthMeter password="orbiworldvitality" userInputs={["orbi", "worldvitality"]} />,
  );
  const scoreWithContext = await getScore(withContext);

  assert.ok(
    scoreWithContext <= scoreWithoutContext,
    "supplying user inputs should never increase the score",
  );
});
