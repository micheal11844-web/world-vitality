import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PAST_DUE_GRACE_DAYS,
  checkLimit,
  effectivePlan,
  entitlementsFor,
  hasFeature,
  isFeatureBuilt,
  isOverLimit,
  limitReachedMessage,
  loadEntitlements,
  unlimitedEntitlements,
} from "../entitlements.js";
import type { SubscriptionState } from "../subscription.js";

const NOW = new Date("2026-11-15T12:00:00Z");
const day = (n: number) => new Date(NOW.getTime() + n * 24 * 60 * 60 * 1000).toISOString();

function sub(overrides: Partial<SubscriptionState> = {}): SubscriptionState {
  return {
    userId: "u1",
    plan: "standard",
    status: "active",
    source: "paystack",
    currency: "NGN",
    customerCode: "CUS_1",
    subscriptionCode: "SUB_1",
    currentPeriodEnd: day(10),
    pastDueSince: null,
    updatedAt: NOW.toISOString(),
    ...overrides,
  };
}

/* ---------- which plan applies ---------- */

test("no subscription means Basic", () => {
  assert.equal(effectivePlan(null, NOW), "basic");
});

test("an active subscription gives its plan", () => {
  assert.equal(effectivePlan(sub({ plan: "premium" }), NOW), "premium");
});

test("a cancelled-but-paid subscription keeps its plan until the paid term ends", () => {
  assert.equal(
    effectivePlan(sub({ status: "non_renewing", currentPeriodEnd: day(3) }), NOW),
    "standard",
  );
  assert.equal(
    effectivePlan(sub({ status: "non_renewing", currentPeriodEnd: day(-1) }), NOW),
    "basic",
  );
});

test("a cancelled-but-paid subscription with no known end date keeps its plan until Paystack disables it", () => {
  assert.equal(
    effectivePlan(sub({ status: "non_renewing", currentPeriodEnd: null }), NOW),
    "standard",
  );
});

test("a failed payment keeps the plan through the grace period, then drops to Basic", () => {
  const within = sub({ status: "past_due", pastDueSince: day(-(PAST_DUE_GRACE_DAYS - 1)) });
  const after = sub({ status: "past_due", pastDueSince: day(-(PAST_DUE_GRACE_DAYS + 1)) });
  assert.equal(effectivePlan(within, NOW), "standard");
  assert.equal(effectivePlan(after, NOW), "basic");
});

test("a cancelled subscription is Basic", () => {
  assert.equal(effectivePlan(sub({ status: "cancelled" }), NOW), "basic");
});

/* ---------- loading ---------- */

test("with billing off, everyone is unlimited and the database is not asked", async () => {
  let asked = 0;
  const e = await loadEntitlements(
    {
      enabled: false,
      getSubscription: async () => {
        asked++;
        return null;
      },
    },
    "u1",
  );
  assert.equal(asked, 0);
  assert.equal(e.enforced, false);
  assert.equal(e.source, "billing_off");
  assert.equal(checkLimit(e, "seats", 9999).allowed, true);
  assert.equal(hasFeature(e, "auditLog"), true);
});

test("with billing on and no subscription, the person is on Basic and it is enforced", async () => {
  const e = await loadEntitlements(
    { enabled: true, getSubscription: async () => null, now: () => NOW },
    "u1",
  );
  assert.equal(e.plan, "basic");
  assert.equal(e.enforced, true);
  assert.equal(e.source, "subscription");
});

test("if the subscription cannot be read, it fails open and reports the error", async () => {
  const errors: unknown[] = [];
  const e = await loadEntitlements(
    {
      enabled: true,
      getSubscription: async () => {
        throw new Error("database down");
      },
      onError: (err) => errors.push(err),
    },
    "u1",
  );
  assert.equal(e.enforced, false);
  assert.equal(e.source, "lookup_failed");
  assert.equal(errors.length, 1);
  assert.equal(checkLimit(e, "savedItems", 500).allowed, true);
});

/* ---------- limits ---------- */

test("adding one more is allowed up to the limit and refused at it", () => {
  const basic = entitlementsFor("basic"); // 3 saved items
  assert.deepEqual(checkLimit(basic, "savedItems", 2), { allowed: true, limit: 3, remaining: 1 });
  assert.deepEqual(checkLimit(basic, "savedItems", 3), { allowed: false, limit: 3, remaining: 0 });
  assert.deepEqual(checkLimit(basic, "savedItems", 7), { allowed: false, limit: 3, remaining: 0 });
});

test("a plan with no cap never refuses", () => {
  const ent = entitlementsFor("enterprise");
  assert.deepEqual(checkLimit(ent, "seats", 100000), {
    allowed: true,
    limit: null,
    remaining: null,
  });
});

test("after a downgrade, only a count strictly above the limit is over it — and nothing is deleted", () => {
  const basic = entitlementsFor("basic");
  assert.equal(isOverLimit(basic, "savedItems", 3), false);
  assert.equal(isOverLimit(basic, "savedItems", 4), true);
  assert.equal(isOverLimit(entitlementsFor("enterprise"), "savedItems", 4000), false);
  assert.equal(isOverLimit(unlimitedEntitlements("billing_off"), "savedItems", 4000), false);
});

test("features follow the plan when enforced, and are all on when not", () => {
  assert.equal(hasFeature(entitlementsFor("basic"), "forecastOutlooks"), false);
  assert.equal(hasFeature(entitlementsFor("standard"), "forecastOutlooks"), true);
  assert.equal(hasFeature(entitlementsFor("standard"), "auditLog"), false);
  assert.equal(hasFeature(entitlementsFor("premium"), "auditLog"), true);
  assert.equal(hasFeature(unlimitedEntitlements("lookup_failed"), "auditLog"), true);
});

test("features that are not built are reported as such", () => {
  assert.equal(isFeatureBuilt("emailAlerts"), false);
  assert.equal(isFeatureBuilt("csvExport"), true);
});

test("the limit message names the plan and the number, and gets singular and plural right", () => {
  const basic = entitlementsFor("basic");
  assert.equal(
    limitReachedMessage(basic, "seats", 1),
    "Your Basic plan includes up to 1 person. Upgrade your plan to add more.",
  );
  assert.equal(
    limitReachedMessage(entitlementsFor("standard"), "seats", 5),
    "Your Standard plan includes up to 5 people. Upgrade your plan to add more.",
  );
  assert.match(
    limitReachedMessage(basic, "savedItems", 3),
    /^Your Basic plan includes up to 3 saved items \(/,
  );
  assert.match(limitReachedMessage(basic, "savedItems", 1), /up to 1 saved item \(/);
});
