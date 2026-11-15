import { test } from "node:test";
import assert from "node:assert/strict";
import { BUSINESS_EMAIL } from "../business.js";
import { MAX_TRANSCRIPT_CHARS, supportMailto, transcriptText } from "../transcript.js";

test("the chat becomes plain text, skipping empty lines", () => {
  const text = transcriptText([
    { who: "orbi", text: "Hi" },
    { who: "you", text: "  how do I cancel  " },
    { who: "orbi", text: "   " },
  ]);
  assert.equal(text, "Assistant: Hi\nMe: how do I cancel");
});

test("a long chat keeps its newest part", () => {
  const lines = Array.from({ length: 400 }, (_, i) => ({ who: "you" as const, text: `line ${i}` }));
  const text = transcriptText(lines);
  assert.ok(text.length <= MAX_TRANSCRIPT_CHARS + 1);
  assert.ok(text.startsWith("…"));
  assert.ok(text.endsWith("line 399"));
});

test("the email link goes to the business address, with the chat in the body", () => {
  const link = supportMailto([{ who: "you", text: "I was charged twice & need help" }]);
  assert.ok(link.startsWith(`mailto:${BUSINESS_EMAIL}?subject=`));
  const body = decodeURIComponent(link.split("body=")[1] ?? "");
  assert.ok(body.includes("Me: I was charged twice & need help"));
  assert.ok(!link.includes(" "), "fully encoded");
});

test("with no chat, the email is still ready to write", () => {
  const link = supportMailto([]);
  const body = decodeURIComponent(link.split("body=")[1] ?? "");
  assert.ok(body.startsWith("Hello, I need help with World Vitality."));
  assert.ok(!body.includes("My chat"));
});

test("the personal address never appears", () => {
  assert.ok(!supportMailto([]).includes("olaiya"));
});
