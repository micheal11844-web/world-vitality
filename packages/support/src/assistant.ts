import { BUSINESS_EMAIL, BUSINESS_NAME } from "./business.js";
import { SUPPORT_LOCALES, type SupportLocale } from "./keywords.js";
import { detectEmergency } from "./matcher.js";

/**
 * The pure parts of linking an outside assistant (the owner's bot, Flow) to the
 * help chat: what may be asked, what is sent, and what may be shown back.
 * Nothing here talks to the network, reads the environment or stores anything,
 * so the rules are tested without a server (`apps/web/app/api/support/assistant`
 * is the only caller that does the fetching).
 *
 * Why so strict: a visitor's words go to a service we do not run, and what it
 * writes back is shown as ours. So the request is capped, carries no account
 * data, and any reply that looks wrong is **dropped, never repaired**: the
 * caller then falls back to the built-in answer (`replyTo`), which cannot be
 * wrong in the same ways.
 */

export const ASSISTANT_LIMITS = {
  /** Characters of a visitor's message that are read (same cap as the input box). */
  message: 500,
  /** How many earlier turns are sent for context. */
  history: 6,
  /** Characters kept of each earlier turn. */
  historyText: 600,
  /** Characters shown of a reply. */
  reply: 1200,
  /** The assistant has this long to answer before the built-in answer is used. */
  timeoutMs: 8000,
} as const;

export interface AssistantTurn {
  role: "user" | "assistant";
  text: string;
}

export interface AssistantRequest {
  message: string;
  locale: SupportLocale;
  history: AssistantTurn[];
}

function isLocale(value: unknown): value is SupportLocale {
  return typeof value === "string" && (SUPPORT_LOCALES as readonly string[]).includes(value);
}

function clamp(text: string, max: number): string {
  return Array.from(text.trim()).slice(0, max).join("");
}

/**
 * Reads the body the chat window posts. Returns `null` for anything that is not
 * exactly the expected shape, so a malformed or hostile request is refused
 * rather than half-understood. Extra fields are ignored (never forwarded).
 */
export function parseAssistantRequest(body: unknown): AssistantRequest | null {
  if (typeof body !== "object" || body === null) return null;
  const { message, locale, history } = body as Record<string, unknown>;
  if (typeof message !== "string" || !isLocale(locale)) return null;
  const text = clamp(message, ASSISTANT_LIMITS.message);
  if (text.length === 0) return null;
  const turns: AssistantTurn[] = [];
  if (history !== undefined) {
    if (!Array.isArray(history)) return null;
    for (const raw of history.slice(-ASSISTANT_LIMITS.history)) {
      if (typeof raw !== "object" || raw === null) return null;
      const { role, text: turnText } = raw as Record<string, unknown>;
      if ((role !== "user" && role !== "assistant") || typeof turnText !== "string") return null;
      const clean = clamp(turnText, ASSISTANT_LIMITS.historyText);
      if (clean.length > 0) turns.push({ role, text: clean });
    }
  }
  return { message: text, locale, history: turns };
}

/** One line of the chat window, as the window holds it. */
export interface ChatLine {
  who: "you" | "orbi";
  text: string;
  /** True for the built-in danger note (the window sets this, not the text). */
  emergency?: boolean;
}

/**
 * The earlier turns worth sending for context. **Danger never rides along**:
 * a message the emergency check catches, the built-in note that answered it,
 * and the message just before such a note are all left out, so words that were
 * kept from the assistant once are not handed to it a turn later.
 */
export function historyFromChat(lines: readonly ChatLine[]): AssistantTurn[] {
  const turns: AssistantTurn[] = [];
  lines.forEach((line, index) => {
    if (line.who === "orbi" && line.emergency) return;
    if (line.who === "you") {
      const next = lines[index + 1];
      if (detectEmergency(line.text) || (next?.who === "orbi" && next.emergency)) return;
    }
    turns.push({ role: line.who === "you" ? "user" : "assistant", text: line.text });
  });
  return turns.slice(-ASSISTANT_LIMITS.history);
}

const LANGUAGE_NAME: Record<SupportLocale, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  pt: "Portuguese (Brazil)",
  ar: "Arabic",
};

/**
 * The instructions the assistant is given. `facts` are the app's own written
 * answers (from the translation catalogs, English), so the assistant is told
 * what the app does instead of guessing, and cannot drift from the built-in text.
 */
