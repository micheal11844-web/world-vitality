# Paystack setup guide (test mode first)

Do this in order. Steps 1–5 change nothing anyone can see; billing stays off
until step 6. Never paste a key into chat or into a file in the repo — keys go
into the Paystack dashboard's own screen and into Vercel, nowhere else.

Menu names in dashboards move around. If you cannot find something below,
use the dashboard's search box or Paystack's help centre
(<https://support.paystack.com>) for the same words.

## What you need first

- A Paystack login. **If you already have one for another project, use it —
  there is nothing to sign up for.** Read "You already use Paystack for
  another project" below before touching any settings, because one setting is
  shared and changing it would affect that project.
- The Vercel project `world-vitality` (team `micheal6`).
- The prices in `billing.md` ("The prices").

## You already use Paystack for another project

Your existing project's payments are live and working, so the aim is to
add this app **without touching anything it relies on**. The one thing that
is shared is easy to trip over: **a Paystack business has a single webhook
URL** (one for test mode, one for live mode). It currently points at your
other project. If World Vitality used the same business, there would be
nowhere to send its payment events without redirecting the other project's.

**Recommended: give World Vitality its own business under the same login.**
Paystack lets one login manage several businesses, and each keeps its own
API keys, webhook URL, plans, subscriptions, customers, settlement details
and activation status (source:
<https://support.paystack.com/en/articles/10643330>). Nothing in your
existing business changes, and the two projects' payments never mix.

1. Paystack Dashboard → click the arrow next to your business name and
   Business ID (top left) → **Add a Business**.
2. Choose **Duplicate an existing business** (it copies your compliance
   details, which saves re-entering documents; the source must be in the same
   country) or **Create a new business**.
3. Enter the trading name (for example *World Vitality*), review, and
   **Create Business**. You are switched into it; check the name at the top
   left before every step below, because every key, plan and webhook setting
   in this guide must be made **inside the World Vitality business**, not
   your existing one.
4. Test mode works in the new business **straight away** — do steps 1–5
   below now. For **live** payments the new business must be reviewed and
   activated by Paystack (even when duplicated), and you add payout details
   for it; start that from its Compliance section whenever you like. It is
   the only wait in the whole plan, and it does not block testing.

(Payout can go to the same bank account as your other business, if you want
the money in one place; that is a setting inside the new business.)

**If you would rather stay on one business**, the cost is the shared webhook:
you would have to keep one URL and make one project forward the other's
events (or put a forwarding service in front of both). That means changing
your working project, so this guide does not recommend it. For what it is
worth, World Vitality ignores events that are not its own — an unknown plan
or unknown customer is acknowledged and recorded as `ignored`, never acted
on — so forwarding the other project's events *to* it would be harmless; the
risk is on the other side.

**Either way:** do not reuse a secret key by copying it between projects
unless both genuinely use the same business, and never paste one into chat.

## 1. Get the test secret key

(Make sure you are inside the **World Vitality business** — top left.)

1. Paystack Dashboard → **Settings** → **API Keys & Webhooks**.
2. Make sure you are looking at **API Configuration – Test Mode**, not Live.
3. Click the eye icon next to **Test Secret Key** (it asks for your password).
   It starts with `sk_test_`.

Keep that tab open: you will paste it into Vercel in step 4. You do not need
the public key — the app never uses it.

## 2. Create the four plans

Dashboard (still in **test mode**) → **Products → Plans** → **New plan**. A
plan fixes the amount, the currency and how often it charges, so each price
is its own plan. Create exactly these, leaving "invoice limit" blank (charge
until cancelled):

| Name | Amount (₦) | Interval | Currency |
| --- | --- | --- | --- |
| World Vitality Standard — monthly | 7,500 | Monthly | NGN |
| World Vitality Standard — annual | 75,000 | Annually | NGN |
| World Vitality Premium — monthly | 25,000 | Monthly | NGN |
| World Vitality Premium — annual | 250,000 | Annually | NGN |

(The dashboard asks in naira. Paystack's API counts in kobo, so in the API
these are 750000, 7500000, 2500000 and 25000000.)

After saving each, open it and copy its **plan code** (it starts with
`PLN_`). Plan codes are identifiers, not secrets — it is fine to share them.

Do **not** create plans for USD or Enterprise now (see `billing.md`).

## 3. Write the plan-code list

Put the four codes into this exact shape, replacing the `PLN_…` parts. It is
one line of JSON:

```json
{"standard.NGN.monthly":"PLN_aaaa","standard.NGN.annual":"PLN_bbbb","premium.NGN.monthly":"PLN_cccc","premium.NGN.annual":"PLN_dddd"}
```

The keys are `plan.currency.interval`. The interval is spelled **`annual`**
here even though Paystack calls it "Annually" — that is how the app reads it.

## 4. Add the settings in Vercel

Vercel → project **world-vitality** → **Settings** → **Environment
Variables**. Add, for **Production** (and Preview too if you want to test
there):

| Name | Value | Notes |
| --- | --- | --- |
| `PAYSTACK_SECRET_KEY` | the `sk_test_…` key from step 1 | Tick **Sensitive** so it cannot be read back |
| `PAYSTACK_PLAN_CODES` | the one-line JSON from step 3 | Not secret |

Do **not** add `BILLING_ENABLED` yet. Environment variables only take
effect on a new deployment: after saving, redeploy (Deployments → the latest
→ ⋯ → Redeploy), or push any change.

(If you would rather not handle even the plan codes, send them to me and I
will add `PAYSTACK_PLAN_CODES` through the Vercel connector. The secret key
you add yourself — I will not take it in chat.)

## 5. Point Paystack at the webhook

In the World Vitality business: Paystack Dashboard → **Settings** → **API
Keys & Webhooks** → **Test Webhook URL**:

```
https://world-vitality.vercel.app/api/paystack/webhook
```

(Use your own domain once you have one.) Save. Paystack signs every webhook
with the secret key from step 1; there is no separate webhook secret to
copy. Live mode has its own separate webhook field — you will fill that in
again when you go live.

## 6. Switch billing on

Only when the plan screen exists (see below) — until then there is nothing
to buy:

1. Add `BILLING_ENABLED` = `true` in Vercel and redeploy.
2. **Read this first:** with billing on, everyone is on the free Basic plan
   until they subscribe. Basic allows 3 saved items and 1 person, so anyone
   who already has more simply cannot **add** more (nothing is deleted or
   hidden). With one customer so far this is harmless; with more, decide
   whether to grandfather them (set them to Standard by hand, see
   "Putting a customer on Enterprise" in `billing.md` — same SQL with
   `'standard'`).
3. Make a test payment with one of Paystack's test cards
   (<https://paystack.com/docs/payments/test-payments/>). Then check, in the
   Supabase SQL editor:

   ```sql
   select user_id, plan, status, source, paystack_subscription_code
   from public.billing_subscriptions;
   select event_type, outcome, reason, received_at
   from public.billing_events order by received_at desc limit 10;
   ```

   You want a `standard` or `premium` row with `status = 'active'`, and
   events with outcome `applied`. Anything `ignored` carries a reason —
   send it to me and it is a small fix (`billing.md`, "First test payment",
   lists what to confirm).

## Going live (later)

1. Get the World Vitality business activated (its Compliance section;
   Paystack reviews it, and you add payout details). If you skipped the
   separate business and are sharing your existing one, activation is
   already done — but see the webhook caveat above.
2. In the **live** side of that business, repeat steps 1–2 and 5: the live
   secret key (`sk_live_…`), the same four plans created again (live and
   test plans are separate, so the codes differ), and the **Live Webhook
   URL**.
3. Replace `PAYSTACK_SECRET_KEY` and `PAYSTACK_PLAN_CODES` in Vercel with the
   live values and redeploy.
4. Subscribe to Open-Meteo and set `OPEN_METEO_API_KEY` first
   (`billing.md`, "Weather data licence").

## What does not exist yet

There is **no pricing page and no upgrade button**, so even with steps 1–5
done no customer can buy. Steps 1–5 are safe and worth doing now because
they are the part only you can do (they need your Paystack account); the
plan screen is the next piece of build work. It also does not cancel a
Paystack subscription when an account is deleted — until it does, a paying
customer who deletes their account has to be cancelled in the Paystack
dashboard by hand.
