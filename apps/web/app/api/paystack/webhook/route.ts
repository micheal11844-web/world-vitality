import { NextResponse } from "next/server";
import { handlePaystackWebhook } from "@world-vitality/billing-service";
import { billingEnabled, getBillingStore, planForCode } from "../../../../lib/billing";
import { logApplication, logSecurity } from "../../../../lib/logger";

// `node:crypto` (signature check) needs the Node runtime, and a webhook
// must never be cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Paystack's events are a few KB; anything this large is not one. */
const MAX_BODY_CHARS = 200_000;

/**
 * Paystack's webhook endpoint (BUILD_PLAN "v90"). Point Paystack at
 * `https://<domain>/api/paystack/webhook` (Dashboard → Settings → API Keys
 * & Webhooks) once billing is switched on.
 *
 * - Billing off → 404, as if the route did not exist.
 * - No `PAYSTACK_SECRET_KEY` → 503: refuse everything rather than accept
 *   unverified events. (The same key signs the webhooks; Paystack has no
 *   separate webhook secret.)
 * - The signature is checked on the RAW body before anything else is read.
 *   A bad one gets 401 and a security log line.
 * - Anything signed but unrecognised, or already handled, gets 200 — any
 *   non-200 makes Paystack retry for 72 hours.
 * - A storage failure gets 500 so Paystack retries; the handler applies
 *   events idempotently, so a retry is safe.
 *
 * Nothing from the body (email, card, bank details) is logged.
 *
 * Only POST is exported, so any other method gets Next's 405.
 */
export async function POST(request: Request) {
  if (!billingEnabled()) return new NextResponse(null, { status: 404 });

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    logApplication.error("paystack_webhook_no_secret", new Error("PAYSTACK_SECRET_KEY is not set"));
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_CHARS) {
    return NextResponse.json({ error: "too_large" }, { status: 413 });
  }

  try {
    const result = await handlePaystackWebhook(
      { secret, store: getBillingStore(), planFor: planForCode },
      raw,
      request.headers.get("x-paystack-signature"),
    );
    if (result.status === 401) {
      logSecurity.warn("paystack_webhook_bad_signature");
      return NextResponse.json({ error: "bad_signature" }, { status: 401 });
    }
    logApplication.info("paystack_webhook_handled", {
      outcome: result.outcome,
      reason: result.reason,
    });
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    logApplication.error("paystack_webhook_failed", err);
    return NextResponse.json({ error: "try_again" }, { status: 500 });
  }
}
