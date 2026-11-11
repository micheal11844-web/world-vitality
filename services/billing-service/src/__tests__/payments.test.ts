import { test } from "node:test";
import assert from "node:assert/strict";
import { applyRefundStatus, refundStateOf, type PaymentRecord } from "../payments.js";
import { DEFAULT_RECEIPT_SELLER, receiptSellerLines } from "../receipt.js";

const PAID: PaymentRecord = {
  reference: "ref_1",
  userId: "u1",
  amountMinor: 750000,
  currency: "NGN",
  plan: "standard",
  paidAt: "2026-11-15T10:30:00.000Z",
  refundStatus: null,
};

test("a payment that was never refunded shows no refund", () => {
  assert.equal(refundStateOf(PAID), "none");
});

test("each refund status maps to what the person sees", () => {
  assert.equal(refundStateOf({ refundStatus: "pending" }), "in_progress");
  assert.equal(refundStateOf({ refundStatus: "processing" }), "in_progress");
  assert.equal(refundStateOf({ refundStatus: "processed" }), "processed");
  assert.equal(refundStateOf({ refundStatus: "failed" }), "failed");
});

test("a refund moves forward: pending, processing, processed", () => {
  const a = applyRefundStatus(PAID, "pending");
  assert.equal(a.changed, true);
  assert.equal(a.becameProcessed, false);
  assert.equal(a.payment.refundStatus, "pending");
  const b = applyRefundStatus(a.payment, "processing");
  assert.equal(b.payment.refundStatus, "processing");
  const c = applyRefundStatus(b.payment, "processed");
  assert.equal(c.payment.refundStatus, "processed");
  assert.equal(c.becameProcessed, true);
});

test("a late or repeated event never moves a refund backwards or counts twice", () => {
  const processed = { ...PAID, refundStatus: "processed" as const };
  for (const status of ["pending", "processing", "failed", "processed"] as const) {
    const out = applyRefundStatus(processed, status);
    assert.equal(out.changed, false, status);
    assert.equal(out.becameProcessed, false, status);
    assert.equal(out.payment.refundStatus, "processed", status);
  }
  const processing = { ...PAID, refundStatus: "processing" as const };
  assert.equal(applyRefundStatus(processing, "pending").changed, false);
  assert.equal(applyRefundStatus(processing, "processing").changed, false);
});

test("a processed refund can come straight from nothing (we only heard the last event)", () => {
  const out = applyRefundStatus(PAID, "processed");
  assert.equal(out.changed, true);
  assert.equal(out.becameProcessed, true);
});

test("a refund that failed can be retried and then succeed", () => {
  const failed = { ...PAID, refundStatus: "failed" as const };
  assert.equal(applyRefundStatus(failed, "pending").payment.refundStatus, "pending");
  assert.equal(applyRefundStatus(failed, "processing").payment.refundStatus, "processing");
  const ok = applyRefundStatus(failed, "processed");
  assert.equal(ok.becameProcessed, true);
  // A processing refund can fail.
  assert.equal(
    applyRefundStatus({ ...PAID, refundStatus: "processing" }, "failed").payment.refundStatus,
    "failed",
  );
});

test("receipt seller lines come from BILLING_RECEIPT_SELLER, one per |, tidied and capped", () => {
  assert.deepEqual(receiptSellerLines(undefined), [DEFAULT_RECEIPT_SELLER]);
  assert.deepEqual(receiptSellerLines(""), [DEFAULT_RECEIPT_SELLER]);
  assert.deepEqual(receiptSellerLines(" | | "), [DEFAULT_RECEIPT_SELLER]);
  assert.deepEqual(
    receiptSellerLines("World Vitality Ltd |  12 Example   Street, Lagos | TIN 1234567-0001"),
    ["World Vitality Ltd", "12 Example Street, Lagos", "TIN 1234567-0001"],
  );
  assert.equal(receiptSellerLines("a|b|c|d|e|f|g").length, 5);
  assert.equal(receiptSellerLines("x".repeat(500))[0]?.length, 120);
  // Shown as text, never as markup: nothing is interpreted here.
  assert.deepEqual(receiptSellerLines("<b>Acme</b>"), ["<b>Acme</b>"]);
});
