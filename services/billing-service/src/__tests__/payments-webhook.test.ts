import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { handlePaystackWebhook, type AppliedEvent, type WebhookDeps } from "../webhook.js";
import { InMemoryBillingStore } from "../store.js";
import { parsePlanCodes, planForPlanCode } from "../paystack.js";

const SECRET = "sk_test_not_a_real_key";
const CODES = parsePlanCodes(
  JSON.stringify({ "standard.NGN.monthly": "PLN_std", "premium.NGN.monthly": "PLN_prem" }),
);
const USER = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const EMAIL = "ada@example.com";
const NOW = new Date("2026-11-15T12:00:00Z");
const customer = { customer_code: "CUS_1", email: EMAIL };

function setup() {
  const store = new InMemoryBillingStore();
  store.profiles.set(EMAIL, USER);
  const applied: AppliedEvent[] = [];
  const deps: WebhookDeps = {
    secret: SECRET,
    store,
    planFor: (code) => planForPlanCode(CODES, code),
    now: () => NOW,
    onApplied: (event) => {
      applied.push(event);
    },
  };
  return { store, deps, applied };
}

async function send(deps: WebhookDeps, payload: unknown) {
  const raw = JSON.stringify(payload);
  const sig = createHmac("sha512", SECRET).update(raw, "utf8").digest("hex");
  return handlePaystackWebhook(deps, raw, sig);
}

const charge = (over: Record<string, unknown> = {}) => ({
  event: "charge.success",
  data: {
    reference: "ref_1",
    amount: 750000,
    currency: "NGN",
    status: "success",
    paid_at: "2026-11-15T10:30:00.000Z",
    plan: { plan_code: "PLN_std" },
    customer,
    ...over,
  },
});
const refund = (status: string, reference = "ref_1") => ({
  event: `refund.${status}`,
  data: { transaction_reference: reference, amount: "750000", customer },
});

test("the first payment is kept even though it arrives before the subscription exists", async () => {
  const { store, deps, applied } = setup();
  const result = await send(deps, charge());
  assert.deepEqual(result, { status: 200, outcome: "applied", reason: "payment_recorded" });
  assert.deepEqual(await store.getPayment("ref_1"), {
    reference: "ref_1",
    userId: USER,
    amountMinor: 750000,
    currency: "NGN",
    plan: "standard",
    paidAt: "2026-11-15T10:30:00.000Z",
    refundStatus: null,
  });
  // The plan did not change, so nobody is told anything.
  assert.equal(store.subscriptions.size, 0);
  assert.equal(applied.length, 0);
  assert.equal(store.events.size, 1);
});

test("a renewal payment is kept and changes nothing else", async () => {
  const { store, deps } = setup();
  await send(deps, {
    event: "subscription.create",
    data: {
      subscription_code: "SUB_1",
      next_payment_date: "2026-12-15T00:00:00.000Z",
      plan: { plan_code: "PLN_std", currency: "NGN" },
      customer,
    },
  });
  const before = { ...(await store.getSubscription(USER)) };
  await send(
    deps,
    charge({ reference: "ref_renew", subscription: { subscription_code: "SUB_1" } }),
  );
  assert.equal((await store.getPayment("ref_renew"))?.userId, USER);
  assert.deepEqual({ ...(await store.getSubscription(USER)) }, before);
});

test("the same payment delivered again, even as a different body, is kept once and keeps its refund", async () => {
  const { store, deps } = setup();
  await send(deps, charge());
  await send(deps, refund("processed"));
  // A different body for the same reference (so it is not caught as a duplicate event).
  await send(deps, charge({ paid_at: "2026-11-15T10:31:00.000Z" }));
  assert.equal(store.payments.size, 1);
  assert.equal((await store.getPayment("ref_1"))?.refundStatus, "processed");
  assert.equal((await store.getPayment("ref_1"))?.paidAt, "2026-11-15T10:30:00.000Z");
});

test("a payment we cannot read is acknowledged and not kept", async () => {
  const { store, deps } = setup();
  const result = await send(deps, charge({ amount: 0 }));
  assert.equal(result.status, 200);
  assert.equal(store.payments.size, 0);
});

test("a payment from someone we cannot identify is not kept", async () => {
  const { store, deps } = setup();
  const result = await send(
    deps,
    charge({ customer: { customer_code: "CUS_9", email: "stranger@example.com" } }),
  );
  assert.deepEqual(result, { status: 200, outcome: "ignored", reason: "unknown_customer" });
  assert.equal(store.payments.size, 0);
});