export function buildSystemPrompt(locale: SupportLocale, facts: readonly string[]): string {
  return [
    `You are the help assistant inside ${BUSINESS_NAME}'s app, World Vitality (weather, hazard and earth-data workspaces, a 3D Globe, accounts and paid plans). You are an automatic assistant, not a person, and you say so if asked.`,
    `Answer only questions about World Vitality. Reply in ${LANGUAGE_NAME[locale]}, in plain text with no Markdown, no lists of more than four short lines and at most six sentences.`,
    `Use ONLY the facts below. If the facts do not answer the question, say plainly that you do not know and point to "Email a person" in this chat or ${BUSINESS_EMAIL}. Never invent features, steps or links.`,
    "Never state a price, a discount, a refund, a legal position or a promise: plan prices are on the Plans and billing page, and refunds and disputes go to a person by email.",
    "You are not an emergency service. Never give medical, legal, safety or emergency advice. If someone seems to be in danger, tell them to contact local emergency services now.",
    "You cannot see or change anyone's account, and you never ask for passwords, card numbers or personal details.",
    "FACTS:",
    ...facts.map((fact) => `- ${fact.replace(/\s+/g, " ").trim()}`),
  ].join("\n");
}

/** The body posted to the assistant (Flow's `/api/chat`: tools off, nothing saved). */
export function buildAssistantBody(system: string, request: AssistantRequest): object {
  return {
    audience: "third_party",
    disableTools: true,
    tz: "UTC",
    messages: [
      { role: "system", content: system },
      ...request.history.map((turn) => ({ role: turn.role, content: turn.text })),
      { role: "user", content: request.message },
    ],
  };
}

/** A tool call or markup that leaked into prose. */
const LEAK = [
  /<\/?\s*(tool_call|tool_use|function_call|function|invoke|antml|thinking|think)\b/i,
  /["']?(tool_calls?|function_call|tool_use)["']?\s*[:=]/i,
  /^\s*\{\s*["']name["']\s*:/,
  /\[\s*TOOL[_ ]/i,
];
/** Flow's own persona addresses its owner this way; it must never reach a visitor. */
const PERSONA = /\bboss\b/i;
const DIGIT = "[\\d٠-٩]";
/** A price or amount: the billing page is the only authority for these. */
const MONEY = new RegExp(
  [
    `[₦$€£]\\s?${DIGIT}`,
    `${DIGIT}[\\d.,٠-٩]*\\s?[₦$€£]`,
    `${DIGIT}[\\d.,٠-٩]*\\s?(?:ngn|usd|brl|eur|nairas?|dollars?|dolares|dólares|euros?|reais|دولار|يورو|نيرا|نايرا)`,
    `(?:ngn|usd|brl|eur)\\s?${DIGIT}`,
  ].join("|"),
  "i",
);

/**
 * What may be shown of a reply, or `null` to use the built-in answer instead.
 * Refused: not a string, empty, a leaked tool call, the assistant's owner
 * persona, or any price. Accepted replies lose HTML tags and Markdown marks and
 * are cut to the limit at a sentence end where possible.
 */
export function cleanAssistantReply(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  if (LEAK.some((pattern) => pattern.test(raw)) || PERSONA.test(raw) || MONEY.test(raw)) {
    return null;
  }
  const text = raw
    .replace(/<[^>]*>/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/(\*\*|__|`)/g, "")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (text.length < 2) return null;
  const chars = Array.from(text);
  if (chars.length <= ASSISTANT_LIMITS.reply) return text;
  const cut = chars.slice(0, ASSISTANT_LIMITS.reply).join("");
  const lastStop = Math.max(
    cut.lastIndexOf(". "),
    cut.lastIndexOf("! "),
    cut.lastIndexOf("? "),
    cut.lastIndexOf("۔"),
    cut.lastIndexOf("؟"),
  );
  return lastStop > ASSISTANT_LIMITS.reply / 2 ? cut.slice(0, lastStop + 1) : `${cut.trimEnd()}…`;
}

/**
 * A fixed-window counter per key, in memory. **Best effort**: each server
 * instance counts on its own, so the real ceiling is a little above the
 * number given; it protects the assistant's free quota from a script, not
 * from a determined attacker, and nothing it keeps outlives the instance.
 */
export function createRateLimiter(
  rules: readonly { windowMs: number; max: number }[],
  maxKeys = 5000,
) {
  const hits = new Map<string, number[]>();
  const longest = Math.max(...rules.map((rule) => rule.windowMs));
  return {
    /** Records one request for `key` and says whether it is allowed. */
    allow(key: string, now: number): boolean {
      const recent = (hits.get(key) ?? []).filter((t) => now - t < longest);
      const allowed = rules.every(
        (rule) => recent.filter((t) => now - t < rule.windowMs).length < rule.max,
      );
      if (allowed) recent.push(now);
      if (recent.length > 0) hits.set(key, recent);
      else hits.delete(key);
      if (hits.size > maxKeys) {
        for (const [k, times] of hits) {
          if (times.every((t) => now - t >= longest)) hits.delete(k);
        }
        if (hits.size > maxKeys) hits.clear();
      }
      return allowed;
    },
  };
}
