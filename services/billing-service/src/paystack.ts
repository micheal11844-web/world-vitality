import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { PaidPlanId } from "./plans.js";
import { PAID_PLAN_IDS } from "./plans.js";

/**
 * Everything specific to Paystack: checking that a webhook really came
 * from them, reading the events we act on, and building the request that
 * starts a subscription. No network calls happen here except through the
 * `fetch` the caller passes in, so all of it is testable offline.
 *
 * **Not run against Paystack's live or test API from this build
 * environment** (the sandbox cannot reach it). Field names below follow
 * Paystack's published docs (paystack.com/docs/payments/webhooks,
 * /api/transaction); the first test-mode payment is the real check, and
 * the parser is written to ignore, not crash on, anything it does not
 * recognise.
 */

export type Currency = "NGN" | "USD";
export type Interval = "monthly" | "annual";

/* ------------------------------------------------------------------ */
/* Webhook signature                                                  */
/* ------------------------------------------------------------------ */

/**
 * Paystack signs every webhook: the `x-paystack-signature` header is the
 * HMAC-SHA512 of the *raw* request body, keyed with your secret key, as
 * lowercase hex. It must be computed over the exact bytes received —
 * re-serialising parsed JSON can change them — so callers pass the body
 * as read from the request, before any parsing.
 *
 * Compared in constant time. A missing/blank header, a missing secret, or
 * a signature of the wrong length is simply "not valid" (never throws).
 */
export function verifyPaystackSignature(
  rawBody: string,
  signature: string | null | undefined,
  secret: string,
): boolean {
  if (!secret || !signature) return false;
  const expected = createHmac("sha512", secret).update(rawBody, "utf8").digest();
  const given = Buffer.from(signature.trim().toLowerCase(), "hex");
  // `Buffer.from(…, "hex")` stops at the first non-hex character, so a
  // malformed header yields a short buffer and fails the length check.
  if (given.length !== expected.length) return false;
  return timingSafeEqual(expected, given);
}

/* ------------------------------------------------------------------ */
/* Events                                                             */
/* ------------------------------------------------------------------ */

/** What we need from a webhook, reduced to the fields we act on. */
export interface PaystackEvent {
  /** Paystack's event name, e.g. "subscription.create". */
  type: string;
  /**
   * Stable across redeliveries of the same webhook, different for
   * different events. Paystack sends no event id, but a retry is the
   * identical body, so a hash of the raw body is a safe key.
   */
  key: string;
  customerCode: string | null;
  email: string | null;
  subscriptionCode: string | null;
  planCode: string | null;
  currency: string | null;
  /** ISO timestamp, as sent. */
  nextPaymentDate: string | null;
}

