# Billing Runbook

Billing is built and **switched on in production** (`BILLING_ENABLED=true`,
set at the owner's explicit request on 2026-11-06, with Paystack in **test
mode** and the test secret key, so no real money moves). While that switch is
unset, nothing in the app charges anyone, limits anyone, or reads the billing
tables (BUILD_PLAN v90, v93, v94; the reasoning is Decisions #018, #019,
#020). **The first test payment succeeded on 2026-11-07** (see "First test
payment" below for what that confirmed and what is still unchecked). It first
failed with Paystack's "Plan not found" (`paystack-setup.md`, "If checkout says
it couldn't start the payment"); creating the four plans again in Test mode and
swapping the codes into `PAYSTACK_PLAN_CODES` fixed it, so the key was fine and
the first set of plan codes was not visible to it.
This page says what exists, what does not, the prices, and the order to turn
it on. The click-by-click for Paystack is in `paystack-setup.md`.

## What exists

| Piece                                                                                                  | Where                                                              |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Plan catalogue (limits, features, support)                                                             | `services/billing-service/src/plans.ts`                            |
| List prices                                                                                            | `services/billing-service/src/prices.ts`                           |
| "What may this person do?" rules (fail-open, grace period, read-only after a downgrade)                | `services/billing-service/src/entitlements.ts`                     |
| Paystack signature check, event reading, plan-code mapping, checkout request, card-update link, cancel | `services/billing-service/src/paystack.ts`                         |
| What the plan screen shows for a subscription (free / active / ending / past due / manual)             | `services/billing-service/src/summary.ts`                          |
| How Paystack events change a subscription                                                              | `services/billing-service/src/subscription.ts`                     |
| The webhook, from raw bytes to stored result                                                           | `services/billing-service/src/webhook.ts`                          |
| Storage (Supabase + an in-memory one for tests)                                                        | `services/billing-service/src/store.ts`                            |
| Webhook route                                                                                          | `apps/web/app/api/paystack/webhook/route.ts`                       |
| Plan & billing screen (`/billing`, 404 while billing is off)                                           | `apps/web/app/billing/`                                            |
| Its buttons: Subscribe, Update card, Cancel                                                            | `apps/web/lib/billing-actions.ts`                                  |
| Cancelling the Paystack subscription when an account is deleted                                        | `apps/web/lib/billing-cancel.ts`, called from `account-actions.ts` |
| Switchboard (`billingEnabled`, plan codes, entitlements for a person / an organisation)                | `apps/web/lib/billing.ts`                                          |
| The checks made when someone adds something                                                            | `apps/web/lib/plan-limits.ts`                                      |
| Tables (apply with `apply-migrations.md`)                                                              | `services/identity-service/supabase/migrations/0017_billing.sql`   |
| Settings to fill in                                                                                    | `services/billing-service/.env.example`                            |

## The plans

`null` = no cap (Enterprise terms are agreed per customer).

|                       | Basic (free) | Standard | Premium  | Enterprise    |
| --------------------- | ------------ | -------- | -------- | ------------- |
| Workspaces            | 1            | 3        | 10       | all           |
| Seats                 | 1            | 5        | 25       | custom        |
| Saved items           | 3            | 25       | 100      | custom        |
| Forecast outlooks     | –            | yes      | yes      | yes           |
| CSV export, print/PDF | –            | yes      | yes      | yes           |
| Team tools            | –            | yes      | yes      | yes           |
| Auditable report      | –            | –        | yes      | yes           |
| Audit log             | –            | –        | yes      | yes           |
| Email alerts †        | –            | yes      | yes      | yes           |
| SMS alerts †          | –            | –        | yes      | yes           |
| Bulk export, API †    | –            | –        | –        | yes           |
| Integrations, SSO †   | –            | –        | –        | yes           |
| Support               | community    | email    | priority | named contact |

† **Not built yet.** Marked in code (`UNBUILT_FEATURES`); anything that
shows a plan's contents must hide or label these.

**On every plan, never switchable by tier:** official life-safety alerts,
the Public Explorer, exporting and deleting your own data, one-click
cancel. Downgrading past a limit makes the extras read-only; nothing is
deleted.

## The prices (Decision #020)

Tax-inclusive. A year costs ten months (two free) — the only discount.

|                          | Monthly                               | Annual   |
| ------------------------ | ------------------------------------- | -------- |
| Standard, Nigeria (NGN)  | ₦7,500                                | ₦75,000  |
| Premium, Nigeria (NGN)   | ₦25,000                               | ₦250,000 |
| Standard, abroad (USD) † | $9                                    | $90      |
| Premium, abroad (USD) †  | $29                                   | $290     |
| Enterprise               | contact us, invoiced outside Paystack |          |

† Only sold once USD is enabled on the Paystack account **and** USD plan
codes are configured. **Launch with the four NGN plans.** Enterprise is never
a Paystack plan.

**Why these numbers.** Nigerian prices are set for local purchasing power,
not converted from USD, and one price per tier keeps the pricing page to
four numbers. Paystack's local fee is 1.5% + ₦100 (the ₦100 is waived under
₦2,500; capped at ₦2,000), international 3.9% + ₦100 — so Standard nets about
₦7,290 and Premium about ₦24,525 per month. Paystack's fee table is at
<https://paystack.com/pricing>; check it before launch.

