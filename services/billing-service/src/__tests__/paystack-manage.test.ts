import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PAYSTACK_API,
  createManageLink,
  disableSubscription,
  fetchSubscription,
  paystackBaseUrl,
  startCheckout,
} from "../paystack.js";

const SECRET = "sk_test_not_a_real_key";

interface Call {
  url: string;
  init: { method: string; headers: Record<string, string>; body?: string };
}

/** A scripted Paystack: answers each call in order. */
function scripted(
  ...answers: { ok?: boolean; json?: unknown; throws?: boolean; badJson?: boolean }[]
) {
  const calls: Call[] = [];
  const fetch = async (url: string, init: Call["init"]) => {
    calls.push({ url, init });
    const answer = answers[Math.min(calls.length - 1, answers.length - 1)]!;
    if (answer.throws) throw new TypeError("fetch failed");
    return {
      ok: answer.ok ?? true,
      json: async () => {
        if (answer.badJson) throw new SyntaxError("not json");
        return answer.json;
      },
    };
  };
  return { fetch, calls };
}

const SUB = {
  status: true,
  data: {
    subscription_code: "SUB_abc",
    email_token: "tok_123",
    status: "active",
    next_payment_date: "2026-12-15T00:00:00.000Z",
  },
};

/* ---------- the address we call ---------- */

test("the Paystack address is Paystack's own unless a safe override is given", () => {
  assert.equal(paystackBaseUrl(undefined), PAYSTACK_API);
  assert.equal(paystackBaseUrl(""), PAYSTACK_API);
  assert.equal(paystackBaseUrl("https://stand-in.example.com/"), "https://stand-in.example.com");
  assert.equal(paystackBaseUrl("http://127.0.0.1:54398"), "http://127.0.0.1:54398");
  assert.equal(paystackBaseUrl("http://localhost:3000/api/"), "http://localhost:3000/api");
});

test("an override that would send the secret key unencrypted, or is not an address, is ignored", () => {
  assert.equal(paystackBaseUrl("http://example.com"), PAYSTACK_API);
  assert.equal(paystackBaseUrl("ftp://127.0.0.1"), PAYSTACK_API);
  assert.equal(paystackBaseUrl("javascript:alert(1)"), PAYSTACK_API);
  assert.equal(paystackBaseUrl("not a url"), PAYSTACK_API);
});

test("checkout, and the management calls, use the given base address", async () => {
  const sc = scripted({
    json: { status: true, data: { authorization_url: "https://c.example/x", reference: "r" } },
  });
  await startCheckout(
    {
      secret: SECRET,
      planCodes: new Map([["standard.NGN.monthly", "PLN_a"]]),
      fetch: sc.fetch as never,
      baseUrl: "http://127.0.0.1:1",
    },
    {
      email: "a@b.c",
      userId: "u",
      plan: "standard",
      currency: "NGN",
      interval: "monthly",
      callbackUrl: "https://app.example/billing",
    },
  );
  assert.equal(sc.calls[0]!.url, "http://127.0.0.1:1/transaction/initialize");
  const m = scripted({ json: SUB });
  await fetchSubscription(
    { secret: SECRET, fetch: m.fetch, baseUrl: "http://127.0.0.1:1" },
    "SUB_abc",
  );
  assert.equal(m.calls[0]!.url, "http://127.0.0.1:1/subscription/SUB_abc");
});

/* ---------- reading a subscription ---------- */

test("reading a subscription asks Paystack with the secret and returns only what we use", async () => {
  const { fetch, calls } = scripted({ json: SUB });
  const result = await fetchSubscription({ secret: SECRET, fetch }, "SUB_abc");
  assert.deepEqual(result, {
    ok: true,
    subscription: {
      code: "SUB_abc",
      emailToken: "tok_123",
      status: "active",
      nextPaymentDate: "2026-12-15T00:00:00.000Z",
    },
  });
  assert.equal(calls[0]!.url, `${PAYSTACK_API}/subscription/SUB_abc`);
  assert.equal(calls[0]!.init.method, "GET");
  assert.equal(calls[0]!.init.headers.Authorization, `Bearer ${SECRET}`);
  assert.equal(calls[0]!.init.body, undefined);
});

test("a subscription code that is not a plain identifier never reaches Paystack", async () => {
  const { fetch, calls } = scripted({ json: SUB });
  for (const code of [
    "",
    "../customer",
    "SUB_abc/manage",
    "SUB abc",
    "SUB_abc?x=1",
    "a".repeat(101),
  ]) {
    assert.deepEqual(await fetchSubscription({ secret: SECRET, fetch }, code), {
      ok: false,
      reason: "not_found",
    });
    assert.deepEqual(await createManageLink({ secret: SECRET, fetch }, code), {
      ok: false,
      reason: "not_found",
    });
    assert.deepEqual(await disableSubscription({ secret: SECRET, fetch }, code), {
      ok: false,
      reason: "not_found",
    });
  }
  assert.equal(calls.length, 0);
});

