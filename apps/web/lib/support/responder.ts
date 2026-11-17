import { replyTo, type AssistantTurn, type SupportReply } from "@world-vitality/support";

/**
 * Whether the help chat may use an outside assistant. Asked once, when the
 * window first opens, with **no text sent**: the server answers from its own
 * settings (`lib/support/assistant-config.ts`). Any failure means "no", so the
 * window works exactly as before and nothing typed leaves the device.
 */
export async function assistantEnabled(): Promise<boolean> {
  try {
    const response = await fetch("/api/support/assistant", { cache: "no-store" });
    if (!response.ok) return false;
    const data: unknown = await response.json();
    return (
      typeof data === "object" && data !== null && (data as { enabled?: unknown }).enabled === true
    );
  } catch {
    return false;
  }
}

/**
 * The ONE place between "a person typed a message" and "what Orbi says back".
 *
 * The built-in matcher always runs first, in the browser. Danger is answered by
 * its emergency note and **never sent anywhere**, so it does not wait on, or
 * depend on, an outside service. Only when `useAssistant` is true (the server
 * said the assistant is switched on) is the message posted to our own route,
 * which asks the assistant; every failure, refusal or unusable reply falls
 * back to the built-in answer, silently.
 *
 * Sending messages anywhere is a change to the privacy policy
 * (`apps/web/app/legal/legal-text.ts`, "help chat") and the runbook
 * `docs/runbooks/support-chat.md`: they are updated in the same release that
 * switches the assistant on, never before.
 */
export async function respondToMessage(
  message: string,
  locale: string,
  options: { useAssistant: boolean; history: AssistantTurn[] } = {
    useAssistant: false,
    history: [],
  },
): Promise<SupportReply> {
  const builtIn = replyTo(message, locale);
  if (builtIn.kind === "emergency" || !options.useAssistant) return builtIn;
  try {
    const response = await fetch("/api/support/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, locale, history: options.history }),
      cache: "no-store",
    });
    if (!response.ok) return builtIn;
    const data: unknown = await response.json();
    if (typeof data === "object" && data !== null) {
      const { ok, text } = data as { ok?: unknown; text?: unknown };
      if (ok === true && typeof text === "string" && text.trim().length > 0) {
        return { kind: "text", text };
      }
    }
  } catch {
    // fall through to the built-in answer
  }
  return builtIn;
}
