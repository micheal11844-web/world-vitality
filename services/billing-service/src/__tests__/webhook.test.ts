import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { handlePaystackWebhook, type WebhookDeps } from "../webhook.js";
import { InMemoryBillingStore, type BillingStore } from "../store.js";
import { parsePlanCodes, planForPlanCode } from "../paystack.js";
import type { SubscriptionState } from "../subscription.js";

const SECRET = "sk_test_not_a_real_key";
const CODES = parsePlanCodes(
  JSON.stringify({ "standard.NGN.monthly": "PLN_std", "premium.NGN.monthly": "PLN_prem" }),
);
const USER = "11111111-1111-4111-8111-111111111111";
const EMAIL = "ada@example.com";
const NOW = new Date("2026-11-15T12:00:00Z");

function setup(store: BillingStore = new InMemoryBillingStore()) {
  if (store instanceof InMemoryBillingStore) store.profiles.set(EMAIL, USER);
  const deps: WebhookDeps = {
    secret: SECRET,
    store,
    planFor: (code) => planForPlanCode(CODES, code),
    now: () => NOW,
  };
  return { store, deps };
}

/** Sends `payload` as Paystack would: raw JSON, signed with the secret. */
async function send(deps: WebhookDeps, payload: unknown, signWith = SECRET) {
  const raw = JSON.stringify(payload);
  const sig = createHmac("sha512", signWith).update(raw, "utf8").digest("hex");
  return handlePaystackWebhook(deps, raw, sig);
}

const customer = { customer_code: "CUS_1", email: EMAIL };
const create = (planCode = "PLN_std", subscriptionCode = "SUB_1") => ({
  event: "subscription.create",
  data: {
    subscription_code: subscriptionCode,
    next_payment_date: "2026-12-15T00:00:00.000Z",
    plan: { plan_code: planCode, currency: "NGN" },
    customer,
  },
});
const failed = (subscriptionCode = "SUB_1") => ({
  event: "invoice.payment_failed",
  data: { subscription: { subscription_code: subscriptionCode }, customer, invoice_code: "INV_1" },
});
const charged = (subscriptionCode = "SUB_1") => ({
  event: "charge.success",
  data: { reference: "r1", subscription: { subscription_code: subscriptionCode }, customer },
});
const notRenew = (nextPayment = "2026-12-15T00:00:00.000Z", subscriptionCode = "SUB_1") => ({
  event: "subscription.not_renew",
  data: { subscription_code: subscriptionCode, next_payment_date: nextPayment, customer },
});
const disable = (subscriptionCode = "SUB_1") => ({
  event: "subscription.disable",
  data: { subscription_code: subscriptionCode, customer },
});

test("a webhook with a bad signature is refused and changes nothing", async () => {
  const { store, deps } = setup();
  const result = await send(deps, create(), "sk_test_someone_else");
  assert.deepEqual(result, { status: 401, error: "bad_signature" });
  assert.equal((store as InMemoryBillingStore).subscriptions.size, 0);
  assert.equal((store as InMemoryBillingStore).events.size, 0);
});

test("no signature header at all is refused", async () => {
  const { deps } = setup();
  assert.deepEqual(await handlePaystackWebhook(deps, JSON.stringify(create()), null), {
    status: 401,
    error: "bad_signature",
  });
});

test("a new subscription is created for the person whose email Paystack was given", async () => {
  const { store, deps } = setup();
  assert.deepEqual(await send(deps, create()), { status: 200, outcome: "applied" });
  const sub = await store.getSubscription(USER);
  assert.deepEqual(sub, {
    userId: USER,
    plan: "standard",
    status: "active",
    source: "paystack",
    currency: "NGN",
    customerCode: "CUS_1",
    subscriptionCode: "SUB_1",
    currentPeriodEnd: "2026-12-15T00:00:00.000Z",
    pastDueSince: null,
    updatedAt: NOW.toISOString(),
  });
});

test("the same webhook delivered twice is applied once", async () => {
  const { store, deps } = setup();
  await send(deps, create());
  assert.deepEqual(await send(deps, create()), { status: 200, outcome: "duplicate" });
  assert.equal((store as InMemoryBillingStore).subscriptions.size, 1);
  assert.equal((store as InMemoryBillingStore).events.size, 1);
});

test("a full life: pay, miss a payment, recover, cancel, end", async () => {
  const { store, deps } = setup();
  await send(deps, create("PLN_prem"));
  assert.equal((await store.getSubscription(USER))?.plan, "premium");

  await send(deps, failed());
  let sub = await store.getSubscription(USER);
  assert.equal(sub?.status, "past_due");
  assert.equal(sub?.pastDueSince, NOW.toISOString());

  await send(deps, charged());
  sub = await store.getSubscription(USER);
  assert.equal(sub?.status, "active");
  assert.equal(sub?.pastDueSince, null);

  await send(deps, notRenew("2027-01-10T00:00:00.000Z"));
  sub = await store.getSubscription(USER);
  assert.equal(sub?.status, "non_renewing");
  assert.equal(sub?.currentPeriodEnd, "2027-01-10T00:00:00.000Z");

  await send(deps, disable());
  assert.equal((await store.getSubscription(USER))?.status, "cancelled");
});

test("later events find the subscription by its code even if the email differs", async () => {
  const { store, deps } = setup();
  await send(deps, create());
  const result = await send(deps, {
    event: "invoice.payment_failed",
    data: {
      subscription: { subscription_code: "SUB_1" },
      customer: { customer_code: "CUS_other", email: "someone-else@example.com" },
    },
  });
  assert.equal(result.status === 200 && result.outcome, "applied");
  assert.equal((await store.getSubscription(USER))?.status, "past_due");
});

