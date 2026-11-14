import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BUSINESS_COUNTRY,
  BUSINESS_EMAIL,
  BUSINESS_NAME,
  LEGAL_UPDATED,
  businessMailto,
} from "../business.js";

test("the contact address is the business address, not a personal one", () => {
  assert.equal(BUSINESS_EMAIL, "joelflowstack@gmail.com");
  assert.equal(BUSINESS_NAME, "joelflowstack");
  assert.equal(BUSINESS_COUNTRY, "Nigeria");
});

test("the legal date is a real calendar day", () => {
  assert.match(LEGAL_UPDATED, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(!Number.isNaN(Date.parse(`${LEGAL_UPDATED}T00:00:00Z`)));
});

test("businessMailto builds a safe mailto link", () => {
  assert.equal(businessMailto(), "mailto:joelflowstack@gmail.com");
  assert.equal(
    businessMailto("Help & more", "line one\nline two"),
    "mailto:joelflowstack@gmail.com?subject=Help%20%26%20more&body=line%20one%0Aline%20two",
  );
});
