import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  PAYSTACK_API,
  parsePaystackEvent,
  parsePlanCodes,
  planCodeKey,
  planForPlanCode,
  startCheckout,
  verifyPaystackSignature,
} from "../paystack.js";

const SECRET = "sk_test_not_a_real_key";
const sign = (body: string, secret = SECRET) =>
  createHmac("sha512", secret).update(body, "utf8").digest("hex");

/* ---------- signature ---------- */

test("the signature check agrees with a published HMAC-SHA512 test vector (RFC 4231, case 2)", () => {
  const body = "what do ya want for nothing?";
  const vector =
    "164b7a7bfcf819e2e395fbe73b56e0a387bd64222e831fd610270cd7ea2505549758bf75c05a994a6d034f65f8f0e6fdcaeab1a34d4a6b4b636e070a38bce737";
  assert.equal(verifyPaystackSignature(body, vector, "Jefe"), true);
});

test("a correctly signed body verifies; hex case and padding do not matter", () => {
  const body = '{"event":"charge.success","data":{}}';
  const sig = sign(body);
  assert.equal(verifyPaystackSignature(body, sig, SECRET), true);
  assert.equal(verifyPaystackSignature(body, sig.toUpperCase(), SECRET), true);
  assert.equal(verifyPaystackSignature(body, ` ${sig}\n`, SECRET), true);
});

test("a changed body, a wrong key, or a missing signature all fail", () => {
  const body = '{"event":"charge.success","data":{}}';
  const sig = sign(body);
  assert.equal(verifyPaystackSignature(body + " ", sig, SECRET), false);
  assert.equal(verifyPaystackSignature(body, sig, "sk_test_other"), false);
  assert.equal(verifyPaystackSignature(body, sign(body, "sk_test_other"), SECRET), false);
  assert.equal(verifyPaystackSignature(body, null, SECRET), false);
  assert.equal(verifyPaystackSignature(body, undefined, SECRET), false);
  assert.equal(verifyPaystackSignature(body, "", SECRET), false);
});

test("with no secret configured nothing verifies — not even an empty signature", () => {
  const body = "{}";
  assert.equal(verifyPaystackSignature(body, sign(body, ""), ""), false);
  assert.equal(verifyPaystackSignature(body, "", ""), false);
});

test("a malformed or wrong-length signature fails without throwing", () => {
  const body = "{}";
  for (const bad of [
    "zzzz",
    "abc",
    sign(body).slice(0, 100),
    sign(body) + "00",
    "0x" + sign(body),
  ]) {
    assert.equal(verifyPaystackSignature(body, bad, SECRET), false);
  }
});

/* ---------- events ---------- */

const created = JSON.stringify({
  event: "subscription.create",
  data: {
    status: "active",
    subscription_code: "SUB_abc",
    next_payment_date: "2026-12-15T00:00:00.000Z",
    plan: { plan_code: "PLN_std", currency: "NGN", amount: 500000 },
    customer: { customer_code: "CUS_xyz", email: "Ada@Example.com" },
  },
});

test("a subscription.create body is reduced to the fields we use", () => {
  const parsed = parsePaystackEvent(created);
  assert.ok(parsed.ok);
  assert.deepEqual(
    { ...parsed.event, key: undefined },
    {
      type: "subscription.create",
      key: undefined,
      customerCode: "CUS_xyz",
      email: "ada@example.com",
      subscriptionCode: "SUB_abc",
      planCode: "PLN_std",
      currency: "NGN",
      nextPaymentDate: "2026-12-15T00:00:00.000Z",
    },
  );
});

test("invoice events carry the subscription code one level down", () => {
  const parsed = parsePaystackEvent(
    JSON.stringify({
      event: "invoice.payment_failed",
      data: {
        subscription: {
          subscription_code: "SUB_abc",
          next_payment_date: "2026-12-15T00:00:00.000Z",
        },
        customer: { customer_code: "CUS_xyz", email: "ada@example.com" },
      },
    }),
  );
  assert.ok(parsed.ok);
  assert.equal(parsed.event.subscriptionCode, "SUB_abc");
  assert.equal(parsed.event.nextPaymentDate, "2026-12-15T00:00:00.000Z");
});

test("the same body always gives the same key; any change gives a different one", () => {
  const a = parsePaystackEvent(created);
  const b = parsePaystackEvent(created);
  const c = parsePaystackEvent(created.replace("SUB_abc", "SUB_abd"));
  assert.ok(a.ok && b.ok && c.ok);
  assert.equal(a.event.key, b.event.key);
  assert.notEqual(a.event.key, c.event.key);
  assert.ok(a.event.key.startsWith("subscription.create:"));
});

test("bodies that are not events are rejected with a reason, never thrown on", () => {
  assert.deepEqual(parsePaystackEvent("not json"), { ok: false, reason: "not_json" });
  assert.deepEqual(parsePaystackEvent("[1]"), { ok: false, reason: "not_an_object" });
  assert.deepEqual(parsePaystackEvent("{}"), { ok: false, reason: "no_event_name" });
  assert.deepEqual(parsePaystackEvent('{"event":"x"}'), { ok: false, reason: "no_data" });
});

test("an event type we do not handle still parses, with missing fields as null", () => {
  const parsed = parsePaystackEvent('{"event":"transfer.success","data":{"amount":5}}');
  assert.ok(parsed.ok);
  assert.equal(parsed.event.type, "transfer.success");
  assert.equal(parsed.event.customerCode, null);
  assert.equal(parsed.event.subscriptionCode, null);
});