test("a second failed payment does not push the grace period's start date forward", async () => {
  const { store, deps } = setup();
  await send(deps, create());
  await send(deps, failed());
  const later = { ...deps, now: () => new Date("2026-11-20T12:00:00Z") };
  await send(later, { ...failed(), data: { ...failed().data, invoice_code: "INV_2" } });
  assert.equal((await store.getSubscription(USER))?.pastDueSince, NOW.toISOString());
});

test("an event for someone we cannot identify is acknowledged, recorded, and changes nothing", async () => {
  const { store, deps } = setup();
  const result = await send(deps, {
    event: "subscription.create",
    data: { ...create().data, customer: { customer_code: "CUS_9", email: "nobody@example.com" } },
  });
  assert.deepEqual(result, { status: 200, outcome: "ignored", reason: "unknown_customer" });
  assert.equal((store as InMemoryBillingStore).subscriptions.size, 0);
  assert.equal((store as InMemoryBillingStore).events.size, 1);
});

test("a plan code that is not ours never creates a subscription", async () => {
  const { store, deps } = setup();
  const result = await send(deps, create("PLN_someone_elses"));
  assert.deepEqual(result, { status: 200, outcome: "ignored", reason: "unknown_plan" });
  assert.equal((store as InMemoryBillingStore).subscriptions.size, 0);
});

test("a cancellation that arrives before the creation is ignored, and the creation still works", async () => {
  const { store, deps } = setup();
  const early = await send(deps, disable());
  assert.deepEqual(early, { status: 200, outcome: "ignored", reason: "no_matching_subscription" });
  await send(deps, create());
  assert.equal((await store.getSubscription(USER))?.status, "active");
});

test("a late or replayed creation cannot bring a cancelled subscription back", async () => {
  const { store, deps } = setup();
  await send(deps, create());
  await send(deps, disable());
  // Same subscription code, different body (so not caught as a duplicate).
  const replay = {
    ...create(),
    data: { ...create().data, next_payment_date: "2026-12-16T00:00:00.000Z" },
  };
  assert.deepEqual(await send(deps, replay), {
    status: 200,
    outcome: "ignored",
    reason: "stale_create",
  });
  assert.equal((await store.getSubscription(USER))?.status, "cancelled");
});

test("signing up again after cancelling (a new subscription code) works", async () => {
  const { store, deps } = setup();
  await send(deps, create("PLN_std", "SUB_1"));
  await send(deps, disable("SUB_1"));
  await send(deps, create("PLN_prem", "SUB_2"));
  const sub = await store.getSubscription(USER);
  assert.equal(sub?.status, "active");
  assert.equal(sub?.plan, "premium");
  assert.equal(sub?.subscriptionCode, "SUB_2");
});

test("a failed payment on a subscription that is already ending changes nothing", async () => {
  const { store, deps } = setup();
  await send(deps, create());
  await send(deps, notRenew());
  const result = await send(deps, failed());
  assert.deepEqual(result, { status: 200, outcome: "ignored", reason: "not_billable" });
  assert.equal((await store.getSubscription(USER))?.status, "non_renewing");
});

test("a plan set by hand (Enterprise) is never changed by payment events", async () => {
  const { store, deps } = setup();
  const manual: SubscriptionState = {
    userId: USER,
    plan: "enterprise",
    status: "active",
    source: "manual",
    currency: null,
    customerCode: "CUS_1",
    subscriptionCode: null,
    currentPeriodEnd: null,
    pastDueSince: null,
    updatedAt: "2026-10-01T00:00:00.000Z",
  };
  await store.saveSubscription(manual);
  const result = await send(deps, create());
  assert.deepEqual(result, { status: 200, outcome: "ignored", reason: "manual_subscription" });
  assert.deepEqual(await store.getSubscription(USER), manual);
});

test("events we do not act on are acknowledged so Paystack stops retrying them", async () => {
  const { deps } = setup();
  const result = await send(deps, { event: "transfer.success", data: { customer } });
  assert.deepEqual(result, { status: 200, outcome: "ignored", reason: "unhandled_event" });
});

test("a signed body that is not an event is acknowledged, not retried", async () => {
  const { deps } = setup();
  const raw = "this is not json";
  const sig = createHmac("sha512", SECRET).update(raw, "utf8").digest("hex");
  assert.deepEqual(await handlePaystackWebhook(deps, raw, sig), {
    status: 200,
    outcome: "ignored",
    reason: "not_json",
  });
});

test("if saving fails, the error surfaces (so Paystack retries) and the event is NOT marked handled", async () => {
  const inner = new InMemoryBillingStore();
  const failing: BillingStore = {
    getSubscription: (u) => inner.getSubscription(u),
    findSubscriptionBySubscriptionCode: (c) => inner.findSubscriptionBySubscriptionCode(c),
    findUserIdByCustomerCode: (c) => inner.findUserIdByCustomerCode(c),
    findUserIdByEmail: (e) => inner.findUserIdByEmail(e),
    hasEvent: (k) => inner.hasEvent(k),
    recordEvent: (r) => inner.recordEvent(r),
    saveSubscription: async () => {
      throw new Error("database down");
    },
  };
  inner.profiles.set(EMAIL, USER);
  const { deps } = setup(failing);
  await assert.rejects(() => send(deps, create()), /database down/);
  assert.equal(inner.events.size, 0, "the retry must be able to apply it");

  // Once the database is back, the same delivery goes through.
  const { deps: healthy } = setup(inner);
  assert.deepEqual(await send(healthy, create()), { status: 200, outcome: "applied" });
});
