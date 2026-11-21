# Terms of Service and Privacy Policy (v119, Decision #036)

Two public pages, **`/terms`** and **`/privacy`**, linked from the landing page, the sign-in
and sign-up form ("By signing in or creating an account, you agree to…"), the Plan and
billing page and the Data sources page. Operator and contact: **joelflowstack**,
**joelflowstack@gmail.com** (the business address, chosen by the owner on 2026-11-14), Nigeria.

## What is where

| Piece                                                                      | Where                                                     |
| -------------------------------------------------------------------------- | --------------------------------------------------------- |
| The words (English)                                                        | `apps/web/app/legal/legal-text.ts`                        |
| The page layout                                                            | `apps/web/app/legal/legal-view.tsx`, `terms/`, `privacy/` |
| Business name, contact address, "last updated" date                        | `packages/support/src/business.ts`                        |
| "Terms · Privacy" links and the agreement sentence                         | `apps/web/app/legal-links.tsx`                            |
| Page title, date line, "English applies", agreement sentence (5 languages) | `legal.*` keys in `packages/i18n/src/messages/*.ts`       |

The text is **English only** on purpose: translating legal wording without a lawyer would
create five documents that can disagree. Every page says, in the person's language, that the
English version is the one that applies and that they can email for help.

## What the text is based on (checked 2026-11-14/15)

- **Data collected:** `profiles`, `user_preferences`, saved fields/properties/locations,
  comments, organisations and invitations, notifications and settings, billing
  subscriptions/events/payments, per-email and per-IP sign-in counters (the IP address is
  stored), server logs. No third-party analytics or advertising trackers
  (`apps/web/package.json` has none). Cookies: sign-in session, `wv_lang`; local storage:
  sidebar state; the service worker caches pages.
- **Deletion and export** (`deleteAccountAction`, `/settings/export`): deletion is immediate
  and cascades (profile, memberships, notifications, comments, payments); an organisation's
  owner takes the organisation's saved items with them; billing event rows keep no link to
  the person (`on delete set null`). Export is a one-click JSON.
- **Where data lives:** Supabase project in **eu-west-1 (Ireland)**; Vercel functions in
  **iad1 (United States)**; Paystack for payments (never card numbers on our side).
- **What leaves the server per place:** coordinates (and search text) to weather/hazard
  providers, no identity; map tiles and camera pictures are fetched by the browser, so those
  servers see the IP; a five-character hash prefix to Have I Been Pwned for password checks.
- **Notices** are in-app only (nothing is pushed, emailed or texted), which is why the
  policy says so.
- **The help chat (v135)** has two states, and section 4 describes both: assistant off (nothing
  leaves the device) and assistant on (what you type goes from our server to Flow, then to Groq or
  Cloudflare Workers AI; no cookie, account, e-mail, IP or page is sent; danger phrases are never
  sent; we log only that a call happened). Checked against `apps/web/app/api/support/assistant/route.ts`,
  `packages/support/src/assistant.ts` (500 characters, last 6 turns) and Flow's note
  (`WORLD_VITALITY_HELP_CHAT.md` sections 1b, 6a); the Function Region, plan and provider keys are the
  owner's answers of 2026-11-21 (see `docs/runbooks/support-chat.md`). Flow runs in
  **iad1** (Washington, D.C.), the same Vercel region as World Vitality's own functions above, and
  its AI providers add Groq (United States) and Cloudflare (no country stated), so section 7 names them.
- **Billing statements** (cancel keeps paid features until the period ends; failed payment
  has a grace period, then Basic, extras read-only, nothing deleted) come from
  `services/billing-service` (`summary.ts`, `entitlements.ts`).

## Owner decisions written into the text, to confirm

1. **Age 18+.** The Education workspace has a child-safety design mandate, and the policy
   says the service is for adults and children's data is not collected. If children (for
   example pupils) are meant to use it, this must change, with a lawyer.
2. **Refunds:** "money paid for a period that has started is not refunded, except where the
   law says otherwise or where we agree; if charged by mistake, write to us". This is a
   draft policy, not something the owner had set.
3. **Prices may change at renewal, with notice.** Currency shown depends on the person's
   region (naira in Nigeria, dollars elsewhere, see Decision #037).
4. **Disputes:** laws of Nigeria; try to settle **by email first** (the owner's request); if
   that fails, the courts of Nigeria. No arbitration clause and no named city or court: add
   one only on a lawyer's advice.
5. **Liability** is capped at 12 months of fees for paid plans, with the usual carve-outs.

## What a Nigerian lawyer or compliance adviser should look at before launch

This is a plain-language draft written from what the app does, **not legal advice**.

- The **Nigeria Data Protection Act 2023** and the NDPC's implementation rules: whether
  joelflowstack must **register with the NDPC** as a data controller or processor "of major
  importance", file compliance returns, name a **data protection officer**, or do a **data
  protection impact assessment**; the exact **lawful bases**, **cross-border transfer**
  wording (Ireland and the United States), and **breach notification** duties and timing.
- Whether the **business form** (sole trader or registered company) needs naming in the
  Terms (a CAC registration number, a registered address).
- Consumer-protection rules (the FCCPC Act) for subscriptions, auto-renewal and refunds.
- Whether **tax (VAT)** must be added to the prices (the billing runbook already flags this).
- Rights and duties if customers are in the EU/UK (GDPR/UK GDPR) or elsewhere, once there
  are any.

## Changing the text

1. Edit `legal-text.ts`. If you change what is collected, who gets it or how long it is
   kept, check the facts above against the code first.
2. Bump `LEGAL_UPDATED` in `packages/support/src/business.ts` (it is the date both pages show).
3. Add a line to Decision #036 or a new decision. For a change that matters to paying
   customers, tell them in the app or by email before it applies (the Terms promise this).
