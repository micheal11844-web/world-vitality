import { test } from "node:test";
import assert from "node:assert/strict";
import { BUSINESS_EMAIL } from "../business.js";
import {
  ASSISTANT_LIMITS,
  buildAssistantBody,
  buildSystemPrompt,
  cleanAssistantReply,
  createRateLimiter,
  historyFromChat,
  parseAssistantRequest,
} from "../assistant.js";

test("a good request is read, trimmed and capped", () => {
  const request = parseAssistantRequest({
    message: `  ${"a".repeat(900)}  `,
    locale: "fr",
    history: [{ role: "user", text: "  hi  " }],
    userId: "must-not-be-forwarded",
  });
  assert.ok(request);
  assert.equal(request.message.length, ASSISTANT_LIMITS.message);
  assert.equal(request.locale, "fr");
  assert.deepEqual(request.history, [{ role: "user", text: "hi" }]);
  assert.equal("userId" in request, false);
});

test("only the last turns are kept, each capped", () => {
  const history = Array.from({ length: 20 }, (_, i) => ({
    role: i % 2 === 0 ? "user" : "assistant",
    text: `turn ${i} ${"x".repeat(2000)}`,
  }));
  const request = parseAssistantRequest({ message: "hello", locale: "en", history });
  assert.ok(request);
  assert.equal(request.history.length, ASSISTANT_LIMITS.history);
  assert.ok(request.history[0]?.text.startsWith("turn 14"));
  assert.ok(request.history.every((t) => t.text.length <= ASSISTANT_LIMITS.historyText));
});

test("a malformed request is refused, not half-read", () => {
  assert.equal(parseAssistantRequest(null), null);
  assert.equal(parseAssistantRequest("hello"), null);
  assert.equal(parseAssistantRequest({ message: "hi" }), null);
  assert.equal(parseAssistantRequest({ message: "hi", locale: "de" }), null);
  assert.equal(parseAssistantRequest({ message: "   ", locale: "en" }), null);
  assert.equal(parseAssistantRequest({ message: 5, locale: "en" }), null);
  assert.equal(parseAssistantRequest({ message: "hi", locale: "en", history: "x" }), null);
  assert.equal(
    parseAssistantRequest({
      message: "hi",
      locale: "en",
      history: [{ role: "system", text: "x" }],
    }),
    null,
  );
});

test("the body sent to the assistant has tools off, our own system text, and no account data", () => {
  const request = parseAssistantRequest({
    message: "how do I cancel?",
    locale: "es",
    history: [{ role: "assistant", text: "Hello" }],
  });
  assert.ok(request);
  const body = buildAssistantBody(
    buildSystemPrompt("es", ["Plans are on the billing page."]),
    request,
  ) as {
    audience: string;
    disableTools: boolean;
    messages: { role: string; content: string }[];
  };
  assert.equal(body.audience, "third_party");
  assert.equal(body.disableTools, true);
  assert.deepEqual(
    body.messages.map((m) => m.role),
    ["system", "assistant", "user"],
  );
  assert.match(body.messages[0]?.content ?? "", /Spanish/);
  assert.match(body.messages[0]?.content ?? "", /Plans are on the billing page\./);
  assert.match(body.messages[0]?.content ?? "", new RegExp(BUSINESS_EMAIL.replace(".", "\\.")));
  assert.deepEqual(Object.keys(body).sort(), ["audience", "disableTools", "messages", "tz"]);
});

test("a plain reply is shown, with markup and Markdown marks removed", () => {
  assert.equal(
    cleanAssistantReply("Open **Plans and billing** to see `your` plan.<br> Thanks."),
    "Open Plans and billing to see your plan. Thanks.",
  );
  assert.equal(
    cleanAssistantReply("## Alerts\nThey appear in the app."),
    "Alerts\nThey appear in the app.",
  );
});

