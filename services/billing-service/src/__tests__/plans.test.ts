import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PAID_PLAN_IDS,
  PLANS,
  PLAN_IDS,
  UNBUILT_FEATURES,
  isPaidPlanId,
  isPlanId,
  type FeatureKey,
  type LimitKey,
} from "../plans.js";

const LIMITS: LimitKey[] = ["workspaces", "seats", "savedItems"];
const FEATURES = Object.keys(PLANS.basic.features) as FeatureKey[];

test("every plan defines every limit and every feature", () => {
  for (const id of PLAN_IDS) {
    const plan = PLANS[id];
    assert.equal(plan.id, id);
    for (const key of LIMITS) assert.ok(key in plan.limits, `${id} is missing limit ${key}`);
    for (const key of FEATURES) assert.equal(typeof plan.features[key], "boolean");
  }
});

test("each step up the ladder never takes anything away", () => {
  const ladder = ["basic", "standard", "premium"] as const;
  for (let i = 1; i < ladder.length; i++) {
    const lower = PLANS[ladder[i - 1]!];
    const higher = PLANS[ladder[i]!];
    for (const key of LIMITS) {
      assert.ok(
        (higher.limits[key] as number) > (lower.limits[key] as number),
        `${higher.id} ${key} should exceed ${lower.id}`,
      );
    }
    for (const key of FEATURES) {
      if (lower.features[key]) assert.ok(higher.features[key], `${higher.id} lost ${key}`);
    }
  }
});

test("Enterprise has no caps and every feature; Basic has no extra features", () => {
  for (const key of LIMITS) assert.equal(PLANS.enterprise.limits[key], null);
  assert.ok(FEATURES.every((f) => PLANS.enterprise.features[f]));
  assert.ok(FEATURES.every((f) => !PLANS.basic.features[f]));
});

test("only Standard and Premium can be bought by the customer themselves", () => {
  assert.deepEqual(
    PLAN_IDS.filter((id) => PLANS[id].selfServe),
    [...PAID_PLAN_IDS],
  );
  assert.equal(PLANS.basic.selfServe, false, "Basic is free, so there is nothing to buy");
  assert.equal(PLANS.enterprise.selfServe, false, "Enterprise is invoiced outside Paystack");
});

test("the features that are not built yet are known", () => {
  assert.deepEqual([...UNBUILT_FEATURES].sort(), [
    "apiAccess",
    "bulkExport",
    "emailAlerts",
    "integrations",
    "smsAlerts",
    "sso",
  ]);
  for (const feature of UNBUILT_FEATURES) assert.ok(FEATURES.includes(feature));
});

test("plan id guards", () => {
  assert.ok(isPlanId("premium"));
  assert.ok(!isPlanId("gold"));
  assert.ok(!isPlanId(undefined));
  assert.ok(isPaidPlanId("standard"));
  assert.ok(!isPaidPlanId("basic"));
  assert.ok(!isPaidPlanId("enterprise"));
});
