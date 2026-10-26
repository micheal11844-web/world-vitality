import { test } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseBillingStore } from "../store.js";
import type { SubscriptionState } from "../subscription.js";

interface Call {
  table: string;
  op: string;
  args: unknown[];
}
interface Result {
  data?: unknown;
  error?: { message: string; code?: string } | null;
}

/** A just-enough chainable fake, same idea as the one in identity-service's tests. */
function fakeClient(results: (table: string, calls: Call[]) => Result) {
  const calls: Call[] = [];
  function chain(table: string): Record<string, unknown> {
    const mine: Call[] = [];
    const resolve = () => {
      const r = results(table, mine);
      return { data: r.data ?? null, error: r.error ?? null };
    };
    const c: Record<string, unknown> = {
      then: (ok: (v: unknown) => unknown, bad?: (e: unknown) => unknown) =>
        Promise.resolve(resolve()).then(ok, bad),
      maybeSingle: async () => resolve(),
    };
    for (const op of ["select", "insert", "upsert", "eq"]) {
      c[op] = (...args: unknown[]) => {
        const call = { table, op, args };
        mine.push(call);
        calls.push(call);
        return c;
      };
    }
    return c;
  }
  return { client: { from: (t: string) => chain(t) } as unknown as SupabaseClient, calls };
}

const ROW = {
  user_id: "u1",
  plan: "premium",
  status: "active",
  source: "paystack",
  currency: "USD",
  paystack_customer_code: "CUS_1",
  paystack_subscription_code: "SUB_1",
  current_period_end: "2026-12-15T00:00:00Z",
  past_due_since: null,
  updated_at: "2026-11-15T12:00:00Z",
};

const STATE: SubscriptionState = {
  userId: "u1",
  plan: "premium",
  status: "past_due",
  source: "paystack",
  currency: "USD",
  customerCode: "CUS_1",
  subscriptionCode: "SUB_1",
  currentPeriodEnd: "2026-12-15T00:00:00Z",
  pastDueSince: "2026-11-14T00:00:00Z",
  updatedAt: "2026-11-15T12:00:00Z",
};

test("a stored row becomes a subscription", async () => {
  const { client, calls } = fakeClient(() => ({ data: ROW }));
  const sub = await new SupabaseBillingStore(client).getSubscription("u1");
  assert.deepEqual(sub, {
    userId: "u1",
    plan: "premium",
    status: "active",
    source: "paystack",
    currency: "USD",
    customerCode: "CUS_1",
    subscriptionCode: "SUB_1",
    currentPeriodEnd: "2026-12-15T00:00:00Z",
    pastDueSince: null,
    updatedAt: "2026-11-15T12:00:00Z",
  });
  assert.deepEqual(calls.find((c) => c.op === "eq")?.args, ["user_id", "u1"]);
});

test("no row means no subscription", async () => {
  const { client } = fakeClient(() => ({ data: null }));
  assert.equal(await new SupabaseBillingStore(client).getSubscription("u1"), null);
});

test("a row with a plan, status or source we do not know is treated as no subscription", async () => {
  for (const odd of [
    { plan: "gold" },
    { status: "paused" },
    { source: "stripe" },
    { plan: "basic" },
  ]) {
    const { client } = fakeClient(() => ({ data: { ...ROW, ...odd } }));
    assert.equal(await new SupabaseBillingStore(client).getSubscription("u1"), null);
  }
});

test("a database error is thrown, never read as 'no subscription'", async () => {
  const { client } = fakeClient(() => ({ error: { message: "boom" } }));
  await assert.rejects(() => new SupabaseBillingStore(client).getSubscription("u1"), /boom/);
});

test("lookups by subscription code, customer code and account email query the right columns", async () => {
  const { client, calls } = fakeClient((table) =>
    table === "billing_subscriptions" ? { data: { ...ROW } } : { data: { user_id: "u9" } },
  );
  const store = new SupabaseBillingStore(client);
  assert.equal((await store.findSubscriptionBySubscriptionCode("SUB_1"))?.userId, "u1");
  assert.equal(await store.findUserIdByCustomerCode("CUS_1"), "u1");
  assert.equal(await store.findUserIdByEmail("  Ada@Example.COM "), "u9");
  const eqs = calls.filter((c) => c.op === "eq").map((c) => [c.table, ...c.args]);
  assert.deepEqual(eqs, [
    ["billing_subscriptions", "paystack_subscription_code", "SUB_1"],
    ["billing_subscriptions", "paystack_customer_code", "CUS_1"],
    ["profiles", "email", "ada@example.com"],
  ]);
});

test("saving writes one row per person, replacing the old one", async () => {
  const { client, calls } = fakeClient(() => ({}));
  await new SupabaseBillingStore(client).saveSubscription(STATE);
  const upsert = calls.find((c) => c.op === "upsert");
  assert.equal(upsert?.table, "billing_subscriptions");
  assert.deepEqual(upsert?.args[0], {
    user_id: "u1",
    plan: "premium",
    status: "past_due",
    source: "paystack",
    currency: "USD",
    paystack_customer_code: "CUS_1",
    paystack_subscription_code: "SUB_1",
    current_period_end: "2026-12-15T00:00:00Z",
    past_due_since: "2026-11-14T00:00:00Z",
    updated_at: "2026-11-15T12:00:00Z",
  });
  assert.deepEqual(upsert?.args[1], { onConflict: "user_id" });
});

test("a save failure is thrown", async () => {
  const { client } = fakeClient(() => ({ error: { message: "disk full" } }));
  await assert.rejects(() => new SupabaseBillingStore(client).saveSubscription(STATE), /disk full/);
});

test("recording an event stores only what we need — never the payload", async () => {
  const { client, calls } = fakeClient(() => ({}));
  await new SupabaseBillingStore(client).recordEvent({
    key: "subscription.create:abc",
    type: "subscription.create",
    outcome: "applied",
    reason: null,
    userId: "u1",
  });
  assert.deepEqual(calls.find((c) => c.op === "insert")?.args[0], {
    event_key: "subscription.create:abc",
    event_type: "subscription.create",
    outcome: "applied",
    reason: null,
    user_id: "u1",
  });
});

test("recording an event that a concurrent delivery already recorded is fine; other errors are not", async () => {
  const dup = fakeClient(() => ({ error: { message: "duplicate key", code: "23505" } }));
  await new SupabaseBillingStore(dup.client).recordEvent({
    key: "k",
    type: "t",
    outcome: "ignored",
    reason: "x",
    userId: null,
  });
  const bad = fakeClient(() => ({ error: { message: "nope", code: "42501" } }));
  await assert.rejects(
    () =>
      new SupabaseBillingStore(bad.client).recordEvent({
        key: "k",
        type: "t",
        outcome: "ignored",
        reason: null,
        userId: null,
      }),
    /nope/,
  );
});

test("hasEvent is true only when a row exists", async () => {
  const yes = fakeClient(() => ({ data: { event_key: "k" } }));
  const no = fakeClient(() => ({ data: null }));
  assert.equal(await new SupabaseBillingStore(yes.client).hasEvent("k"), true);
  assert.equal(await new SupabaseBillingStore(no.client).hasEvent("k"), false);
});
