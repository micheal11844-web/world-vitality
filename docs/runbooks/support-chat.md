# Help chat: the "Help" pill on Orbi and the support window (v121, Decision #038)

Orbi, the guide character in the corner of every translated page, has a small **Help** pill
attached under it. Pressing Orbi (or the pill) opens a chat window: topic buttons, a question
box, a link to the page that answers it, and an **Email a person** button.

Where Orbi sits: bottom **right** in left-to-right languages, bottom **left** in Arabic (it follows
the reading direction, as before). The pill goes with it.

## What it is today, and is not

- **Built-in answers, not an AI.** A keyword matcher (`packages/support/src/matcher.ts`) picks one
  of nine topics (plans and billing, account and data, alerts, Globe and cameras, workspaces,
  data sources, privacy and terms, language, talk to a person) and Orbi shows that topic's written
  answer with a link to the right page. Same question, same answer, every time. It says it is an
  automatic helper, not a person.
- **Nothing is sent or stored.** It runs in the browser: no network request carries what is typed
  (checked in the browser test), nothing is saved, and the conversation is gone when the page is
  left. The Privacy Policy section "The help chat" says exactly this; keep the two in step. This
  stays true until the owner switches the outside assistant on (see below); the window's only
  extra request while it is off is a status call that carries no text.
- **Email a person** opens the visitor's own mail app addressed to `joelflowstack@gmail.com`
  with the chat copied into the body, for them to read and edit before sending. Subject and
  opening line are English (the business reads English); the chat text is in their language.
- **Emergencies come first.** A message that suggests danger or distress (emergency, trapped,
  suicide and so on, in all five languages whatever the app's language) gets the emergency note
  and nothing else: call the local emergency number (112 works in many countries), a pointer to
  findahelpline.com for crisis lines, and the plain statement that this chat cannot send help.
  Phrases, not words like "fire" (which also means the Globe's fire layer): a false alarm costs one
  calm sentence, a miss costs more. The word list is `EMERGENCY_KEYWORDS` in
  `packages/support/src/keywords.ts`.
- **Honest fallback.** Nothing recognised gets "I'm not sure I understood" and the topic buttons,
  never a guess. Answers state only what the app does (checked against Settings, the Globe,
  billing); they name no plan prices (the billing page does).

## Pieces

| Piece                                 | Where                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------ |
| Matching, emergency check, email link | `packages/support` (21 tests)                                                        |
| Word lists per language               | `packages/support/src/keywords.ts`                                                   |
| Texts in five languages               | `support.*` keys in `packages/i18n/src/messages/*.ts`                                |
| Orbi as a button + pill               | `packages/ui-components/src/layout/GuideDock.tsx`, `AppShell.tsx`, `shell-styles.ts` |
| The window                            | `apps/web/lib/support/support-panel.tsx` (lazy-loaded on first open)                 |
| Wiring                                | `apps/web/lib/support/support-provider.tsx`, inside every `I18nProvider`             |
| The one function that answers         | `apps/web/lib/support/responder.ts`                                                  |
| The outside assistant (off)           | `apps/web/app/api/support/assistant/route.ts`, `packages/support/src/assistant.ts`   |

Every translated page gets it automatically (the provider sits in each page's language
boundary). A page without a language boundary (the admin area) keeps a plain Orbi.

## The outside assistant (the owner's bot, Flow): built, **switched off** (v126)

The bot is **Flow**, a separate project of the owner's, run with another Claude. The link is
built and tested but **dormant**: it does nothing until the owner sets two variables on the
server, and he has not decided yet which AI providers a visitor's words may reach (see
"Before switching it on"). What Flow's side must answer, and what was found there, is in
`docs/handoff/flow-integration.md` (section 10) and in Flow's own `WORLD_VITALITY_HELP_CHAT.md`
(draft pull request on the Flow repo).

**How it works when on.** The window asks `GET /api/support/assistant` once, when first opened,
sending no text; the server answers `{ "enabled": true|false }` from its own settings. Only if
true does the window send typed messages on, to our own route (`POST /api/support/assistant`),
and the notice at the top changes to say so (`support.autoAssistant`). The route, on the
server: refuses anything malformed or over 20,000 characters; **refuses danger without asking
the assistant** (the window checks too, and a danger turn in the history means no history is
sent at all); rate-limits per visitor (8 a minute, 40 an hour) and overall (600 an hour), in
memory, best effort; calls Flow with a fixed system text built from the app's own nine written
answers (`support.answer.*`, English), `audience: "third_party"`, `disableTools: true`, and only
the message (500 characters) plus the last six turns; waits at most 8 seconds; refuses
redirects; and shows the reply only if it passes `cleanAssistantReply`. Every other outcome
(Flow down, slow, an error, an empty or odd reply, a limit reached) is `{ ok: false }` and the
window quietly shows the built-in answer. The topic buttons never leave the device.

**What is never sent:** cookies, session, account, e-mail, IP address, user agent, the page the
visitor is on, or any message the emergency check caught. **What is logged:** that a call
happened, its duration, and why it failed (`support_assistant_answered`,
`support_assistant_failed`). Never the message, the reply or the visitor's address.

**A reply is dropped, never repaired,** when it is empty, leaks tool-call syntax, uses Flow's
owner persona ("Boss"), or states a price (₦, $, €, £, naira, dollars, USD and so on, in the
languages the app has): the billing page is the authority on prices. Markdown marks and HTML
tags are stripped from replies that pass, and long ones are cut at a sentence end.

| Piece                                                    | Where                                                            |
| -------------------------------------------------------- | ---------------------------------------------------------------- |
| Request rules, system text, reply cleaning, rate limiter | `packages/support/src/assistant.ts` (13 tests)                   |
| On/off switch and address                                | `apps/web/lib/support/assistant-config.ts`                       |
| The route                                                | `apps/web/app/api/support/assistant/route.ts`                    |
| Window side (status, history, waiting state)             | `apps/web/lib/support/responder.ts`, `support-panel.tsx`         |
| Texts                                                    | `support.autoAssistant`, `support.thinking` in all five catalogs |

**Settings (Vercel environment variables, server only):**

| Variable               | Meaning                                                                                   |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| `FLOW_SUPPORT_ENABLED` | Must be exactly `true`. Anything else, or unset: off.                                     |
| `FLOW_SUPPORT_URL`     | Flow's chat address, `https://...` (Flow's `/api/chat`). Not `https`: off.                |
| `FLOW_SUPPORT_KEY`     | Optional. Sent as `Authorization: Bearer ...` if set. Never put it in a file or a commit. |

