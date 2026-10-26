# Billing Runbook

Billing is built but **switched off**: nothing in the app charges anyone,
limits anyone, or reads the billing tables until `BILLING_ENABLED=true`
(BUILD_PLAN v90; the reasoning is Decision #018). This page says what
exists, what does not, and the order to turn it on.

## What exists

| Piece | Where |
| --- | --- |
| Plan catalogue (limits, features, support) | `services/billing-service/src/plans.ts` |
| "What may this person do?" rules (fail-open, grace period, read-only after a downgrade) | `services/billing-service/src/entitlements.ts` |
| Paystack signature check, event reading, plan-code mapping, checkout request | `services/billing-service/src/paystack.ts` |
| How Paystack events change a subscription | `services/billing-service/src/subscription.ts` |
| The webhook, from raw bytes to stored result | `services/billing-service/src/webhook.ts` |
| Storage (Supabase + an in-memory one for tests) | `services/billing-service/src/store.ts` |
| Webhook route | `apps/web/app/api/paystack/webhook/route.ts` |
| Switchboard (`billingEnabled`, plan codes, `getEntitlementsForUser`) | `apps/web/lib/billing.ts` |
| Tables (not applied yet) | `services/identity-service/supabase/migrations/0017_billing.sql` |
| Settings to fill in | `services/billing-service/.env.example` |

## The plans

`null` = no cap (Enterprise terms are agreed per customer). Prices are not
set; they live in Paystack's plan objects.

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

## Before limits can be enforced

Today every workspace is a single shared copy keyed by its name, so there
is no customer for a seat, saved-item or workspace limit to count against,
and every signed-in user can see everyone's saved fields, properties,
locations and field comments. The plan system is therefore **not** called
from any write path (inviting a member, adding a field/property/location,
opening a report). `getEntitlementsForUser` is the call to make from those
places once saved places belong to an organisation. Fixing that ownership
is needed for privacy whether or not billing is ever switched on.

## Turning it on, in this order

1. **Apply migration 0017** (SQL editor or `supabase db push`). Nothing reads
   the tables until step 4, so this is safe to do early.
2. **Create plans in Paystack — test mode first.** Dashboard → Products →
   Plans. A plan fixes the amount, currency and interval, so Standard and
   Premium each need one plan per currency and interval you want to sell.
3. **Add the settings in Vercel** (Project Settings → Environment Variables;
   never in chat or in a file in the repo): `PAYSTACK_SECRET_KEY` (the
   `sk_test_…` key while testing) and `PAYSTACK_PLAN_CODES` (JSON, format in
   `.env.example`). Leave `BILLING_ENABLED` unset for now.
4. **Point Paystack at the webhook:** Dashboard → Settings → API Keys &
   Webhooks → `https://<your-domain>/api/paystack/webhook`. Paystack signs
   with the secret key; there is no separate webhook secret.
5. **Set `BILLING_ENABLED=true`** and redeploy. The webhook now verifies and
   records events. Nobody can buy anything yet (see "Not built").
6. Run the first test payment (below). Only then switch the keys to live.

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

- Any screen: no plan card in Settings, no pricing page, no upgrade or
  manage/cancel buttons. `startCheckout` exists and is tested but nothing
  calls it. Building these needs new text in every language the app offers.
- Limit enforcement (see above) and upgrade prompts at the point of a limit.
- Cancelling the Paystack subscription when someone deletes their account.
  The database row is removed with the account; Paystack's is not.
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

## Housekeeping

`billing_events` holds a key, the event name and the outcome — no payloads.
Paystack stops retrying after 72 hours, so rows older than a month can be
deleted:

```sql
delete from public.billing_events where received_at < now() - interval '30 days';
```
