// The help chat and its optional outside assistant (Flow), in a real browser plus the API route.
// The runner starts the site once per scenario (SCENARIO, with matching env) and a fake Flow at
// https://flow.test inside it; SERVER_LOG is that server's output, where the fake Flow logs what it received.
//   off   the assistant is not configured: the chat answers from the device, nothing is sent anywhere
//   on    configured: a normal reply, exact request shape, history rules, rate limit
//   fail | slow | price | leak | boss | json   Flow misbehaves: the visitor still gets the built-in answer
"use strict";
const fs = require("node:fs");
const { launch, BASE, SHOTS } = require("../harness/browser.cjs");
const { checker } = require("../harness/check.cjs");

const SC = process.env.SCENARIO || "off";
const SERVER_LOG = process.env.SERVER_LOG;
const { ok, finish } = checker(`help-chat ${SC}`);
if (!SERVER_LOG)
  throw new Error("SERVER_LOG must name the site's output file (the runner sets it).");
const logLines = (prefix) =>
  fs
    .readFileSync(SERVER_LOG, "utf8")
    .split("\n")
    .filter((l) => l.startsWith(prefix))
    .map((l) => JSON.parse(l.slice(prefix.length)));
const flowLog = () => logLines("MOCK flow request:");
const flowMessages = () => logLines("MOCK flow messages:");