test("a payment for a plan that is not ours is still kept, with no plan", async () => {
  const { store, deps } = setup();
  await send(deps, charge({ plan: { plan_code: "PLN_other" } }));
  assert.equal((await store.getPayment("ref_1"))?.plan, null);
});

test("a payment with no paid time uses the time it was received", async () => {
  const { store, deps } = setup();
  await send(deps, charge({ paid_at: undefined }));
  assert.equal((await store.getPayment("ref_1"))?.paidAt, NOW.toISOString());
});

test("a refund moves its payment forward and the person is told once, when it is processed", async () => {
  const { store, deps, applied } = setup();
  await send(deps, charge());
  await send(deps, refund("pending"));
  assert.equal((await store.getPayment("ref_1"))?.refundStatus, "pending");
  assert.equal(applied.filter((e) => e.refund?.becameProcessed).length, 0);

  await send(deps, refund("processing"));
  const done = await send(deps, refund("processed"));
  assert.deepEqual(done, { status: 200, outcome: "applied" });
  assert.equal((await store.getPayment("ref_1"))?.refundStatus, "processed");
  const told = applied.filter((e) => e.refund?.becameProcessed);
  assert.equal(told.length, 1);
  assert.deepEqual(told[0], {
    userId: USER,
    type: "refund.processed",
    state: null,
    refund: { reference: "ref_1", status: "processed", becameProcessed: true, plan: "standard" },
  });
});

test("a late 'pending' after 'processed' changes nothing and tells no one", async () => {
  const { store, deps, applied } = setup();
  await send(deps, charge());
  await send(deps, refund("processed"));
  const before = applied.length;
  const late = await send(deps, refund("pending"));
  assert.deepEqual(late, { status: 200, outcome: "ignored", reason: "refund_no_change" });
  assert.equal((await store.getPayment("ref_1"))?.refundStatus, "processed");
  assert.equal(applied.length, before);
});

test("a refund of a payment we never kept is acknowledged, not retried, and tells no one", async () => {
  const { deps, applied } = setup();
  const result = await send(deps, refund("processed", "ref_unknown"));
  assert.deepEqual(result, { status: 200, outcome: "ignored", reason: "unknown_payment" });
  assert.equal(applied.length, 0);
});

test("a refund never changes the subscription", async () => {
  const { store, deps } = setup();
  await send(deps, {
    event: "subscription.create",
    data: {
      subscription_code: "SUB_1",
      next_payment_date: "2026-12-15T00:00:00.000Z",
      plan: { plan_code: "PLN_std", currency: "NGN" },
      customer,
    },
  });
  await send(deps, charge());
  const before = { ...(await store.getSubscription(USER)) };
  await send(deps, refund("processed"));
  assert.deepEqual({ ...(await store.getSubscription(USER)) }, before);
  assert.equal((await store.getSubscription(USER))?.status, "active");
});

test("a person's list holds only their own payments, newest first, capped", async () => {
  const { store, deps } = setup();
  store.profiles.set("bola@example.com", OTHER);
  await send(deps, charge({ reference: "a", paid_at: "2026-09-01T00:00:00Z" }));
  await send(deps, charge({ reference: "b", paid_at: "2026-11-01T00:00:00Z" }));
  await send(deps, charge({ reference: "c", paid_at: "2026-10-01T00:00:00Z" }));
  await send(
    deps,
    charge({ reference: "z", customer: { customer_code: "CUS_2", email: "bola@example.com" } }),
  );
  assert.deepEqual(
    (await store.listPayments(USER, 10)).map((p) => p.reference),
    ["b", "c", "a"],
  );
  assert.deepEqual(
    (await store.listPayments(USER, 2)).map((p) => p.reference),
    ["b", "c"],
  );
  assert.deepEqual(
    (await store.listPayments(OTHER, 10)).map((p) => p.reference),
    ["z"],
  );
});

test("if keeping the payment fails the error surfaces (so Paystack retries) and the event is not marked handled", async () => {
  const { store, deps } = setup();
  store.recordPayment = async () => {
    throw new Error("database is down");
  };
  await assert.rejects(() => send(deps, charge()), /database is down/);
  assert.equal(store.events.size, 0);
});