test("reading a subscription reports no secret, an unknown code, a refusal, a bad body, an outage", async () => {
  assert.deepEqual(await fetchSubscription({ secret: "", fetch: scripted({}).fetch }, "SUB_a"), {
    ok: false,
    reason: "unavailable",
  });
  assert.deepEqual(
    await fetchSubscription(
      {
        secret: SECRET,
        fetch: scripted({ ok: false, json: { status: false, message: "Subscription not found" } })
          .fetch,
      },
      "SUB_a",
    ),
    { ok: false, reason: "not_found" },
  );
  assert.deepEqual(
    await fetchSubscription(
      {
        secret: SECRET,
        fetch: scripted({ ok: false, json: { status: false, message: "Invalid key" } }).fetch,
      },
      "SUB_a",
    ),
    { ok: false, reason: "paystack_error" },
  );
  assert.deepEqual(
    await fetchSubscription({ secret: SECRET, fetch: scripted({ badJson: true }).fetch }, "SUB_a"),
    { ok: false, reason: "paystack_error" },
  );
  // a "successful" answer with no token cannot be used to cancel anything
  assert.deepEqual(
    await fetchSubscription(
      { secret: SECRET, fetch: scripted({ json: { status: true, data: {} } }).fetch },
      "SUB_a",
    ),
    { ok: false, reason: "paystack_error" },
  );
  assert.deepEqual(
    await fetchSubscription({ secret: SECRET, fetch: scripted({ throws: true }).fetch }, "SUB_a"),
    { ok: false, reason: "network_error" },
  );
});

/* ---------- the card-update link ---------- */

test("the card-update link comes back only as an https address", async () => {
  const ok = scripted({
    json: {
      status: true,
      data: { link: "https://paystack.com/manage/subscription?subscription_token=t" },
    },
  });
  assert.deepEqual(await createManageLink({ secret: SECRET, fetch: ok.fetch }, "SUB_abc"), {
    ok: true,
    link: "https://paystack.com/manage/subscription?subscription_token=t",
  });
  assert.equal(ok.calls[0]!.url, `${PAYSTACK_API}/subscription/SUB_abc/manage/link`);

  for (const link of [
    "javascript:alert(1)",
    "http://evil.example/x",
    "//evil.example/x",
    "",
    undefined,
  ]) {
    assert.deepEqual(
      await createManageLink(
        { secret: SECRET, fetch: scripted({ json: { status: true, data: { link } } }).fetch },
        "SUB_abc",
      ),
      { ok: false, reason: "paystack_error" },
      `refused: ${String(link)}`,
    );
  }
  // …but the local stand-in used in tests (http on this machine) is allowed
  assert.deepEqual(
    await createManageLink(
      {
        secret: SECRET,
        fetch: scripted({ json: { status: true, data: { link: "http://127.0.0.1:54398/manage" } } })
          .fetch,
      },
      "SUB_abc",
    ),
    { ok: true, link: "http://127.0.0.1:54398/manage" },
  );
});

/* ---------- cancelling ---------- */

test("cancelling reads the subscription's token, then disables it with the code and that token", async () => {
  const { fetch, calls } = scripted(
    { json: SUB },
    { json: { status: true, message: "Subscription disabled successfully" } },
  );
  assert.deepEqual(await disableSubscription({ secret: SECRET, fetch }, "SUB_abc"), { ok: true });
  assert.equal(calls.length, 2);
  assert.equal(calls[0]!.init.method, "GET");
  assert.equal(calls[1]!.url, `${PAYSTACK_API}/subscription/disable`);
  assert.equal(calls[1]!.init.method, "POST");
  assert.deepEqual(JSON.parse(calls[1]!.init.body!), { code: "SUB_abc", token: "tok_123" });
});

test("cancelling reports failure at either step and never claims success it did not get", async () => {
  // can't read the subscription → nothing is disabled
  const first = scripted({ ok: false, json: { status: false, message: "Subscription not found" } });
  assert.deepEqual(await disableSubscription({ secret: SECRET, fetch: first.fetch }, "SUB_abc"), {
    ok: false,
    reason: "not_found",
  });
  assert.equal(first.calls.length, 1);
  // read works, the disable is refused
  const second = scripted(
    { json: SUB },
    { ok: false, json: { status: false, message: "Invalid token" } },
  );
  assert.deepEqual(await disableSubscription({ secret: SECRET, fetch: second.fetch }, "SUB_abc"), {
    ok: false,
    reason: "paystack_error",
  });
  // read works, the disable call drops
  const third = scripted({ json: SUB }, { throws: true });
  assert.deepEqual(await disableSubscription({ secret: SECRET, fetch: third.fetch }, "SUB_abc"), {
    ok: false,
    reason: "network_error",
  });
});

test("the email token is never in anything returned except to the cancelling call itself", async () => {
  const { fetch } = scripted({ json: SUB }, { json: { status: true } });
  const result = await disableSubscription({ secret: SECRET, fetch }, "SUB_abc");
  assert.ok(!JSON.stringify(result).includes("tok_123"));
});

test("cancelling something Paystack already stopped succeeds without a second call", async () => {
  for (const status of ["non-renewing", "cancelled", "completed"]) {
    const { fetch, calls } = scripted({ json: { ...SUB, data: { ...SUB.data, status } } });
    assert.deepEqual(await disableSubscription({ secret: SECRET, fetch }, "SUB_abc"), { ok: true });
    assert.equal(calls.length, 1, `${status}: only the read, no disable`);
  }
  // …but an attention/active one is still disabled
  const live = scripted(
    { json: { ...SUB, data: { ...SUB.data, status: "attention" } } },
    { json: { status: true } },
  );
  assert.deepEqual(await disableSubscription({ secret: SECRET, fetch: live.fetch }, "SUB_abc"), {
    ok: true,
  });
  assert.equal(live.calls.length, 2);
});