/* ---------- plan codes ---------- */

test("plan codes are read from JSON, ignoring anything that is not a known plan/currency/interval", () => {
  const map = parsePlanCodes(
    JSON.stringify({
      "standard.NGN.monthly": "PLN_a",
      "premium.USD.annual": "PLN_b",
      "gold.NGN.monthly": "PLN_x",
      "standard.EUR.monthly": "PLN_y",
      "standard.NGN.weekly": "PLN_z",
      "premium.NGN.monthly": "",
      "standard.USD.monthly": 5,
    }),
  );
  assert.deepEqual([...map.entries()].sort(), [
    ["premium.USD.annual", "PLN_b"],
    ["standard.NGN.monthly", "PLN_a"],
  ]);
});

test("missing or broken plan-code config gives an empty map", () => {
  assert.equal(parsePlanCodes(undefined).size, 0);
  assert.equal(parsePlanCodes("").size, 0);
  assert.equal(parsePlanCodes("{oops").size, 0);
  assert.equal(parsePlanCodes("[]").size, 0);
});

test("a Paystack plan code maps back to the plan it belongs to", () => {
  const map = parsePlanCodes(
    JSON.stringify({ "standard.NGN.monthly": "PLN_a", "premium.NGN.monthly": "PLN_b" }),
  );
  assert.equal(planForPlanCode(map, "PLN_b"), "premium");
  assert.equal(planForPlanCode(map, "PLN_a"), "standard");
  assert.equal(planForPlanCode(map, "PLN_nope"), null);
  assert.equal(planForPlanCode(map, null), null);
});

/* ---------- checkout ---------- */

const CODES = parsePlanCodes(JSON.stringify({ "standard.NGN.monthly": "PLN_std" }));
const INPUT = {
  email: "ada@example.com",
  userId: "user-1",
  plan: "standard" as const,
  currency: "NGN" as const,
  interval: "monthly" as const,
  callbackUrl: "https://world-vitality.vercel.app/settings",
};

function fetchReturning(payload: unknown, ok = true) {
  const requests: {
    url: string;
    init: { method: string; headers: Record<string, string>; body: string };
  }[] = [];
  const fetch = async (
    url: string,
    init: { method: string; headers: Record<string, string>; body: string },
  ) => {
    requests.push({ url, init });
    return { ok, json: async () => payload };
  };
  return { fetch, requests };
}

test("checkout asks Paystack to initialise a transaction for the plan and returns the hosted page", async () => {
  const { fetch, requests } = fetchReturning({
    status: true,
    data: { authorization_url: "https://checkout.paystack.com/abc", reference: "ref_1" },
  });
  const result = await startCheckout({ secret: SECRET, planCodes: CODES, fetch }, INPUT);
  assert.deepEqual(result, {
    ok: true,
    authorizationUrl: "https://checkout.paystack.com/abc",
    reference: "ref_1",
  });
  assert.equal(requests.length, 1);
  const { url, init } = requests[0]!;
  assert.equal(url, `${PAYSTACK_API}/transaction/initialize`);
  assert.equal(init.method, "POST");
  assert.equal(init.headers.Authorization, `Bearer ${SECRET}`);
  const body = JSON.parse(init.body);
  assert.equal(body.plan, "PLN_std");
  assert.equal(body.email, "ada@example.com");
  assert.equal(body.currency, "NGN");
  assert.equal(body.callback_url, INPUT.callbackUrl);
  assert.deepEqual(body.metadata, { user_id: "user-1", plan: "standard" });
});

test("checkout is unavailable until a plan code and a secret are configured", async () => {
  const { fetch, requests } = fetchReturning({});
  assert.deepEqual(
    await startCheckout({ secret: SECRET, planCodes: CODES, fetch }, { ...INPUT, plan: "premium" }),
    {
      ok: false,
      reason: "unavailable",
    },
  );
  assert.deepEqual(await startCheckout({ secret: "", planCodes: CODES, fetch }, INPUT), {
    ok: false,
    reason: "unavailable",
  });
  assert.equal(requests.length, 0, "nothing is sent to Paystack when checkout is unavailable");
  assert.equal(planCodeKey("standard", "NGN", "monthly"), "standard.NGN.monthly");
});

test("checkout reports a Paystack refusal, an odd response, and a network failure", async () => {
  const refused = fetchReturning({ status: false, message: "Invalid key" }, false);
  assert.deepEqual(
    await startCheckout({ secret: SECRET, planCodes: CODES, fetch: refused.fetch }, INPUT),
    {
      ok: false,
      reason: "paystack_error",
    },
  );
  const odd = fetchReturning({ status: true, data: {} });
  assert.deepEqual(
    await startCheckout({ secret: SECRET, planCodes: CODES, fetch: odd.fetch }, INPUT),
    {
      ok: false,
      reason: "paystack_error",
    },
  );
  const down = async () => {
    throw new Error("offline");
  };
  assert.deepEqual(await startCheckout({ secret: SECRET, planCodes: CODES, fetch: down }, INPUT), {
    ok: false,
    reason: "network_error",
  });
  const notJson = async () => ({
    ok: true,
    json: async () => {
      throw new Error("bad json");
    },
  });
  assert.deepEqual(
    await startCheckout({ secret: SECRET, planCodes: CODES, fetch: notJson }, INPUT),
    {
      ok: false,
      reason: "paystack_error",
    },
  );
});
