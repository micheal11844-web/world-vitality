# Handoff for the Claude working on Flow: linking Flow to World Vitality's Help chat

Written 2026-11-15 by the Claude working on World Vitality, at the owner's request. The owner
(business **joelflowstack**, Nigeria, contact `joelflowstack@gmail.com`) runs both projects and is
the go-between. **Flow** is his bot; he says it is already linked to his business website.

> **Status: proposed, not built. Superseded in part by section 10 (2026-11-17): Flow's real interface is known, and the contract in section 4 is replaced by it.** The World Vitality side could not read Flow's repo (this
> session only had access to the World Vitality repo), so everything about Flow below is a request,
> not a description. If Flow already has an HTTP interface, **tell us its real shape** (section 7)
> and we will adapt our side to it instead of asking you to build a new one.

## 1. What World Vitality is

A Next.js 15 / Supabase / Vercel monorepo (public: <https://github.com/micheal11844-web/world-vitality>,
live: <https://world-vitality.vercel.app>). Weather, hazard and earth-data workspaces, a 3D Globe,
accounts, and paid plans through Paystack. Five languages: English, Spanish, French, Portuguese
(Brazil), Arabic. Read `README.md`, then `docs/runbooks/support-chat.md` (the Help chat) and
`docs/Decision-Log.md` #036 to #038.

## 2. What shipped today (2026-11-15)

- **Help chat on Orbi.** Orbi, the guide character in the corner of every page, has a "Help" pill.
  Clicking it opens a chat window with nine topics. Today the answers are **written in advance** and
  chosen by a keyword matcher that runs in the browser (`packages/support`). Nothing typed is stored
  or sent anywhere, and the Privacy Policy says so.
- **Terms of Service and Privacy Policy** (`/terms`, `/privacy`), for joelflowstack, Nigeria.
- **Regional pricing** (naira in Nigeria, dollars elsewhere, once dollar plans exist).

## 3. What we want from Flow

Flow answers the Help chat's free-text questions about World Vitality, **instead of the built-in
matcher** when it is available, with the built-in answers as the fallback whenever Flow is down,
slow, or not configured. The built-in matcher stays; it is also what keeps working if Flow breaks.

The World Vitality side is one function, `respondToMessage` in
`apps/web/lib/support/responder.ts`, and `SupportReply` already has a `{ kind: "text", text }`
variant for an answer written elsewhere. Nothing else in the chat window needs to change.

## 4. Proposed contract (v0; change it if Flow already has something)

World Vitality's **server** (never the browser, so no key is exposed) will call Flow:

```
POST  <FLOW_SUPPORT_URL>
Authorization: Bearer <shared secret>
Content-Type: application/json

{
  "source":  "world-vitality-help",
  "message": "how do I cancel my plan?",      // at most 500 characters, plain text
  "locale":  "en",                              // en | es | fr | pt | ar : reply in this language
  "page":    "/billing",                        // the page the person is on
  "history": [ { "role": "user" | "assistant", "text": "..." } ]   // up to the last 6 turns
}
```

```
200  { "reply": "plain text, at most 1200 characters, no HTML or Markdown",
       "links": [ { "label": "Plans and billing", "path": "/billing" } ] }   // links optional, paths on our site only
```

- **Any non-200, a malformed body, or no answer within 8 seconds** and World Vitality silently falls
  back to the built-in answer. So Flow may fail safely.
- World Vitality sends **no** user id, email, cookie, IP address or account data. Flow cannot and must
  not ask for them. A person's messages are the only thing it receives.
- Messages that suggest danger or self-harm are **caught on our side before Flow is called**, and
  answered with an emergency note. They are never sent to Flow. Flow should still never present
  itself as an emergency service or give emergency, medical, or legal advice.
- Rate limiting per visitor, the 500-character cap and the timeout are enforced on our side. Flow
  should still protect itself (its own limit, a shared-secret check, no open endpoint).

## 5. How Flow should answer

- **Only about World Vitality**; say plainly that it is an automatic assistant, not a person. If it
  does not know, say so and point to "Email a person" (`joelflowstack@gmail.com`). Never invent.
- **No prices, refund promises or legal claims.** Plan prices live on the billing page, which is the
  authority. Refunds and disputes go to a person by email.
- **The facts are in the catalogs**, which are the source of truth for what the app does:
  `packages/i18n/src/messages/en.ts`, keys `support.answer.*` (nine topics). Do not contradict them.
  Notably: alerts appear inside the app only (no email, SMS or push yet); the Globe needs a sign-in;
  card details never touch World Vitality (Paystack's page); deleting an account is permanent;
  the legal pages are in English only.
- Answer in the `locale` given, in the same plain tone as those answers. Keep it short.

## 6. What the owner and you must answer before we can switch it on

The Privacy Policy (`apps/web/app/legal/legal-text.ts`, section "The help chat") currently says what
people type stays on their device. Sending messages to Flow makes that untrue, so **it must be
changed before activation**, and we can only write it truthfully with these facts about Flow:

1. Where does Flow run (host and country/region)?
2. Does it **store** messages or logs? What, for how long, who can read them, how are they deleted?
3. Does it pass messages to a **third-party AI provider**? Which one, and under what terms?
4. Is anything logged about the visitor beyond the message (IP, headers)?

Write the answers in section 9. Do not guess; "not stored" is only acceptable if it is true.

## 7. How to reply (no secrets in this repo, it is public)

- Put answers in **section 9 below** and open a **GitHub issue** on the World Vitality repo titled
  "Flow: reply to handoff" so the World Vitality Claude is notified. Or ask the owner to relay.
- **Never paste a token, key or secret** into this repo, an issue, or a commit. The shared secret
  is set directly as an environment variable on both sides by the owner (see section 8).
- If Flow's existing interface differs from section 4, describe it here: URL, method, auth, request
  and response shape, limits. We will adapt `responder.ts`.

## 8. Activation checklist (World Vitality side, done only after section 6 is answered)

1. Server route that calls Flow (secret read from the environment), with the 8-second timeout, size
   limits, per-visitor rate limit, and the built-in answer as the fallback.
2. Environment variables on Vercel set by the owner: the Flow URL and the shared secret.
3. The emergency check stays first, on our side.
4. Privacy Policy section "The help chat" rewritten from the real answers in section 6, `LEGAL_UPDATED`
   bumped; the chat's own line "Nothing you type here is saved or sent anywhere" (`support.auto`, five
   languages) changed to say messages go to the assistant; the Terms mention reviewed.
5. Tests (the fallback, the timeout, the caps) and a browser check, then a deploy confirmed READY.

## 9. Replies from Flow's side

_(empty: to be filled in by the Claude working on Flow, or relayed by the owner)_

## 10. Findings from reading Flow (2026-11-16 and 2026-11-17, by the World Vitality Claude)

Flow's repo (`Joel44118/flow-V3`, private) became readable once the owner connected the Claude GitHub app on that account. Read only; one docs-only note was added on a branch
(`WORLD_VITALITY_HELP_CHAT.md`, draft PR #3 in that repo, not merged, nothing deployed). What was found, at Flow commit `11ccaf8`:

- **Interface.** `POST /api/chat` on Flow's Vercel project is public (CORS `*`). `{ audience: "third_party", disableTools: true, messages: [system, ...history, user] }` turns all tools off, drops
  the self-knowledge block and saves nothing to semantic memory. The reply is `{ reply: string, ... }`; a failure is a non-200 or no `reply`. Auth enforcement is off unless `FLOW_AUTH_ENFORCE=1`;
  a `Bearer FLOW_API_KEY` header is accepted. **So section 4's contract (`source`, `message`, `locale`, `links`) is replaced by this**: World Vitality sends its own system prompt (built from its
  answer catalogs, in the visitor's language) and the last six turns, and reads `reply`. Flow is at Vercel's 12-function cap, so a new endpoint was never an option.
- **Providers.** NVIDIA and Groq race, then OpenRouter, Cloudflare Workers AI and Hugging Face. Their own pages (read 2026-11-17; links in the Flow note): Groq does not retain inference data by default
  (up to 30 days for reliability and abuse; stored in the US); Cloudflare Workers AI does not retain or train; OpenRouter does not store prompts by default but its page is silent on free models and upstream
  providers; Hugging Face does not store request bodies but defers to downstream providers; **NVIDIA's API Trial Terms allow internal testing only, "not in production", bar personal information about identifiable
  people, and let NVIDIA use inputs and outputs to improve its AI models.** (Which kind of NVIDIA key Joel has is not known.)
- **Decision pending (the owner's):** limit the `third_party` path to Groq and Cloudflare (a change on Flow's side that would also affect Echo, the Telegram bot for strangers), or use a new request field only World Vitality
  sets, or keep the built-in answers and not use Flow. **Nothing is built or switched on until this is decided.**
- **Still unknown, only Flow's side can say:** the Vercel region the function runs in (`vercel.json` pins none), how long Vercel keeps function logs on Joel's plan, whether anything else in Flow (`core/memextract.js`,
  `core/chat-persist.js`, `core/flow-actions-log.js`) stores text from a `third_party` call, and whether anything about the caller (IP, headers) is logged.
- **Privacy Policy.** Section "The help chat" and `support.auto` (five languages) still say messages stay on the device. They are changed in the same release that switches Flow on, never before.

## 11. Update 2026-11-17: World Vitality's side is built, and switched off

The route, the window changes and the tests are in World Vitality (`apps/web/app/api/support/assistant/route.ts`,
`packages/support/src/assistant.ts`; details in `docs/runbooks/support-chat.md`). It calls Flow's `/api/chat` exactly as
described in section 10 and Flow's `WORLD_VITALITY_HELP_CHAT.md`: `audience: "third_party"`, `disableTools: true`, a system
text World Vitality writes, the new message and at most six earlier turns, nothing else. It uses the success shape
`{ reply: string }` and treats anything else as a failure (it then shows its own built-in answer).

Nothing is on. It starts only when the owner sets `FLOW_SUPPORT_ENABLED=true` and `FLOW_SUPPORT_URL` in World Vitality's Vercel
settings, which he will not do before (1) deciding which providers a visitor's text may reach, (2) Flow's side answering the
four questions in section 6 of Flow's note, and (3) the Privacy Policy being rewritten from those answers. **Nothing is needed
from Flow's side until the owner decides step 1.** If the answer is "only Groq and Cloudflare" or a `providers` field, that is
the one change on Flow's side, on a branch and pull request.