They are read on every request, so a change plus a redeploy is enough, and removing
`FLOW_SUPPORT_ENABLED` turns it off at once.

**Before switching it on (in this order; the last step is the switch):**

1. The owner decides which AI providers a visitor's words may reach. Flow's chain today also
   uses NVIDIA (trial terms say not for production and may use content to improve models),
   OpenRouter and Hugging Face. Options: (a) only Groq and Cloudflare, a small change on Flow's
   side that also changes Echo; (b) a new request field only World Vitality sets, for example
   `providers: ["groq", "cloudflare"]`; (c) keep the built-in answers only. See
   `docs/handoff/flow-integration.md` section 10 and Flow's note section 1b.
2. Flow's side answers the four questions in its note (region, what is stored and for how long,
   which providers, whether anything about the caller is logged), and any change from step 1 is
   made there, on a branch and pull request, not on Flow's main branch.
3. Rewrite the Privacy Policy section "The help chat" (`apps/web/app/legal/legal-text.ts`) from
   those answers, naming the providers, and bump `LEGAL_UPDATED`. Rewrite `support.auto` /
   `support.autoAssistant` in five languages to match the policy, and update this runbook. These
   go in the **same release** as the switch, never before.
4. The owner sets `FLOW_SUPPORT_ENABLED=true` and `FLOW_SUPPORT_URL` (and the key, if Flow
   enforces one) in Vercel and redeploys. Then ask the help chat a question in each language,
   check the Vercel logs show `support_assistant_answered`, and confirm a danger phrase still
   gets the emergency note and no call.

**Tests:** `pnpm test` covers the pure rules. The browser run (a pretend Flow, ten checks per
case: off by default, on, Flow down, slow, price reply, leaked tool call, "Boss", bad JSON, danger
never sent, rate limit) was done for v126 and is not part of `pnpm test`; repeat it by hand
after changing the route or window.

## Changing it

- A new topic: add its id to `SUPPORT_TOPIC_IDS` and `SUPPORT_TOPIC_HREF`, keywords in every
  language in `TOPIC_KEYWORDS`, and `support.topic.*` / `support.answer.*` in all five catalogs
  (the panel's two `Record<SupportTopicId, MessageKey>` maps fail the build until they exist).
- Keyword words are lowercase and unaccented (the matcher folds accents, case, apostrophes and
  Arabic vowel marks on both sides); a word matches at the **start** of a word, so use stems
  (`subscrib`, `notif`). Longer phrases outweigh short words.
- After any change run `pnpm test` (the tests cover every topic in every language and the
  emergency phrases).

## Also fixed with it

The shared pop-up (`Modal`) was 48px wider than 90% of a phone screen (the padding was added
outside the width) and could be taller than the window. It is now border-box, keeps its desktop
width, and scrolls inside short windows. Every dialog in the app benefits.