(async () => {
  const browser = await launch();
  const ctx = await browser.newContext({
    viewport: { width: 1100, height: 800 },
    deviceScaleFactor: 1,
  });
  await ctx.addCookies([
    { name: "wv_lang", value: "en", url: BASE },
    { name: "wv_session", value: "abc", url: BASE },
  ]);
  const page = await ctx.newPage();
  const errors = [];
  const assistantPosts = [];
  const statusGets = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("request", (r) => {
    if (!r.url().includes("/api/support/assistant")) return;
    if (r.method() === "POST") assistantPosts.push(r.postDataJSON());
    else statusGets.push(r.method());
  });
  await page.goto(BASE + "/sources", { waitUntil: "networkidle" });
  ok("no status call before the window is opened", statusGets.length === 0, statusGets.length);
  await page.getByRole("button", { name: "Open the help chat" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
  await page.waitForTimeout(500);
  ok(
    "status asked exactly once, GET, no text",
    statusGets.length === 1 && statusGets[0] === "GET",
    JSON.stringify(statusGets),
  );
  const notice = await dialog.innerText();
  const enabled = SC !== "off";
  ok(
    enabled
      ? "notice says messages go to our AI assistant and its AI providers, and points to the policy"
      : "notice is the original (nothing sent anywhere)",
    enabled
      ? /sent to our AI assistant and the AI providers it uses/.test(notice) &&
          /Privacy Policy says who handles it and what is kept/.test(notice) &&
          !/Groq|Cloudflare/.test(notice)
      : /Nothing you type here is saved or sent anywhere/.test(notice),
    notice.slice(0, 300),
  );
  const input = dialog.getByLabel("Type your question");

  // 1. A topic button never goes anywhere.
  await dialog.getByRole("button", { name: "Plans and billing" }).click();
  ok("topic button answers from the device", /Basic is free/.test(await dialog.innerText()));
  ok(
    "topic button sends nothing to the assistant",
    assistantPosts.length === 0 && flowLog().length === 0,
  );

  // 2. A danger message is answered by the built-in note and not sent.
  await input.fill("I think I am trapped in a flood");
  await dialog.getByRole("button", { name: "Send" }).click();
  await page.waitForTimeout(600);
  ok(
    "danger message: emergency note shown",
    /call your local emergency number now/.test(await dialog.innerText()),
  );
  ok(
    "danger message: no POST to our route, no call to Flow",
    assistantPosts.length === 0 && flowLog().length === 0,
    JSON.stringify(assistantPosts),
  );

  // 3. An ordinary question.
  await input.fill("how do I cancel my plan?");
  await dialog.getByRole("button", { name: "Send" }).click();
  if (SC === "slow") {
    await page.waitForTimeout(400);
    ok(
      "slow: 'Orbi is thinking…' is shown while waiting",
      (await page.getByTestId("support-thinking").count()) === 1,
    );
    ok(
      "slow: the visitor's own message is already on screen",
      /how do I cancel my plan\?/.test(await dialog.innerText()),
    );
    ok(
      "slow: Send is disabled while waiting",
      await dialog.getByRole("button", { name: "Send" }).isDisabled(),
    );
    await page.getByTestId("support-thinking").waitFor({ state: "detached", timeout: 15000 });
  } else {
    await page.waitForTimeout(1500);
  }
  const text = await dialog.innerText();
  const tail = text.slice(-700);
  if (SC === "off") {
    ok(
      "off: built-in answer is shown (no POST made)",
      assistantPosts.length === 0 && /cancel|Plans and billing|email/i.test(tail),
      tail,
    );
    ok("off: Flow never called", flowLog().length === 0);
  } else if (SC === "on") {
    ok(
      "on: Flow's reply is shown, Markdown marks removed",
      /Plans are on the Plans and billing page\./.test(tail) && !/\*\*/.test(tail),
      tail,
    );
    const reqs = flowLog();
    ok("on: exactly one call to Flow so far", reqs.length === 1, reqs.length);
    const r = reqs[0] || {};
    ok(
      "on: audience third_party, tools off",
      r.audience === "third_party" && r.disableTools === true,
      JSON.stringify(r),
    );
    ok(
      "on: body has only audience, disableTools, messages, tz",
      JSON.stringify(r.keys) === JSON.stringify(["audience", "disableTools", "messages", "tz"]),
      JSON.stringify(r.keys),
    );
    ok(
      "on: Authorization sent only as the optional key (present, value never logged)",
      r.auth === "present" &&
        JSON.stringify(r.headerNames) === JSON.stringify(["Content-Type", "Authorization"]),
      JSON.stringify(r.headerNames),
    );
    ok("on: redirects are refused", r.redirect === "error", r.redirect);
    const msgs = flowMessages()[0] || [];
    const joined = JSON.stringify(msgs);
    ok(
      "on: system text first, then history, then the new message",
      msgs[0]?.role === "system" &&
        msgs.at(-1)?.role === "user" &&
        msgs.at(-1)?.content === "how do I cancel my plan?",
      joined.slice(0, 300),
    );
    ok(
      "on: the danger message and its note were NOT sent as history",
      !/trapped/i.test(joined) && !/emergency number/i.test(joined),
      joined,
    );
    ok(
      "on: no cookie, session or address in the body",
      !/wv_session|abc|127\.0\.0\.1|localhost/i.test(joined.replace(/FACTS[\s\S]*/, "")),
      joined.slice(0, 300),
    );
    ok(
      "on: our own facts are in the system text",
      /Paystack/.test(msgs[0]?.content || "") &&
        /joelflowstack@gmail\.com/.test(msgs[0]?.content || ""),
    );
    ok(
      "on: browser posted only message, locale and history",
      assistantPosts.length === 1 &&
        JSON.stringify(Object.keys(assistantPosts[0]).sort()) ===
          JSON.stringify(["history", "locale", "message"]),
      JSON.stringify(assistantPosts),
    );
  } else {
    // fail | slow | price | leak | boss | json: the visitor still gets an answer, from the built-in matcher.
    ok(
      `${SC}: falls back to the built-in answer`,
      /cancel|Plans and billing|email/i.test(tail) && !/Boss|\$9|tool_call/i.test(tail),
      tail,
    );
    ok(`${SC}: Flow was asked once`, flowLog().length === 1, flowLog().length);
  }

  // 4. API-level behaviour.
  const api = ctx.request;
  const get = await api.get(BASE + "/api/support/assistant");
  ok(
    "GET says enabled or not, no-store",
    (await get.json()).enabled === enabled && /no-store/.test(get.headers()["cache-control"] || ""),
  );
  const bad = await api.post(BASE + "/api/support/assistant", {
    data: "not json",
    headers: { "content-type": "application/json" },
  });
  const empty = await api.post(BASE + "/api/support/assistant", {
    data: { message: "   ", locale: "en" },
  });
  const hugeBody = await api.post(BASE + "/api/support/assistant", {
    data: { message: "x".repeat(30000), locale: "en" },
  });
  if (enabled) {
    ok("malformed JSON is refused with 400", bad.status() === 400, bad.status());
    ok("empty message is refused with 400", empty.status() === 400, empty.status());
    ok("oversized body is refused with 400", hugeBody.status() === 400, hugeBody.status());
    const dangerApi = await api.post(BASE + "/api/support/assistant", {
      data: { message: "I want to die", locale: "en" },
    });
    const dj = await dangerApi.json();
    ok(
      "danger posted straight to the route is refused (second lock) and not forwarded",
      dj.ok === false && dj.reason === "emergency",
      JSON.stringify(dj),
    );
    const before = flowLog().length;
    await api.post(BASE + "/api/support/assistant", {
      data: {
        message: "what are plans?",
        locale: "en",
        history: [
          { role: "user", text: "I want to kill myself" },
          { role: "assistant", text: "x" },
        ],
      },
    });
    const after = flowLog();
    ok(
      "a danger turn in history means no history is forwarded",
      after.length === before + 1 && !/kill myself/i.test(JSON.stringify(flowMessages().at(-1))),
      JSON.stringify(flowMessages().at(-1)).slice(0, 300),
    );
    if (SC === "on") {
      // Rate limit: the per-visitor window is 8 per minute; several were used already.
      let lastStatus = 0;
      let firstBlockedAt = -1;
      for (let i = 0; i < 12; i++) {
        const r = await api.post(BASE + "/api/support/assistant", {
          data: { message: "hello " + i, locale: "en" },
        });
        lastStatus = r.status();
        if (lastStatus === 429 && firstBlockedAt < 0) firstBlockedAt = i;
      }
      ok(
        "rate limit: too many requests get 429 {ok:false}",
        lastStatus === 429 && firstBlockedAt >= 0,
        `last ${lastStatus}, first blocked at ${firstBlockedAt}`,
      );
      await page.waitForTimeout(100);
      await input.fill("and what about alerts?");
      await dialog.getByRole("button", { name: "Send" }).click();
      await page.waitForTimeout(1500);
      const t2 = (await dialog.innerText()).slice(-500);
      ok(
        "when rate-limited the chat window still answers (built-in)",
        /alert/i.test(t2) && !/busy|error|failed/i.test(t2),
        t2,
      );
    }
  } else {
    const dis = await api.post(BASE + "/api/support/assistant", {
      data: { message: "hello", locale: "en" },
    });
    const dj = await dis.json();
    ok(
      "disabled: POST refused without calling anything",
      dj.ok === false && dj.reason === "disabled" && flowLog().length === 0,
      JSON.stringify(dj),
    );
    ok(
      "disabled: even a malformed body is not read",
      (
        await api.post(BASE + "/api/support/assistant", {
          data: "not json",
          headers: { "content-type": "application/json" },
        })
      ).status() === 200,
    );
  }

  // The Privacy Policy says what the chat does, in both states, and names who sees the words.
  const policy = await ctx.newPage();
  await policy.goto(BASE + "/privacy", { waitUntil: "domcontentloaded" });
  const policyText = await policy.locator("main").innerText();
  const section4 = policyText.slice(
    policyText.indexOf("4. The help chat"),
    policyText.indexOf("5. Why we use it"),
  );
  ok(
    "privacy policy section 4 covers assistant off and on, naming Flow, Groq and Cloudflare",
    /AI assistant is off, what you type stays on your device/.test(section4) &&
      /sent from our server to Flow/.test(section4) &&
      /Groq and Cloudflare Workers AI, and no others/.test(section4) &&
      /never sent/.test(section4) &&
      /Washington, D\.C\./.test(section4),
    section4.slice(0, 200),
  );
  ok(
    "privacy policy names the assistant's providers under 'Who else sees it' and 'Transfers'",
    (policyText.match(/Groq/g) || []).length >= 3 &&
      /Cloudflare, which does not state a country/.test(policyText),
  );
  ok(
    "privacy policy shows the 21 November 2026 date",
    /21 November 2026|November 21, 2026/.test(policyText),
  );
  await policy.close();

  ok("no page errors", errors.length === 0, errors.join(" | "));
  await page.screenshot({ path: `${SHOTS}/help-chat-${SC}.png` });
  await browser.close();
  process.exit(finish());
})().catch((e) => {
  console.error(e);
  process.exit(2);
});
