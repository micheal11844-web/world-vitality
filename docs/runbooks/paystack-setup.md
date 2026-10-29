# Paystack setup guide (test mode first)

Do this in order. Steps 1–5 change nothing anyone can see; billing stays off
until step 6. Never paste a key into chat or into a file in the repo — keys go
into the Paystack dashboard's own screen and into Vercel, nowhere else.

Menu names in dashboards move around. If you cannot find something below,
use the dashboard's search box or Paystack's help centre
(<https://support.paystack.com>) for the same words.

## What you need first

- A Paystack account (sign up at <https://paystack.com>). **Test mode works
  straight away** with no business verification. Charging real money
  ("Live mode") needs your account to be activated, which means giving
  Paystack your business details and documents — follow the dashboard's
  go-live prompts when you get there. You do not need that for any step here.
- The Vercel project `world-vitality` (team `micheal6`).
- The prices in `billing.md` ("The prices").

## 1. Get the test secret key

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

Paystack Dashboard → **Settings** → **API Keys & Webhooks** → **Test Webhook
URL**:

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

1. Activate the Paystack account (business details and documents).
2. Repeat steps 1–2 and 5 in **Live mode**: the live secret key (`sk_live_…`),
   the same four plans created again (live and test plans are separate, so
   the codes differ), and the **Live Webhook URL**.
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
