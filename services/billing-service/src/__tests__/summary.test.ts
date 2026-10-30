import { test } from "node:test";
import assert from "node:assert/strict";
import { offeredPrices } from "../prices.js";
import { summariseBilling } from "../summary.js";
import type { SubscriptionState } from "../subscription.js";

const NOW = new Date("2026-11-01T12:00:00Z");

const sub = (over: Partial<SubscriptionState> = {}): SubscriptionState => ({
  userId: "u",
  plan: "standard",
  status: "active",
  source: "paystack",
  currency: "NGN",
  customerCode: "CUS_1",
  subscriptionCode: "SUB_1",
  currentPeriodEnd: null,
  pastDueSince: null,
  updatedAt: "2026-10-01T00:00:00Z",
  ...over,
});

test("no subscription is the free plan, and may subscribe but has nothing to manage", () => {
  assert.deepEqual(summariseBilling(null, NOW), {
    plan: "basic",
    state: "free",
    subscribedPlan: null,
    currency: null,
    endsOn: null,
    graceEndsOn: null,
    canManage: false,
    canSubscribe: true,
  });
});

test("an active paid subscription can be managed, and cannot be bought again", () => {
  const s = summariseBilling(sub(), NOW);
  assert.equal(s.state, "active");
  assert.equal(s.plan, "standard");
  assert.equal(s.subscribedPlan, "standard");
  assert.equal(s.canManage, true);
  assert.equal(s.canSubscribe, false, "no plan switching on a running subscription");
  assert.equal(summariseBilling(sub({ plan: "premium" }), NOW).plan, "premium");
});

test("a cancelled-but-paid subscription keeps its plan until the paid term ends, then is free again", () => {
  const during = summariseBilling(
    sub({ status: "non_renewing", currentPeriodEnd: "2026-11-20T00:00:00Z" }),
    NOW,
  );
  assert.equal(during.state, "ending");
  assert.equal(during.plan, "standard");
  assert.equal(during.endsOn, "2026-11-20T00:00:00Z");
  assert.equal(during.canManage, false);
  assert.equal(during.canSubscribe, false);

  const after = summariseBilling(
    sub({ status: "non_renewing", currentPeriodEnd: "2026-10-20T00:00:00Z" }),
    NOW,
  );
  assert.equal(after.state, "free");
  assert.equal(after.plan, "basic");
  assert.equal(after.canSubscribe, true);
});

test("a failed payment keeps the plan through the grace period and lets the card be fixed", () => {
  const s = summariseBilling(
    sub({ status: "past_due", pastDueSince: "2026-10-30T12:00:00Z" }),
    NOW,
  );
  assert.equal(s.state, "past_due");
  assert.equal(s.plan, "standard");
  assert.equal(s.graceEndsOn, "2026-11-06T12:00:00.000Z");
  assert.equal(s.canManage, true);
  assert.equal(s.canSubscribe, false);
});

test("past the grace period the plan is Basic, but the card can still be fixed and a new plan bought", () => {
  const s = summariseBilling(
    sub({ status: "past_due", pastDueSince: "2026-10-01T12:00:00Z" }),
    NOW,
  );
  assert.equal(s.state, "free");
  assert.equal(s.plan, "basic");
  assert.equal(s.canManage, true);
  assert.equal(s.canSubscribe, true);
});

test("a cancelled subscription is free; a by-hand Enterprise one has nothing to manage here", () => {
  const cancelled = summariseBilling(sub({ status: "cancelled" }), NOW);
  assert.equal(cancelled.state, "free");
  assert.equal(cancelled.canSubscribe, true);
  assert.equal(cancelled.canManage, false);

  const manual = summariseBilling(
    sub({ plan: "enterprise", source: "manual", subscriptionCode: null, currency: null }),
    NOW,
  );
  assert.equal(manual.state, "manual");
  assert.equal(manual.plan, "enterprise");
  assert.equal(manual.canManage, false);
  assert.equal(manual.canSubscribe, false);
});

test("a paid row with no Paystack subscription code cannot be managed (nothing to act on)", () => {
  assert.equal(summariseBilling(sub({ subscriptionCode: null }), NOW).canManage, false);
});

test("only prices with a Paystack plan behind them are offered", () => {
  assert.deepEqual(offeredPrices(new Map()), []);
  const offered = offeredPrices(
    new Map([
      ["standard.NGN.monthly", "PLN_a"],
      ["premium.NGN.annual", "PLN_d"],
      ["premium.USD.monthly", "PLN_u"],
    ]),
  );
  assert.deepEqual(offered, [
    { plan: "standard", currency: "NGN", interval: "monthly", amountMinor: 750_000 },
    { plan: "premium", currency: "NGN", interval: "annual", amountMinor: 25_000_000 },
    { plan: "premium", currency: "USD", interval: "monthly", amountMinor: 2_900 },
  ]);
});