**What it has to cover (rough, and an assumption, not a quote).** Charging
typically means three paid plans: Open-Meteo Standard $29/month (1M calls;
see below), Vercel Pro $20/month (the free Hobby plan is for personal,
non-commercial use) and Supabase Pro $25/month (daily backups, no pausing —
strongly advisable with paying customers' data, though not a licence
requirement). That is about **$74/month**. At roughly ₦1,550 to the dollar
(**check today's rate — this moves**), Standard nets about $4.70 and
Premium about $15.80, so the fixed costs are covered by about **16 Standard
or 5 Premium customers**. Everything above that is margin, before your own
time, support and tax.

**VAT and income tax are not handled.** Prices are shown and charged as
given; whether VAT must be added on top depends on registration and is a
question for an accountant. If it must, `prices.ts` is the place to revisit.

**Changing a price.** Edit `prices.ts` **and** create a new Paystack plan:
a plan fixes its amount, so the app picks the price through the plan code
(`PAYSTACK_PLAN_CODES`). Existing subscribers stay on the old plan until
they move; check Paystack's current behaviour before editing a plan's
amount in place.

## Where limits are enforced

Only when someone **adds** something; nothing already saved is ever hidden,
locked or deleted over a limit, and reading is never gated.

| Limit              | Checked when                                           | Where                                                                                                                                   |
| ------------------ | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| Saved items        | adding a field, insured property or monitored location | `field-actions.ts`, `property-actions.ts`, `location-actions.ts` → `savedItemLimitMessage`                                              |
| Seats              | sending an invitation                                  | `team-actions.ts` → `seatLimitMessage`                                                                                                  |
| Seats (race-proof) | accepting an invitation                                | `app/auth/callback/route.ts` → `seatCapForJoining` → `join_organization` (one atomic statement, so the last seat cannot be taken twice) |

- **An organisation's plan is its owner's plan** (`billing_subscriptions` is
  keyed by the owner's user id). Seats = people in the organisation; saved
  items = rows across the three item tables. See `organisations.md`.
- **Billing off ⇒ no limits and no database reads.** With
  `BILLING_ENABLED` unset, every check returns "go ahead" immediately.
- **Fails open.** If the plan or the counts cannot be read, the person is let
  through and the error is logged — a payment-system fault must not lock a
  customer out of their own work. (Organisations do the opposite and fail
  _closed_, because there the risk is showing someone else's data.)
- **Not enforced:** the `workspaces` limit (only three workspaces hold saved
  items, so there is nothing to count yet). The on/off **feature** switches are
  wired where a screen exists — see "Feature switches" below.
- **An owner cannot delete their account while others are still in their
  organisation.** When billing is on, deleting an account first cancels its
  Paystack subscription, and **if Paystack cannot confirm the cancellation the
  account is not deleted** (the person is told, and can retry) — deleting
  anyway would leave them being charged for a plan they can no longer reach.
  The members check runs before the cancel, so a refused deletion never
  cancels anything.

## Feature switches (v98)

A locked feature is replaced, in the place it would have been, by one
sentence and a "See plans" link: _"Forecast outlooks are included in the
Standard plan and above. Your plan is Basic."_ Nothing else on the page
changes (Decision #022). The check is `featureLockedFor(feature)` in
`apps/web/lib/plan-features.ts`; the notice is `FeatureLockedNote`
(`apps/web/app/plan-notice.tsx`).

| Switch             | Plans                         | Where it is wired                                                                                                                                                                                                                         |
| ------------------ | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `forecastOutlooks` | Standard, Premium, Enterprise | The 7-day forecast cards on Weather & Climate, Construction (site risk timeline), Logistics (route risk outlook) and Renewable Energy (wind and solar outlooks). When locked the forecast is **not requested** from the weather provider. |
| `csvExport`        | Standard and up               | "Download CSV" on the Agriculture, Insurance and Government & NGOs reports                                                                                                                                                                |
| `printReport`      | Standard and up               | "Print / Save as PDF" on the same three reports                                                                                                                                                                                           |

- **A convenience, not access control.** It decides what the screen offers;
  the data on the page is data the person can already read, and the browser's
  own Print still works. Nothing saved is hidden, locked or deleted.
- **The plan is the organisation's (its owner's)**, so a member sees what the
  organisation has paid for.
- **Billing off ⇒ nothing is locked and the plan is not looked up. If the
  plan cannot be read ⇒ nothing is locked** (logged). One plan lookup per page,
  however many switches it asks about.
- The note is hidden when the report is printed, and is written in the
  reader's language like the other limit text.
- **Not wired, on purpose:** `teamTools` (Basic's one seat already stops
  invitations, with a clearer message), `auditLog` (no customer-facing screen
  exists), `auditableReport` (the Insurance report is one page; there is no
  separate "auditable" version to lock) and the features that are not built
  (`emailAlerts`, `smsAlerts`, `bulkExport`, `apiAccess`, `integrations`,
  `sso`). The Research dataset explorer's CSV and forecast stay open — it is a
  raw-data tool by design.
- **Before switching billing on:** anyone not subscribed, including your own
  account, loses the forecast cards and report downloads until they subscribe
  (or are put on a plan by hand — see "Putting a customer on Enterprise", with
  `'standard'` in place of `'enterprise'`). Subscribing in test mode, as the
  first test payment does, shows the cards and buttons returning.

## Weather data licence — before charging anyone

The forecasts come from Open-Meteo. Its **free tier is for non-commercial
use only**, so charging customers requires a paid plan
(<https://open-meteo.com/en/pricing>).

- **Which plan:** Standard, $29/month, 1,000,000 calls a month. The app uses
  only the **forecast** and **geocoding** APIs (checked: no Historical,
  Climate or Ensemble calls, which Standard excludes). Professional ($99,
  5M calls) is the next step up if usage grows; Open-Meteo emails at 80%,
  90% and 100% of the monthly budget.
- **What you do:** subscribe on Open-Meteo's site and copy the API key it
  gives you.
- **What the app does with it:** set `OPEN_METEO_API_KEY` in Vercel. With a
  key, every forecast and place-search request goes to Open-Meteo's paid
  `customer-` hosts with the key; without one, nothing changes from today.
  The admin console's "before charging" notice clears itself once the key is
  set, and forecast records say they were read under a commercial licence.
- **Not yet checked against the real service:** the app was changed to use the
  paid hosts from Open-Meteo's published documentation; it has not been run
  with a real key. After adding it, open the Weather workspace and the admin
  console's Data sources → "Run live checks" to confirm forecasts still load.
- **Attribution is still required** (the data is CC BY 4.0), key or no key.
- **Call volume:** the Weather, Construction, Logistics, Renewable Energy and
  Research pages each request a forecast when opened. Nothing here has been
  measured; as a rough upper bound, a thousand customers opening five
  forecast pages a day is about 150,000 calls a month — well inside 1M, but
  worth watching from Open-Meteo's own usage emails.

## Turning it on, in this order

Start with `paystack-setup.md`; this is the same order in brief.

1. **Apply migrations 0016–0018** (`apply-migrations.md`). Nothing reads the
   billing tables until step 5, so this is safe to do early; 0018 is the
   privacy fix and should not wait.
2. **Open-Meteo licence** (above): subscribe, add `OPEN_METEO_API_KEY`.
3. **Create the four plans in Paystack — test mode first**, and the settings
   in Vercel (`PAYSTACK_SECRET_KEY`, `PAYSTACK_PLAN_CODES`) — never in chat or
   in a file in the repo. Leave `BILLING_ENABLED` unset for now. **If you
   already use Paystack for another project, add World Vitality as its own
   business under the same login** (a business has one webhook URL, and yours
   is taken) — see `paystack-setup.md`.
4. **Point Paystack at the webhook:**
   `https://<your-domain>/api/paystack/webhook`. Paystack signs with the
   secret key; there is no separate webhook secret.
5. **Set `BILLING_ENABLED=true`** and redeploy. The webhook now verifies and
   records events, and plan limits start applying (everyone is Basic until
   they subscribe, so **existing customers over 3 saved items or 1 seat
   simply cannot add more** — decide whether that is what you want before
   this step; nothing is deleted).
6. **Make a first test-mode payment** from `/billing` (see "First test
   payment" below), and only then switch the keys to live. The plan screen
   exists from step 5 on; until `BILLING_ENABLED` is true `/billing` is a 404
   and Settings shows no billing card, so nobody sees anything early.

## The plan screen (`/billing`)

Reached from Settings → "See plan & billing", and from a "See plans" link
beside any plan-limit message. It exists only while `BILLING_ENABLED` is
`true`.

- **Only the organisation's owner** can subscribe, update the card or cancel
  (the plan is the owner's). A member sees the owner's plan, read-only, with
  a note saying so. Every button acts on the signed-in person's own id; the
  browser never says whose subscription it is.
- **Subscribe** sends the person to Paystack's own checkout page (card
  details never touch this app). Only prices with a Paystack plan code
  configured are shown, so USD stays hidden until its plans exist. The
  return address is built from the origin of `SUPABASE_AUTH_REDIRECT_URL` —
  the setting the sign-in emails already use — never from the request, so it
  must be set in Vercel.
- **Returning from Paystack** shows "we're confirming your payment", never
  "paid": the webhook is the source of truth. The page re-checks every few
  seconds for about half a minute and then stops; "Refresh" works any time.
- **Update card** opens Paystack's hosted page for the subscription.
- **Cancel** is one click plus one confirmation, and the person keeps the
  plan until the end of the period they paid for. The page shows "ends on
  <date>" only once Paystack's `subscription.not_renew` webhook arrives.
- **Changing between paid plans while subscribed is not offered.** Paystack
  has no switch on a running subscription, so the screen says: cancel, then
  subscribe to the other plan once it ends. A person whose payments failed
  and lapsed to Basic who subscribes again has the old Paystack subscription
  stopped first, so they are never charged for both.
- **Payment methods are Paystack's, not ours.** The checkout request does not
  restrict channels, so whatever is switched on in the Paystack dashboard
  (Settings → Preferences) is what a customer sees — including **Google
  Pay** if you enable it there (below).
- **A failed renewal leaves a notice in the owner's inbox** (v105): "Your
  payment didn't go through — we couldn't renew your <plan> plan. Update your
  card to keep it", linking here, in the owner's language with the plan name
  translated, always shown whatever the notification settings say. One per
  subscription per day however often Paystack retries (the key is
  `payment_failed:<subscription>:<date>`). It is added after the
  `invoice.payment_failed` webhook has been applied and can never make the
  webhook fail; it needs migration 0019 (until then it is logged as
  `notify_user_failed` and the plan still moves to past due as before).
- **Handing the organisation to someone else is refused while the owner's
  plan is in effect** (see `docs/runbooks/organisations.md`): a subscription
  does not move between people.
- Enterprise is invoiced and set by hand (below); the screen shows such a
  plan as "set up by agreement" with nothing to manage, and does not
  advertise a contact route because none exists yet.

### Google Pay

Paystack supports Google Pay on its hosted checkout for businesses in
Nigeria, Kenya, Ghana and South Africa (Visa and Mastercard only, with the
card saved to the customer's Google account). It is **a dashboard setting,
not something this app implements**: Dashboard → Settings → Preferences →
turn on **Google Pay** (Cards must also be on). Paystack's checkout then
shows "Pay with Card or Google Pay" on devices and browsers that support it,
and Paystack says the authorisation can be reused for subscription renewals.
Sources: <https://support.paystack.com/en/articles/10458754> and
<https://support.paystack.com/en/articles/10458690>. Not verified here: that
it appears on a _plan_ checkout specifically — check in test mode.

## First test payment

**Result, 2026-11-07 (Standard, monthly, Paystack test card).** Read back from
the live database afterwards: one `billing_subscriptions` row for the owner,
`plan = standard`, `status = active`, `currency = NGN`, a Paystack customer and
subscription code, `current_period_end` one month ahead, `past_due_since`
empty. `billing_events` shows `subscription.create` **applied** and
`charge.success` **ignored** with reason `no_change` (it arrived a moment
before the subscription existed, so there was nothing for it to change; that is
the designed outcome, not an error). So these are now **confirmed against the
real service**: Subscribe reaches Paystack's checkout with a plan code; the
`subscription.create` event carries the fields the reader expects; the
signature check accepts Paystack's real signature; the plan appears on the
plan screen. **Still unchecked against the real service:** Update card, Cancel
and the `subscription.not_renew` event, a failed renewal, a redelivery, Google
Pay on a plan checkout, and anything in live mode.

The plan screen was first exercised in a browser against a stand-in Paystack
and a stand-in database. The list below was the checklist for the first real
test-mode payment; the items marked above as confirmed are done. If one of the
others is wrong, the fix is small and local.

- Subscribing from `/billing` lands on Paystack's checkout and returns to
  `/billing?checkout=return`; the plan appears within a minute.
- **Update card** opens a Paystack page (`GET /subscription/:code/manage/link`
  returns `data.link`).
- **Cancel** works (`POST /subscription/disable` with the subscription's
  `email_token`) and the `subscription.not_renew` webhook then arrives, with
  the end date. Cancelling something already cancelled is treated as done.
- Google Pay (if enabled) shows on the checkout for a _plan_ payment.

- The checkout request (`startCheckout`) is accepted: Paystack's
  initialise-transaction call takes `plan` and ignores `amount` when `plan`
  is set. We send a placeholder `amount`; confirm Paystack takes the plan's.
  (Paystack's reference lists `amount` as required and says `plan` "would
  invalidate the value provided in amount", which is why we send one.)
- The events arrive with the fields the reader expects: `subscription.create`
  has `data.subscription_code`, `data.plan.plan_code`,
  `data.customer.{customer_code,email}`, `data.next_payment_date`;
  `invoice.payment_failed` and `charge.success` carry
  `data.subscription.subscription_code`.
- `subscription.not_renew` carries the date the paid term ends in
  `data.next_payment_date`. If it does not, a cancelled subscription keeps
  its plan until `subscription.disable` arrives, which is the safe way to be
  wrong.
- A failed renewal (Paystack's test cards can simulate this) moves the
  subscription to past-due, and the next successful charge restores it.
- A redelivery (Dashboard → Transactions/Webhooks → retry) is acknowledged
  and changes nothing.

Anything the reader does not recognise is acknowledged and recorded as
`ignored` with a reason in `billing_events`, so a wrong guess shows up
there rather than as an error.

### Checked against Paystack's published documentation (2026-10-31)

Read from <https://paystack.com/docs/api/subscription/>,
<https://paystack.com/docs/api/transaction/> and
<https://paystack.com/docs/payments/webhooks/> — documentation only, still no
call to the real service.

- **Matches what the app sends and reads:** `POST /transaction/initialize`
  (`email`, `amount`, `plan`, `currency`, `callback_url`; returns
  `data.authorization_url` and `data.reference`); `GET /subscription/:code`
  (`status`, `email_token`, `next_payment_date`); `POST /subscription/disable`
  (`code` + `token`); `GET /subscription/:code/manage/link` (`data.link`);
  the `x-paystack-signature` header (HMAC SHA-512 of the body with the secret
  key); the event names `subscription.create`, `subscription.not_renew`,
  `subscription.disable`, `invoice.payment_failed`, `charge.success`.
- **Not stated by the documentation, so confirmed only by the first test
  payment:** the full list of subscription `status` values (only `active` is
  shown; the app treats `non-renewing`, `cancelled`, `completed` and
  `complete` as already stopped, and anything else as live, which fails safe);
  whether `metadata` may be sent as an object (the reference types it as a
  string; the app sends an object and does not read it back, so a rejection
  would show as a failed checkout and is a one-line fix); the manage-link path
  (shown with a trailing slash in the heading and without it in the example;
  the app omits it).
- **Webhook delivery:** the app relies on the signature, not on source
  addresses. Test-mode webhooks are retried hourly for 72 hours; live ones
  every 3 minutes for the first four tries, then hourly.
- **Events the app records but does not act on:** `invoice.create`,
  `invoice.update`, `subscription.expiring_cards`. Renewals arrive as
  `charge.success`, which is handled.

## Payments, receipts and refunds (v111)

**What exists.** Every successful Paystack payment (`charge.success`) is kept
in `billing_payments` (migration `0022_billing_payments.sql`), so the plan
screen lists the person's payments (newest 24) with a **Receipt** link, and
`/billing/receipt/<reference>` is a printable page ("Print or save as PDF").
A `refund.*` event moves that payment's refund status forward and, when the
refund is **processed**, the person gets an in-app notice (once per payment).

**Apply migration 0022** before relying on any of this (the webhook answers 500
for a `charge.success` while the table is missing, and Paystack retries for 72
hours, which is the safe failure: nothing is lost). See `apply-migrations.md`.

**What is kept.** Paystack's transaction reference, who paid, the amount in
kobo/cents, the currency (NGN or USD only; anything else is skipped), the plan,
when it was paid and how far any refund has got. Not the customer's email, not
card or bank details, not the webhook body. Paystack stays the system of
record; delete an account and its payment rows go with it.

**The payment arrives before the plan.** For a first payment `charge.success`
usually lands a moment before `subscription.create`, so the payment is matched
to the person by the account email, like the first subscription event. A
payment whose person cannot be found is acknowledged and not kept (the event
shows `unknown_customer` in `billing_events`; the payment is in Paystack).
Payments made before v110 are not in the list either: that history is in the
Paystack dashboard, and a backfill was not built.

**The receipt.** Date (shown in UTC, with its name, so it reads the same
everywhere), reference, account email, plan, amount paid with two decimals,
"Paid through Paystack", and the line "This is a record of your payment. It is
not a tax invoice." Only the person who paid can open it; anyone else, and any
unknown reference, gets a plain 404. **To put your business's legal name,
address and tax number on it**, set `BILLING_RECEIPT_SELLER` in Vercel to
lines separated by `|`, e.g. `World Vitality Ltd | 12 Example Street, Lagos |
TIN 1234567-0001` (at most five lines; until set, it says "World Vitality").

**Refunds.** You refund in the Paystack dashboard (Transactions, open the
payment, Refund). Paystack then sends `refund.pending`, `refund.processing`,
`refund.processed` or `refund.failed`; the payment shows "Refund in progress",
"Refund processed" or "Refund didn't complete". The status only moves forward
(a late "pending" never undoes "processed"). **No amount is shown or stored for
a refund**: Paystack's refund event does not say plainly which unit its amount
is in, and a partial refund would need summing, so an amount would sometimes be
wrong. The amount is in the Paystack dashboard.

**A refund does not end the plan.** The plan follows the subscription, so if
you refund a customer who wants out, also disable their subscription in
Paystack (Customers, the subscription, Disable); the app then moves them to
"ends on …" by itself. The refund notice tells the person that a refund does
not change their plan and that they can cancel from Billing. A refund for a
payment we never kept (made before v110, say) is acknowledged and ignored
(`unknown_payment`).

**Checked against Paystack's documentation (2026-11-10).** The refund event
example on Paystack's refund page carries the payment's reference at
`data.transaction_reference` (also read from `data.transaction.reference`, in
case a refund event nests it); the status is taken from the event name, not
from a body field. The first live refund is the real test: after it, look at
the payment row (`refund_status`) and `billing_events` (`refund.processed`,
`applied`). If a refund event shows `ignored` / `unknown_payment` for a payment
that IS in `billing_payments`, the reference field differs from what we read:
send me that event's shape (without the email) and I will adjust the reader.

**Emails.** The app has no mail sender of its own and this does not add one.
Paystack emails the customer its own receipt for a payment and its own notice
for a failed renewal (check Settings, Preferences in the Paystack dashboard that
customer emails are on). The app adds the in-app notices (failed renewal, since
v105; refund processed, since v111) and the printable receipt. If you later want
branded emails from World Vitality, that needs a mail service (Resend, Postmark
or similar) and a verified sending domain, both yours to set up.

**Tax is your decision, not the app's.** Prices are tax-inclusive (v94). Whether
you must charge VAT, issue VAT invoices, or register for it depends on your
company and turnover; ask an accountant. The receipt deliberately says it is not
a tax invoice. If you need real invoices later, that is a separate piece of work
once you know what the law requires of you.

## Not built yet

- Switching between paid plans in one step (Paystack cannot do it on a
  running subscription; the screen explains cancel-then-subscribe).
- A route for Enterprise enquiries on the screen (there is no contact address
  or form yet to point at).
- The `workspaces` limit, and the feature switches for team tools, the audit
  log and the auditable report (see "Where limits are enforced" and "Feature
  switches").
- Our own **emails** for receipts, refunds and failed payments, and real
  **tax invoices** (see "Payments, receipts and refunds (v111)": the in-app
  notices and the printable receipt exist; Paystack sends its own emails).
- Moving a subscription to another owner.
- The plan limit and feature-locked sentences ("Your Basic plan includes up
  to 3 saved items…"), the workspace pages around them and the plan screen
  are all in the five languages (English, Spanish, French, Brazilian
  Portuguese, Arabic), machine-drafted and unreviewed by native speakers.
  The limit sentence is written from the catalog (`billing.limit.reached.*`),
  the feature sentence from `billing.feature.*`; in English they read exactly
  as the billing service's own `limitReachedMessage` and
  `featureLockedMessage`, apart from numbers of 1,000 or more getting a
  thousands separator.
- USD charging needs a USD settlement account on the Paystack side.

## Putting a customer on Enterprise (invoiced, by hand)

Staff cannot grant plans from the admin console, on purpose. With the SQL
editor, after the customer has an account:

```sql
insert into public.billing_subscriptions
  (user_id, plan, status, source)
values
  ('<their user id>', 'enterprise', 'active', 'manual')
on conflict (user_id) do update
  set plan = 'enterprise', status = 'active', source = 'manual', updated_at = now();
```

Payment events never change a `manual` row. To end it, set `status` to
`cancelled`. Look the user id up on the admin console's User lookup screen.
The plan belongs to the **owner** of an organisation, so give it to the
owner's user id and everyone in that organisation gets it.

## Housekeeping

`billing_events` holds a key, the event name and the outcome — no payloads.
Paystack stops retrying after 72 hours, so rows older than a month can be
deleted:

```sql
delete from public.billing_events where received_at < now() - interval '30 days';
```
