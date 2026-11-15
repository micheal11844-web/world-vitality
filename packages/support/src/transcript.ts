import { businessMailto } from "./business.js";

export interface TranscriptLine {
  who: "you" | "orbi";
  text: string;
}

/** Subject and opening line of the email are English: the business reads English. */
export const SUPPORT_EMAIL_SUBJECT = "Help with World Vitality";
const EMAIL_INTRO = "Hello, I need help with World Vitality.";
const EMAIL_CHAT_HEADING = "My chat with the help assistant:";

/** A long email link breaks in some mail apps, so only the newest part of the chat is kept. */
export const MAX_TRANSCRIPT_CHARS = 1500;

/** The chat as plain text, newest lines kept when it is too long. */
export function transcriptText(lines: readonly TranscriptLine[]): string {
  const rows = lines
    .filter((l) => l.text.trim().length > 0)
    .map((l) => `${l.who === "you" ? "Me" : "Assistant"}: ${l.text.trim()}`);
  let out = rows.join("\n");
  if (out.length > MAX_TRANSCRIPT_CHARS) {
    out = `…${out.slice(out.length - MAX_TRANSCRIPT_CHARS)}`;
  }
  return out;
}

/**
 * The "email a person" link. The chat is included only because the person
 * pressed this button, and only in their own mail app, where they can read and
 * edit it before sending: nothing is sent from the page.
 */
export function supportMailto(lines: readonly TranscriptLine[]): string {
  const chat = transcriptText(lines);
  const body = chat ? `${EMAIL_INTRO}\n\n${EMAIL_CHAT_HEADING}\n${chat}\n\n` : `${EMAIL_INTRO}\n\n`;
  return businessMailto(SUPPORT_EMAIL_SUBJECT, body);
}