export type ParseResult = { ok: true; event: PaystackEvent } | { ok: false; reason: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function pick(root: unknown, ...path: string[]): unknown {
  let cur: unknown = root;
  for (const step of path) {
    if (!isRecord(cur)) return undefined;
    cur = cur[step];
  }
  return cur;
}

/**
 * Reads a webhook body. Only checks the shape of the fields we use; an
 * event type we do not handle still parses (the caller decides to ignore
 * it). `subscription.*` events carry the subscription code at
 * `data.subscription_code`; `invoice.*` and `charge.*` events carry it
 * under `data.subscription.subscription_code`.
 */
export function parsePaystackEvent(rawBody: string): ParseResult {
  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return { ok: false, reason: "not_json" };
  }
  if (!isRecord(body)) return { ok: false, reason: "not_an_object" };
  const type = text(body.event);
  if (!type) return { ok: false, reason: "no_event_name" };
  const data = body.data;
  if (!isRecord(data)) return { ok: false, reason: "no_data" };

  const subscriptionCode =
    text(data.subscription_code) ?? text(pick(data, "subscription", "subscription_code"));
  const planCode = text(pick(data, "plan", "plan_code"));
  const currency = text(pick(data, "plan", "currency")) ?? text(data.currency);
  const nextPaymentDate =
    text(data.next_payment_date) ?? text(pick(data, "subscription", "next_payment_date"));

  return {
    ok: true,
    event: {
      type,
      key: `${type}:${createHash("sha256").update(rawBody, "utf8").digest("hex")}`,
      customerCode: text(pick(data, "customer", "customer_code")),
      email: text(pick(data, "customer", "email"))?.toLowerCase() ?? null,
      subscriptionCode,
      planCode,
      currency,
      nextPaymentDate,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Plan codes                                                         */
/* ------------------------------------------------------------------ */

/**
 * Paystack plans are created in the Paystack dashboard (a plan is a fixed
 * amount, currency and interval), and each has a code like `PLN_xxxx`.
 * We keep the mapping in ONE environment variable, `PAYSTACK_PLAN_CODES`,
 * as JSON, e.g.
 *
 *   {"standard.NGN.monthly":"PLN_aaa","standard.NGN.annual":"PLN_bbb",
 *    "premium.USD.monthly":"PLN_ccc"}
 *
 * Plan codes are identifiers, not secrets. An entry may be left out: that
 * plan/currency/interval then simply cannot be bought yet.
 */
export type PlanCodeMap = ReadonlyMap<string, string>;

export function planCodeKey(plan: PaidPlanId, currency: Currency, interval: Interval): string {
  return `${plan}.${currency}.${interval}`;
}

export function parsePlanCodes(raw: string | undefined | null): PlanCodeMap {
  const map = new Map<string, string>();
  if (!raw) return map;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return map;
  }
  if (!isRecord(parsed)) return map;
  const keyPattern = new RegExp(`^(${PAID_PLAN_IDS.join("|")})\\.(NGN|USD)\\.(monthly|annual)$`);
  for (const [key, value] of Object.entries(parsed)) {
    const code = text(value);
    if (keyPattern.test(key) && code) map.set(key, code);
  }
  return map;
}

/** Which paid plan does a Paystack plan code belong to? `null` if it is not one of ours. */
export function planForPlanCode(codes: PlanCodeMap, planCode: string | null): PaidPlanId | null {
  if (!planCode) return null;
  for (const [key, code] of codes) {
    if (code === planCode) {
      const plan = key.split(".")[0];
      return (PAID_PLAN_IDS as readonly string[]).includes(plan ?? "")
        ? (plan as PaidPlanId)
        : null;
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Starting a subscription                                            */
/* ------------------------------------------------------------------ */

export const PAYSTACK_API = "https://api.paystack.co";

/** In the currency's smallest unit (kobo / cents). Ignored by Paystack when a plan is given — verify in test mode. */
const PLACEHOLDER_AMOUNT_MINOR = 10000;

export interface CheckoutInput {
  /** The signed-in person's account email — Paystack's customer is keyed on it. */
  email: string;
  userId: string;
  plan: PaidPlanId;
  currency: Currency;
  interval: Interval;
  /** Where Paystack sends the person back to after paying. */
  callbackUrl: string;
}

export type CheckoutResult =
  | { ok: true; authorizationUrl: string; reference: string }
  | { ok: false; reason: "unavailable" | "paystack_error" | "network_error" };

type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string },
) => Promise<{ ok: boolean; json(): Promise<unknown> }>;

/**
 * Asks Paystack for a hosted checkout page that, once paid, creates the
 * subscription. The person types their card on Paystack's page — card
 * details never touch this app. When `plan` is sent, Paystack takes the
 * amount from the plan rather than from a body `amount`, so no price is
 * set (or settable) from our side.
 *
 * `unavailable` means there is no plan code configured for that
 * combination — checkout stays off until one is set.
 */
export async function startCheckout(
  deps: { secret: string; planCodes: PlanCodeMap; fetch: FetchLike },
  input: CheckoutInput,
): Promise<CheckoutResult> {
  const planCode = deps.planCodes.get(planCodeKey(input.plan, input.currency, input.interval));
  if (!deps.secret || !planCode) return { ok: false, reason: "unavailable" };

  let response: Awaited<ReturnType<FetchLike>>;
  try {
    response = await deps.fetch(`${PAYSTACK_API}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${deps.secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: input.email,
        plan: planCode,
        // The API requires an amount, but with `plan` set Paystack uses the
        // plan's amount instead. A harmless placeholder, not a price.
        amount: PLACEHOLDER_AMOUNT_MINOR,
        currency: input.currency,
        callback_url: input.callbackUrl,
        metadata: { user_id: input.userId, plan: input.plan },
      }),
    });
  } catch {
    return { ok: false, reason: "network_error" };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { ok: false, reason: "paystack_error" };
  }
  const url = text(pick(payload, "data", "authorization_url"));
  const reference = text(pick(payload, "data", "reference"));
  if (!response.ok || pick(payload, "status") !== true || !url || !reference) {
    return { ok: false, reason: "paystack_error" };
  }
  return { ok: true, authorizationUrl: url, reference };
}
