# Billing Runbook

Billing is built but **switched off**: nothing in the app charges anyone,
limits anyone, or reads the billing tables until `BILLING_ENABLED=true`
(BUILD_PLAN v90, v93, v94; the reasoning is Decisions #018, #019, #020).
This page says what exists, what does not, the prices, and the order to turn
it on. The click-by-click for Paystack is in `paystack-setup.md`.

## What exists

| Piece | Where |
| --- | --- |
| Plan catalogue (limits, features, support) | `services/billing-service/src/plans.ts` |
| List prices | `services/billing-service/src/prices.ts` |
| "What may this person do?" rules (fail-open, grace period, read-only after a downgrade) | `services/billing-service/src/entitlements.ts` |
| Paystack signature check, event reading, plan-code mapping, checkout request | `services/billing-service/src/paystack.ts` |
| How Paystack events change a subscription | `services/billing-service/src/subscription.ts` |
| The webhook, from raw bytes to stored result | `services/billing-service/src/webhook.ts` |
| Storage (Supabase + an in-memory one for tests) | `services/billing-service/src/store.ts` |
| Webhook route | `apps/web/app/api/paystack/webhook/route.ts` |
| Switchboard (`billingEnabled`, plan codes, entitlements for a person / an organisation) | `apps/web/lib/billing.ts` |
| The checks made when someone adds something | `apps/web/lib/plan-limits.ts` |
| Tables (apply with `apply-migrations.md`) | `services/identity-service/supabase/migrations/0017_billing.sql` |
| Settings to fill in | `services/billing-service/.env.example` |

## The plans

`null` = no cap (Enterprise terms are agreed per customer).

| | Basic (free) | Standard | Premium | Enterprise |
| --- | --- | --- | --- | --- |
| Workspaces | 1 | 3 | 10 | all |
| Seats | 1 | 5 | 25 | custom |
| Saved items | 3 | 25 | 100 | custom |
| Forecast outlooks | – | yes | yes | yes |
| CSV export, print/PDF | – | yes | yes | yes |
| Team tools | – | yes | yes | yes |
| Auditable report | – | – | yes | yes |
| Audit log | – | – | yes | yes |
| Email alerts † | – | yes | yes | yes |
| SMS alerts † | – | – | yes | yes |
| Bulk export, API † | – | – | – | yes |
| Integrations, SSO † | – | – | – | yes |
| Support | community | email | priority | named contact |

† **Not built yet.** Marked in code (`UNBUILT_FEATURES`); anything that
shows a plan's contents must hide or label these.

**On every plan, never switchable by tier:** official life-safety alerts,
the Public Explorer, exporting and deleting your own data, one-click
cancel. Downgrading past a limit makes the extras read-only; nothing is
deleted.

## The prices (Decision #020)

Tax-inclusive. A year costs ten months (two free) — the only discount.

| | Monthly | Annual |
| --- | --- | --- |
| Standard, Nigeria (NGN) | ₦7,500 | ₦75,000 |
| Premium, Nigeria (NGN) | ₦25,000 | ₦250,000 |
| Standard, abroad (USD) † | $9 | $90 |
| Premium, abroad (USD) † | $29 | $290 |
| Enterprise | contact us, invoiced outside Paystack | |

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

| Limit | Checked when | Where |
| --- | --- | --- |
| Saved items | adding a field, insured property or monitored location | `field-actions.ts`, `property-actions.ts`, `location-actions.ts` → `savedItemLimitMessage` |
| Seats | sending an invitation | `team-actions.ts` → `seatLimitMessage` |
| Seats (race-proof) | accepting an invitation | `app/auth/callback/route.ts` → `seatCapForJoining` → `join_organization` (one atomic statement, so the last seat cannot be taken twice) |

- **An organisation's plan is its owner's plan** (`billing_subscriptions` is
  keyed by the owner's user id). Seats = people in the organisation; saved
  items = rows across the three item tables. See `organisations.md`.
- **Billing off ⇒ no limits and no database reads.** With
  `BILLING_ENABLED` unset, every check returns "go ahead" immediately.
- **Fails open.** If the plan or the counts cannot be read, the person is let
  through and the error is logged — a payment-system fault must not lock a
  customer out of their own work. (Organisations do the opposite and fail
  *closed*, because there the risk is showing someone else's data.)
- **Not enforced:** the `workspaces` limit (only three workspaces hold saved
  items, so there is nothing to count yet) and the on/off **feature**
  switches (CSV export, auditable report, audit log, …): the catalogue
  defines them but no screen asks yet. Both need a decision on what "over the
  limit" looks like on screen before they are wired.
- **An owner cannot delete their account while others are still in their
  organisation**, and an account's Paystack subscription is **not** cancelled
  when its account is deleted — see "Not built yet".

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
6. **There is no way to buy yet** (see "Not built yet"): build the plan
   screen, then run the first test payment, and only then switch the keys to
   live.

## First test payment

No call has been made to Paystack from the build environment, so these are
the things to confirm with a real test-mode payment. If one is wrong, the
fix is small and local.

- The checkout request (`startCheckout`) is accepted: Paystack's
  initialise-transaction call takes `plan` and ignores `amount` when `plan`
  is set. We send a placeholder `amount`; confirm Paystack takes the plan's.
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

## Not built yet

- **Any billing screen: no plan card in Settings, no pricing page, no
  upgrade or manage/cancel buttons.** `startCheckout` exists and is tested
  but nothing calls it, so even with everything above done **nobody can buy
  a plan yet.** This is the next piece to build; it needs new text in every
  language the app offers.
- Upgrade prompts at the point of a limit (today the person sees the message
  "Your Basic plan includes up to 3 saved items… Upgrade your plan", with no
  button).
- The `workspaces` limit and the feature switches (see "Where limits are
  enforced").
- Cancelling the Paystack subscription when someone deletes their account.
  The database row is removed with the account; Paystack's is not, so a
  paying customer who deletes their account must be cancelled in Paystack by
  hand until this is built.
- Receipts, invoices, tax/VAT, refunds, failed-payment emails.
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
