import { replyTo, type SupportReply } from "@world-vitality/support";

/**
 * The ONE place between "a person typed a message" and "what Orbi says back".
 *
 * Today it is the built-in matcher: it runs in the browser, nothing typed
 * leaves the device. To link a real assistant (the owner's bot), change the
 * body of this function to call it and return `{ kind: "text", text }`, and
 * keep this rule: **run `detectEmergency` first and return the emergency note
 * without asking the bot**, so danger never waits on, or depends on, an
 * outside service. Sending messages anywhere is a change to the privacy
 * policy (`apps/web/app/legal/legal-text.ts`, "help chat") and the runbook
 * `docs/runbooks/support-chat.md` — update both with it.
 */
export async function respondToMessage(message: string, locale: string): Promise<SupportReply> {
  return replyTo(message, locale);
}
