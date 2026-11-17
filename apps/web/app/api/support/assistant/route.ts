import { NextResponse, type NextRequest } from "next/server";
import { createTranslator } from "@world-vitality/i18n";
import {
  ASSISTANT_LIMITS,
  BUSINESS_EMAIL,
  BUSINESS_NAME,
  SUPPORT_TOPIC_IDS,
  buildAssistantBody,
  buildSystemPrompt,
  cleanAssistantReply,
  createRateLimiter,
  detectEmergency,
  parseAssistantRequest,
} from "@world-vitality/support";
import { getAssistantConfig } from "../../../../lib/support/assistant-config";
import { getClientIp } from "../../../../lib/get-client-ip";
import { logApplication } from "../../../../lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

/**
 * The help chat's outside assistant (the owner's bot, Flow) — **off unless
 * switched on** (`lib/support/assistant-config.ts`). When off, `GET` says so
 * and `POST` refuses without reading the body, so the chat window never sends a
 * visitor's words anywhere.
 *
 * What this route does, in order: refuses anything malformed or too big;
 * answers danger **without asking the assistant** (the chat window checks first
 * too; this is the second lock); rate-limits per visitor and overall (best
 * effort, in memory); calls the assistant from the server with a fixed system
 * text built from the app's own answers, tools off, and **only the message and
 * the last few turns** — no cookie, account, e-mail, IP address or user agent;
 * waits at most 8 seconds; and shows its reply only if
 * `cleanAssistantReply` accepts it. Every other outcome is `{ ok: false }` and
 * the chat window uses the built-in answer.
 *
 * Logged: that a call happened, how long it took and why it failed. Never the
 * message, the reply, or the visitor's address.
 */

const perVisitor = createRateLimiter([
  { windowMs: 60_000, max: 8 },
  { windowMs: 3_600_000, max: 40 },
]);
const overall = createRateLimiter([{ windowMs: 3_600_000, max: 600 }]);

const MAX_BODY_CHARS = 20_000;
const MAX_REPLY_BODY_CHARS = 100_000;
const NO_STORE = { "Cache-Control": "no-store" } as const;

let facts: string[] | null = null;
/** The app's own written answers (English), the only facts the assistant may use. */
function appFacts(): string[] {
  if (!facts) {
    const { t } = createTranslator("en");
    facts = SUPPORT_TOPIC_IDS.map((topic) =>
      t(`support.answer.${topic}`, { business: BUSINESS_NAME, email: BUSINESS_EMAIL }),
    );
  }
  return facts;
}

export async function GET() {
  return NextResponse.json({ enabled: getAssistantConfig() !== null }, { headers: NO_STORE });
}

export async function POST(request: NextRequest) {
  const config = getAssistantConfig();
  if (!config) return NextResponse.json({ ok: false, reason: "disabled" }, { headers: NO_STORE });

  const raw = await request.text().catch(() => "");
  if (raw.length === 0 || raw.length > MAX_BODY_CHARS) {
    return NextResponse.json(
      { ok: false, reason: "bad-request" },
      { status: 400, headers: NO_STORE },
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { ok: false, reason: "bad-request" },
      { status: 400, headers: NO_STORE },
    );
  }
  const chat = parseAssistantRequest(parsed);
  if (!chat) {
    return NextResponse.json(
      { ok: false, reason: "bad-request" },
      { status: 400, headers: NO_STORE },
    );
  }

  // Danger is never sent anywhere: the built-in emergency note answers it. An
  // earlier turn that trips the same check means no history is sent at all.
  if (detectEmergency(chat.message)) {
    return NextResponse.json({ ok: false, reason: "emergency" }, { headers: NO_STORE });
  }
  if (chat.history.some((turn) => turn.role === "user" && detectEmergency(turn.text))) {
    chat.history = [];
  }

  const now = Date.now();
  const visitor = (await getClientIp()) ?? "unknown";
  if (!perVisitor.allow(visitor, now) || !overall.allow("all", now)) {
    logApplication.warn("support_assistant_failed", { reason: "rate-limited" });
    return NextResponse.json({ ok: false, reason: "busy" }, { status: 429, headers: NO_STORE });
  }

  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ASSISTANT_LIMITS.timeoutMs);
  try {
    const response = await fetch(config.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config.key ? { Authorization: `Bearer ${config.key}` } : {}),
      },
      body: JSON.stringify(buildAssistantBody(buildSystemPrompt(chat.locale, appFacts()), chat)),
      signal: controller.signal,
      cache: "no-store",
      redirect: "error",
    });
    if (!response.ok) {
      logApplication.warn("support_assistant_failed", { reason: "http", status: response.status });
      return NextResponse.json({ ok: false, reason: "http" }, { headers: NO_STORE });
    }
    const body = await response.text();
    if (body.length > MAX_REPLY_BODY_CHARS) {
      logApplication.warn("support_assistant_failed", { reason: "too-large" });
      return NextResponse.json({ ok: false, reason: "shape" }, { headers: NO_STORE });
    }
    let data: unknown;
    try {
      data = JSON.parse(body);
    } catch {
      logApplication.warn("support_assistant_failed", { reason: "not-json" });
      return NextResponse.json({ ok: false, reason: "shape" }, { headers: NO_STORE });
    }
    const text = cleanAssistantReply(
      typeof data === "object" && data !== null ? (data as { reply?: unknown }).reply : undefined,
    );
    if (!text) {
      logApplication.warn("support_assistant_failed", { reason: "rejected" });
      return NextResponse.json({ ok: false, reason: "rejected" }, { headers: NO_STORE });
    }
    logApplication.info("support_assistant_answered", { ms: Date.now() - started });
    return NextResponse.json({ ok: true, text }, { headers: NO_STORE });
  } catch (err) {
    const timedOut = controller.signal.aborted;
    logApplication.warn("support_assistant_failed", {
      reason: timedOut ? "timeout" : "network",
      detail: timedOut || !(err instanceof Error) ? undefined : err.name,
    });
    return NextResponse.json(
      { ok: false, reason: timedOut ? "timeout" : "network" },
      { headers: NO_STORE },
    );
  } finally {
    clearTimeout(timer);
  }
}
