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
  left. The Privacy Policy section "The help chat" says exactly this; keep the two in step.
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

Every translated page gets it automatically (the provider sits in each page's language
boundary). A page without a language boundary (the admin area) keeps a plain Orbi.

## Linking the owner's bot (not done: the owner has not said which bot)

The window calls one function, `respondToMessage` in `apps/web/lib/support/responder.ts`.
To connect a bot, change its body to call the bot and return `{ kind: "text", text }`
(`SupportReply` already has that variant, and the window already shows it). Rules to keep:

1. **Run `detectEmergency` first** and return the emergency note without asking the bot.
2. Calling a bot means **what people type leaves their device**. Update the Privacy Policy
   section "The help chat" (`apps/web/app/legal/legal-text.ts`, bump `LEGAL_UPDATED`), the chat's
   own line "Nothing you type here is saved or sent anywhere" (`support.auto`, five languages),
   and this runbook, in the same change.
3. A bot needs a **server route** (keys must not reach the browser), rate limiting and a size
   limit; the existing per-IP limiter (`apps/web/lib/get-client-ip.ts` and its users) is the
   pattern. Never send the signed-in user's data to it unless the policy says so.

Questions to answer first: is it a Telegram or WhatsApp bot, an HTTP endpoint of your own, or an
AI service? What does it cost per message, and what happens when it is down (fall back to the
built-in answers)?

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
