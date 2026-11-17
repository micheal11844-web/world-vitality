/**
 * Whether the help chat may use an outside assistant, and where it is.
 *
 * Off unless **both** are set on the server (Vercel environment variables):
 *  - `FLOW_SUPPORT_ENABLED=true`: the owner's decision, set only in the same
 *    release that updates the Privacy Policy and the chat's own notice;
 *  - `FLOW_SUPPORT_URL`: the assistant's chat address, which must be `https://`.
 * `FLOW_SUPPORT_KEY` is optional: sent as a bearer token when present.
 *
 * Read on every request (never at build time) so changing a variable and
 * redeploying is all it takes, and so the status the chat window asks for is
 * always the real one. Nothing here is ever sent to the browser except the
 * yes/no answer.
 */
export interface AssistantConfig {
  url: string;
  key: string | null;
}

export function getAssistantConfig(): AssistantConfig | null {
  if (process.env.FLOW_SUPPORT_ENABLED !== "true") return null;
  const url = process.env.FLOW_SUPPORT_URL?.trim();
  if (!url || !/^https:\/\/[^\s]+$/.test(url)) return null;
  const key = process.env.FLOW_SUPPORT_KEY?.trim() || null;
  return { url, key };
}