test("a reply that is not usable falls back to the built-in answer", () => {
  assert.equal(cleanAssistantReply(undefined), null);
  assert.equal(cleanAssistantReply(42), null);
  assert.equal(cleanAssistantReply("   "), null);
  assert.equal(cleanAssistantReply("<tool_call>{}</tool_call>"), null);
  assert.equal(cleanAssistantReply('{"name": "send_message", "arguments": {}}'), null);
  assert.equal(cleanAssistantReply('I will call "tool_calls": [1]'), null);
  assert.equal(cleanAssistantReply("Sure thing, Boss."), null);
});

test("a reply that states a price is dropped: the billing page is the authority", () => {
  for (const text of [
    "The Pro plan costs ₦5,000 a month.",
    "It is $9 per month.",
    "Pay 9 USD monthly.",
    "Costs 5000 naira.",
    "USD 12 for the year",
    "Cuesta 10 dólares al mes.",
    "يكلف ١٠ دولار شهريا",
    "It is 12€ a month",
  ]) {
    assert.equal(cleanAssistantReply(text), null, text);
  }
  // Numbers that are not money are fine.
  assert.ok(cleanAssistantReply("Alerts are checked every 15 minutes, for up to 4 places."));
});

test("a long reply is cut at a sentence end, within the limit", () => {
  const sentence = "The Globe needs a sign-in to open. ";
  const cleaned = cleanAssistantReply(sentence.repeat(100));
  assert.ok(cleaned);
  assert.ok(Array.from(cleaned).length <= ASSISTANT_LIMITS.reply);
  assert.ok(cleaned.endsWith("open."));
  const noStops = cleanAssistantReply("word ".repeat(1000));
  assert.ok(noStops?.endsWith("…"));
});

test("the rate limiter allows a burst up to each window's limit, then refuses, then recovers", () => {
  const limiter = createRateLimiter([
    { windowMs: 60_000, max: 3 },
    { windowMs: 3_600_000, max: 5 },
  ]);
  const t0 = 1_000_000;
  assert.ok(limiter.allow("a", t0));
  assert.ok(limiter.allow("a", t0 + 1));
  assert.ok(limiter.allow("a", t0 + 2));
  assert.equal(limiter.allow("a", t0 + 3), false, "fourth within a minute");
  assert.ok(limiter.allow("b", t0 + 3), "another visitor is not affected");
  assert.ok(limiter.allow("a", t0 + 61_000), "a minute later it recovers");
  assert.ok(limiter.allow("a", t0 + 62_000));
  assert.equal(limiter.allow("a", t0 + 122_000), false, "the hourly limit of 5 is reached");
  assert.ok(limiter.allow("a", t0 + 3_700_000), "an hour later it recovers");
});

test("the rate limiter does not grow without bound", () => {
  const limiter = createRateLimiter([{ windowMs: 1000, max: 1 }], 50);
  for (let i = 0; i < 500; i += 1) limiter.allow(`k${i}`, 1_000_000 + i);
  assert.ok(limiter.allow("fresh", 2_000_000));
});

test("earlier turns are sent as user and assistant turns, newest six only", () => {
  const lines = Array.from({ length: 10 }, (_, i) => ({
    who: i % 2 === 0 ? ("you" as const) : ("orbi" as const),
    text: `line ${i}`,
  }));
  const history = historyFromChat(lines);
  assert.equal(history.length, ASSISTANT_LIMITS.history);
  assert.deepEqual(history[0], { role: "user", text: "line 4" });
  assert.deepEqual(history.at(-1), { role: "assistant", text: "line 9" });
});

test("a message about danger, and the note that answered it, are never sent as history", () => {
  const history = historyFromChat([
    { who: "you", text: "How do I change my password?" },
    { who: "orbi", text: "Open Settings." },
    { who: "you", text: "I want to kill myself" },
    { who: "orbi", text: "Please call emergency services.", emergency: true },
    { who: "you", text: "ok, and my plan?" },
  ]);
  assert.deepEqual(
    history.map((turn) => turn.text),
    ["How do I change my password?", "Open Settings.", "ok, and my plan?"],
  );
});

test("a danger message is held back even when the window did not flag a note for it", () => {
  const history = historyFromChat([
    { who: "you", text: "my house is on fire" },
    { who: "orbi", text: "Something else." },
  ]);
  assert.deepEqual(history, [{ role: "assistant", text: "Something else." }]);
});
